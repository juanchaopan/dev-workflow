#!/usr/bin/env node
// 把 template/ 下的全部文件复制到目标仓库，保持相对路径不变。
// 目标里已有的同名文件一律跳过、不覆盖，交给调用方逐个合并。
// 用法：node install.mjs <目标仓库根目录>
import { readdirSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const templateDir = join(dirname(fileURLToPath(import.meta.url)), 'template');
const targetDir = resolve(process.argv[2] ?? process.cwd());

if (!existsSync(join(targetDir, '.git'))) {
  console.error(`${targetDir} 不是 git 仓库的根目录`);
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
