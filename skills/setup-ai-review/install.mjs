#!/usr/bin/env node
// Copies every file under template/ into the target repository, keeping relative paths.
// Files that already exist in the target are always skipped, never overwritten; the caller merges them one by one.
// Usage: node install.mjs <target repository root>
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'template');
const targetDir = resolve(process.argv[2] ?? process.cwd());

if (!existsSync(join(targetDir, '.git'))) {
  console.error(`${targetDir} is not the root of a git repository`);
  process.exit(1);
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

const copied = [];
const skipped = [];
for (const source of walk(templateDir)) {
  const rel = relative(templateDir, source).replaceAll('\\', '/');
  const dest = join(targetDir, rel);
  if (existsSync(dest)) {
    skipped.push(rel);
    continue;
  }
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(source, dest);
  copied.push(rel);
}

console.log(JSON.stringify({ target: targetDir, copied, skipped }, null, 2));
