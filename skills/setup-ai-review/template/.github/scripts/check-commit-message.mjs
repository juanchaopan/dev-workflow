#!/usr/bin/env node
// Checks that commit messages follow Conventional Commits: <type>(<scope>)!: <description>
// Locally, .githooks/commit-msg calls: node check-commit-message.mjs --file <commit message file>
// CI checks every commit of a PR: node check-commit-message.mjs --range <base>..<head>
// Merge commits and git-generated Revert commits are not checked. fixup! and squash! commits are allowed locally
// (they get squashed later) but not in CI.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const TYPES = ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'];
const MAX_HEADER_LENGTH = 100;
const HEADER = new RegExp(`^(${TYPES.join('|')})(\\([^()\\s][^()]*\\))?!?: \\S`);
const EXAMPLE = 'feat(auth): support e-mail sign-in (#12)';
const EXEMPT = Symbol('exempt');

function meaningfulLines(message) {
  const lines = message.split(/\r?\n/).filter((line) => !line.startsWith('#'));
  while (lines.length > 0 && lines[0].trim() === '') lines.shift();
  return lines;
}

function exemption(header, allowFixups) {
  if (/^Merge /.test(header) || /^Revert "/.test(header)) return EXEMPT;
  if (/^(fixup|squash|amend)! /.test(header)) {
    return allowFixups ? EXEMPT : 'fixup!/squash! commits must be squashed before merging';
  }
  return undefined;
}

function check(message, { allowFixups }) {
  const lines = meaningfulLines(message);
  const header = (lines[0] ?? '').trim();
  if (header === '') return 'The commit message is empty';
  const exempt = exemption(header, allowFixups);
  if (exempt !== undefined) return exempt === EXEMPT ? null : exempt;
  if (!HEADER.test(header)) {
    return `The first line must read "<type>(<scope>): <description>" with a type out of ${TYPES.join(', ')}, e.g. ${EXAMPLE}`;
  }
  if ([...header].length > MAX_HEADER_LENGTH) return `The first line is longer than ${MAX_HEADER_LENGTH} characters`;
  if (lines.length > 1 && lines[1].trim() !== '') return 'Leave a blank line between the first line and the body';
  return null;
}

const [mode, value] = process.argv.slice(2);
const failures = [];

if (mode === '--file' && value) {
  const error = check(readFileSync(value, 'utf8'), { allowFixups: true });
  if (error) failures.push({ id: 'this commit', error });
} else if (mode === '--range' && value) {
  const log = execFileSync('git', ['log', '--format=%H%x00%B%x1e', value], { encoding: 'utf8' });
  for (const record of log.split('\x1e')) {
    const [hash, body] = record.replace(/^\s+/, '').split('\x00');
    if (!hash) continue;
    const error = check(body ?? '', { allowFixups: false });
    if (error) failures.push({ id: hash.slice(0, 8), error, header: (body ?? '').split('\n')[0] });
  }
} else {
  console.error('Usage: check-commit-message.mjs --file <commit message file> | --range <base>..<head>');
  process.exit(1);
}

if (failures.length > 0) {
  for (const { id, error, header } of failures) {
    console.error(`✗ ${id}${header ? ` "${header}"` : ''}: ${error}`);
  }
  process.exit(1);
}
