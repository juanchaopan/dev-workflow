#!/usr/bin/env node
// 架构检查：用 dependency-cruiser 按 .dependency-cruiser.cjs 的规则检查模块之间的依赖。
// dependency-cruiser 读不懂源码时（例如装了它还不支持的 TypeScript 版本）不会报错，而是"0 个模块、0 个违规"地通过，
// 所以这里一个模块都没分析到时也算失败。
// 用法：node scripts/arch-check.mjs [源码目录，默认 src]
import { spawnSync } from 'node:child_process';

const sourceDir = process.argv[2] ?? 'src';
const result = spawnSync(
  'npx',
  ['--no-install', 'depcruise', sourceDir, '--config', '.dependency-cruiser.cjs', '--output-type', 'json'],
  { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, shell: process.platform === 'win32' },
);

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(`dependency-cruiser 没有正常运行：\n${result.stderr || result.stdout}`);
  process.exit(1);
}

const { summary } = report;
if (summary.totalCruised === 0) {
  console.error(
    `架构检查没有分析到任何模块，检查等于没做。常见原因：装了 dependency-cruiser 还不支持的 TypeScript 版本，` +
      `或者源码目录（${sourceDir}）不对。\n${result.stderr}`,
  );
  process.exit(1);
}

const errors = summary.violations.filter((v) => v.rule.severity === 'error');
for (const v of summary.violations) {
  console.error(`${v.rule.severity} ${v.rule.name}: ${v.from} → ${v.to}`);
}
console.log(`架构检查：分析了 ${summary.totalCruised} 个模块，${errors.length} 个违规。`);
process.exit(errors.length > 0 ? 1 : 0);
