#!/usr/bin/env node
// Claude Code PostToolUse hook: after Claude changes a file, runs the format and lint commands of the matching rule in format.config.json.
// Rules match by extension and directory: the file must be inside the rule's dir, and when several match the deepest dir wins,
// so each component of a monorepo uses the tools and configuration in its own directory. Commands run in the rule's dir.
// A failed format does not block (usually the tool is missing or the file type is unsupported); a lint failure exits with code 2,
// and Claude Code hands the error output to Claude to keep fixing.
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, relative, resolve, isAbsolute } from 'node:path';
import { spawnSync } from 'node:child_process';

const input = JSON.parse(readFileSync(0, 'utf8') || '{}');
const file = input.tool_input?.file_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? input.cwd ?? process.cwd();
const configPath = join(projectDir, '.claude', 'hooks', 'format.config.json');

if (!file || !existsSync(file) || !existsSync(configPath)) process.exit(0);

const inside = (dir, target) => {
  const rel = relative(dir, target);
  return !rel.startsWith('..') && !isAbsolute(rel);
};
if (!inside(projectDir, file)) process.exit(0);

const { rules = [] } = JSON.parse(readFileSync(configPath, 'utf8'));
const ext = extname(file).toLowerCase();
const match = rules
  .map((rule) => ({ rule, dir: resolve(projectDir, rule.dir ?? '.') }))
  .filter(({ rule, dir }) => rule.extensions.includes(ext) && inside(dir, file))
  .sort((a, b) => b.dir.length - a.dir.length)[0];
if (!match) process.exit(0);

const { rule, dir } = match;
const relFile = relative(dir, file).replaceAll('\\', '/');
const run = (command) =>
  spawnSync(command.replaceAll('{file}', `"${file}"`).replaceAll('{relfile}', `"${relFile}"`), {
    shell: true,
    cwd: dir,
    encoding: 'utf8',
  });

if (rule.format) run(rule.format);

if (rule.lint) {
  const result = run(rule.lint);
  if (result.status !== 0) {
    process.stderr.write(
      `${relative(projectDir, file)} failed lint (ran ${rule.lint} in ${relative(projectDir, dir) || '.'}):\n` +
        `${result.stdout ?? ''}${result.stderr ?? ''}`,
    );
    process.exit(2);
  }
}
