#!/usr/bin/env node
// Scores the AI reviewer: hands it changes that really contained bugs (and changes confirmed to be fine) again,
// and counts how many bugs it catches and how many false alarms it raises on clean changes. Run it after changing REVIEW.md,
// CLAUDE.md or the model; if the score did not improve, revert the change. Each run appends its result to evals/results.jsonl.
//
// Usage: node evals/run-review-evals.mjs [case id ...]
// Environment variables: EVAL_MODEL sets the model; EVAL_LINE_TOLERANCE the allowed line deviation, 10 by default.
import { readFileSync, readdirSync, appendFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const evalsDir = dirname(fileURLToPath(import.meta.url));
const casesDir = join(evalsDir, 'review-cases');
const resultsFile = join(evalsDir, 'results.jsonl');
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const lineTolerance = Number(process.env.EVAL_LINE_TOLERANCE ?? 10);
const model = process.env.EVAL_MODEL;
const maxBuffer = 64 * 1024 * 1024;

function parseCase(path) {
  const text = readFileSync(path, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`${path}: missing the metadata between --- lines at the top`);
  const meta = { expect: 'bug' };
  for (const line of match[1].split(/\r?\n/)) {
    const field = line.match(/^(\w+):\s*(.*)$/);
    if (field) meta[field[1]] = field[2].trim();
  }
  if (!meta.id) throw new Error(`${path}: missing id`);
  if (!['bug', 'clean'].includes(meta.expect)) throw new Error(`${path}: expect must be bug or clean`);
  if (meta.expect === 'bug' && !(meta.file && meta.line)) throw new Error(`${path}: bug cases need file and line`);
  return meta;
}

function diffFor(c) {
  const options = { cwd: repoRoot, encoding: 'utf8', maxBuffer };
  if (c.pr) return execFileSync('gh', ['pr', 'diff', c.pr], options);
  if (c.base && c.head) return execFileSync('git', ['diff', c.base, c.head], options);
  throw new Error('needs pr, or both base and head');
}

function readRepoFile(name) {
  const path = join(repoRoot, name);
  return existsSync(path) ? readFileSync(path, 'utf8') : '(none)';
}

function buildPrompt(diff) {
  return [
    "You are this project's code reviewer. Below are the project conventions (CLAUDE.md), the review standards (REVIEW.md) and a diff to review.",
    'Find the real problems this diff introduces and judge their severity as REVIEW.md says.',
    'Output only a JSON array and nothing else. Each element has the form:',
    '{"file": "path relative to the repository root", "line": line number in the changed file, "severity": "Important" | "Nit" | "Pre-existing", "summary": "one sentence"}',
    'Output [] when there are no problems.',
    '',
    '=== CLAUDE.md ===',
    readRepoFile('CLAUDE.md'),
    '',
    '=== REVIEW.md ===',
    readRepoFile('REVIEW.md'),
    '',
    '=== diff ===',
    diff,
  ].join('\n');
}

function runClaude(args, input) {
  const options = { input, cwd: repoRoot, encoding: 'utf8', maxBuffer };
  // On Windows claude may be a .cmd wrapper that only starts through a shell, so the arguments are quoted into one command.
  if (process.platform === 'win32') {
    return spawnSync(['claude', ...args.map((arg) => `"${arg}"`)].join(' '), { ...options, shell: true });
  }
  return spawnSync('claude', args, options);
}

function review(prompt) {
  const result = runClaude(['-p', '--output-format', 'json', ...(model ? ['--model', model] : [])], prompt);
  if (result.status !== 0) throw new Error(`claude failed: ${result.stderr || result.stdout}`);
  const text = JSON.parse(result.stdout).result ?? '';
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < start) throw new Error(`The reviewer returned no JSON array: ${text.slice(0, 200)}`);
  return JSON.parse(text.slice(start, end + 1));
}

const normalizePath = (path) => String(path).replaceAll('\\', '/').replace(/^\.\//, '');

function score(c, findings) {
  const important = findings.filter((f) => f.severity === 'Important');
  if (c.expect === 'clean') {
    return { pass: important.length === 0, detail: `${important.length} false Important findings` };
  }
  const hit = important.find(
    (f) => normalizePath(f.file) === normalizePath(c.file) && Math.abs(Number(f.line) - Number(c.line)) <= lineTolerance,
  );
  return {
    pass: Boolean(hit),
    detail: hit ? hit.summary : `no Important finding near ${c.file}:${c.line} (${findings.length} findings in total)`,
  };
}

const only = new Set(process.argv.slice(2));
const cases = readdirSync(casesDir)
  .filter((name) => name.endsWith('.md') && !name.startsWith('_'))
  .map((name) => parseCase(join(casesDir, name)))
  .filter((c) => only.size === 0 || only.has(c.id));

if (cases.length === 0) {
  console.log('evals/review-cases/ has no cases yet. Copy _template.md to write one.');
  process.exit(0);
}

const rows = [];
for (const c of cases) {
  let row;
  try {
    row = { id: c.id, expect: c.expect, ...score(c, review(buildPrompt(diffFor(c)))) };
  } catch (error) {
    row = { id: c.id, expect: c.expect, pass: false, detail: `error: ${error.message}` };
  }
  rows.push(row);
  console.log(`${row.pass ? '✓' : '✗'} ${row.id} [${row.expect}] ${row.detail}`);
}

const bugRows = rows.filter((r) => r.expect === 'bug');
const cleanRows = rows.filter((r) => r.expect === 'clean');
const caught = bugRows.filter((r) => r.pass).length;
const quiet = cleanRows.filter((r) => r.pass).length;
console.log(`\nBugs caught: ${caught}/${bugRows.length}   Clean changes without false alarms: ${quiet}/${cleanRows.length}`);

const reviewMd = join(repoRoot, 'REVIEW.md');
appendFileSync(resultsFile, `${JSON.stringify({
  date: new Date().toISOString(),
  model: model ?? 'default',
  reviewMd: existsSync(reviewMd) ? execFileSync('git', ['hash-object', reviewMd], { encoding: 'utf8' }).trim() : null,
  caught,
  bugs: bugRows.length,
  quiet,
  cleans: cleanRows.length,
  failed: rows.filter((r) => !r.pass).map((r) => r.id),
})}\n`);
