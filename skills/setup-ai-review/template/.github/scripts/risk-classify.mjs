#!/usr/bin/env node
// Assigns a PR its risk tier and decides whether this commit already has a human's confirmation.
// Runs in GitHub Actions: reads the files the PR changes, compares them with .github/risk-rules.txt to get low / medium / high,
// and applies the matching risk:* label. A human confirmation covers only the commit that was looked at, so a new commit on the PR
// counts as unconfirmed and removes the human-reviewed label.
// Release PRs (release/* branches) are always high risk; PRs in the same repository merging back from main or master are low risk.
// PRs from forks and Dependabot get a read-only token: then the tier is computed but labels are left alone; the result is still output.
// Results go to tier and approved in GITHUB_OUTPUT for later jobs.
//
// Try the rules locally: node .github/scripts/risk-classify.mjs --dry-run [--head <branch>] <file path> ...
import { readFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RULES_FILE = join(dirname(fileURLToPath(import.meta.url)), '..', 'risk-rules.txt');
const APPROVAL_LABEL = 'human-reviewed';
const LABELS = {
  'risk:low': { color: '0e8a16', description: 'Low risk: merges once the automatic checks pass' },
  'risk:medium': { color: 'fbca04', description: 'Medium risk: needs a human confirmation' },
  'risk:high': { color: 'b60205', description: 'High risk: needs a careful human confirmation' },
  [APPROVAL_LABEL]: { color: '5319e7', description: 'I have reviewed the changes of this commit myself' },
};

function globToRegExp(pattern) {
  let source = '';
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*' && pattern[i + 2] === '/') {
      source += '(?:.*/)?';
      i += 2;
    } else if (c === '*' && pattern[i + 1] === '*') {
      source += '.*';
      i += 1;
    } else if (c === '*') {
      source += '[^/]*';
    } else if (c === '?') {
      source += '[^/]';
    } else {
      source += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${source}$`);
}

function loadRules() {
  const rules = { high: [], low: [] };
  let section = null;
  for (const raw of readFileSync(RULES_FILE, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const header = line.match(/^\[(high|low)\]$/);
    if (header) {
      section = header[1];
    } else if (!section) {
      throw new Error(`risk-rules.txt: "${line}" is not under [high] or [low]`);
    } else {
      rules[section].push({ pattern: line, re: globToRegExp(line) });
    }
  }
  return rules;
}

function classify(files, rules, { headRef = '', sameRepo = true } = {}) {
  if (headRef.startsWith('release/')) {
    return { tier: 'high', reasons: [`Release PR (${headRef}): merging is releasing, so you confirm it`] };
  }
  if (sameRepo && (headRef === 'main' || headRef === 'master')) {
    return { tier: 'low', reasons: [`Merging back from ${headRef}: the content was already reviewed on ${headRef}`] };
  }
  const match = (file, list) => list.find((rule) => rule.re.test(file));
  const high = files.flatMap((file) => {
    const rule = match(file, rules.high);
    return rule ? [`${file} (matches ${rule.pattern})`] : [];
  });
  if (high.length > 0) return { tier: 'high', reasons: high };
  const notLow = files.filter((file) => !match(file, rules.low));
  if (notLow.length === 0) return { tier: 'low', reasons: ['Every change is under a [low] path'] };
  return { tier: 'medium', reasons: notLow.map((file) => `${file} (not under a [low] path)`) };
}

const rules = loadRules();

if (process.argv[2] === '--dry-run') {
  const args = process.argv.slice(3);
  const headIndex = args.indexOf('--head');
  const headRef = headIndex >= 0 ? args.splice(headIndex, 2)[1] : '';
  const { tier, reasons } = classify(args, rules, { headRef });
  console.log([tier, ...reasons.map((reason) => `  ${reason}`)].join('\n'));
  process.exit(0);
}

const { REPO, PR_NUMBER, EVENT_ACTION, HEAD_REF, HEAD_REPO, GITHUB_OUTPUT, GITHUB_STEP_SUMMARY } = process.env;
const gh = (...args) => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const lines = (text) => text.split('\n').filter(Boolean);
const issue = `repos/${REPO}/issues/${PR_NUMBER}`;

const files = lines(gh('api', `repos/${REPO}/pulls/${PR_NUMBER}/files`, '--paginate', '--jq', '.[].filename'));
const labels = lines(gh('api', `${issue}/labels`, '--paginate', '--jq', '.[].name'));
const { tier, reasons } = classify(files, rules, { headRef: HEAD_REF ?? '', sameRepo: HEAD_REPO === REPO });
const tierLabel = `risk:${tier}`;
const newCommit = EVENT_ACTION === 'synchronize';
const approved = labels.includes(APPROVAL_LABEL) && !newCommit;

function syncLabels() {
  for (const [name, { color, description }] of Object.entries(LABELS)) {
    gh('label', 'create', name, '--repo', REPO, '--color', color, '--description', description, '--force');
  }
  const removeLabel = (name) => gh('api', '--method', 'DELETE', `${issue}/labels/${encodeURIComponent(name)}`);
  for (const name of labels.filter((name) => name.startsWith('risk:') && name !== tierLabel)) removeLabel(name);
  if (!labels.includes(tierLabel)) gh('api', '--method', 'POST', `${issue}/labels`, '-f', `labels[]=${tierLabel}`);
  if (newCommit && labels.includes(APPROVAL_LABEL)) {
    removeLabel(APPROVAL_LABEL);
    gh('api', '--method', 'POST', `${issue}/comments`, '-f',
      `body=The PR has new commits, so the \`${APPROVAL_LABEL}\` label was removed. Add it again once you have reviewed the new changes.`);
  }
}

let labelNote = '';
try {
  syncLabels();
} catch (error) {
  labelNote = `The token has no write access (a PR from a fork or Dependabot), so labels were not updated: ${String(error.stderr ?? error.message).trim()}`;
  console.warn(labelNote);
}

const confirmation =
  tier === 'low'
    ? 'not needed'
    : approved
      ? 'confirmed'
      : `not yet (needs the ${APPROVAL_LABEL} label${newCommit ? ', added again after new commits' : ''})`;

appendFileSync(GITHUB_OUTPUT, `tier=${tier}\napproved=${approved}\n`);
appendFileSync(GITHUB_STEP_SUMMARY, [
  `### Risk tier: ${tier}`,
  '',
  ...reasons.slice(0, 50).map((reason) => `- ${reason}`),
  '',
  `Human confirmation: ${confirmation}`,
  labelNote ? `\n${labelNote}` : '',
  '',
].join('\n'));
