#!/usr/bin/env node
// SessionStart hook: points this clone's git hooks at the committed .githooks directory, so .githooks/commit-msg checks every
// commit message as it is made.
// core.hooksPath lives in each clone's own git configuration and never travels with the repository, so a new clone, another
// machine or a cloud session starts without it. Claude Code runs this at the start of every session; it sets the value once and
// is silent afterwards. A hooks directory the clone already uses for something else (e.g. .husky) is left alone and reported.
// It never blocks the session: whatever it prints goes to Claude as context, and the exit code is always 0.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const HOOKS_DIR = '.githooks';
const PUSH_CHECK = 'node .github/scripts/check-commit-message.mjs --range origin/<target branch>..HEAD';
const cwd = process.env.CLAUDE_PROJECT_DIR || process.cwd();

function git(...args) {
  try {
    return { ok: true, out: execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim() };
  } catch (error) {
    return { ok: false, out: String(error.stderr || error.message).trim() };
  }
}

function main() {
  const root = git('rev-parse', '--show-toplevel');
  if (!root.ok || !existsSync(join(root.out, HOOKS_DIR, 'commit-msg'))) return;

  const configured = git('config', '--get', 'core.hooksPath');
  const current = configured.ok ? configured.out : '';
  if (current !== '' && resolve(root.out, current) === resolve(root.out, HOOKS_DIR)) return;

  if (current !== '') {
    console.log(
      `This clone's core.hooksPath is "${current}", so ${HOOKS_DIR}/commit-msg does not check commit messages on commit. ` +
        `Run ${PUSH_CHECK} after every commit and before every push, and tell the user, who can move their hooks into ` +
        `${HOOKS_DIR} and run: git config core.hooksPath ${HOOKS_DIR}`,
    );
    return;
  }

  const set = git('config', 'core.hooksPath', HOOKS_DIR);
  console.log(
    set.ok
      ? `Set core.hooksPath to ${HOOKS_DIR} for this clone, so ${HOOKS_DIR}/commit-msg checks every commit message.`
      : `Could not set core.hooksPath (${set.out}), so commit messages are not checked on commit. Run ${PUSH_CHECK} after ` +
          `every commit and before every push, and ask the user to run: git config core.hooksPath ${HOOKS_DIR}`,
  );
}

main();
