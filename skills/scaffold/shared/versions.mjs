#!/usr/bin/env node
// 搭项目时现查版本，插件里不写死任何版本号：今天搭出来的项目用今天的版本，以后搭的用以后的版本。
// 用法：
//   node versions.mjs lts <产品>          运行时当前的长期支持版本（LTS），例如 nodejs → 24、eclipse-temurin → 25、dotnet → 10。
//                                         没有 LTS 说法的产品（例如 python）取最新的稳定版本。数据来自 https://endoflife.date。
//   node versions.mjs npm <包> <工具>...   npm 包能用的最高稳定版本：给出的每个工具的最新版都声明支持它
//                                         （package.json 的 peerDependencies 或 supportedTranspilers）。
//                                         例如 `npm typescript typescript-eslint dependency-cruiser`：TypeScript 出了新的大版本、
//                                         而这些工具还没跟上时，得到上一个大版本；工具跟上以后，自动得到新版本。
// 版本号输出到标准输出，用了哪些限制写到标准错误。
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function pickLts(cycles, today) {
  const released = cycles
    .filter((c) => !c.releaseDate || c.releaseDate <= today)
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
  const isLts = (c) => c.lts === true || (typeof c.lts === 'string' && c.lts <= today);
  const hasLtsConcept = cycles.some((c) => c.lts);
  const cycle = hasLtsConcept ? released.find(isLts) : released[0];
  return cycle ? String(cycle.cycle) : undefined;
}

export function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const isStable = (version) => /^\d+\.\d+\.\d+$/.test(version);

export function pickCompatible(allowedLists) {
  const [first = [], ...rest] = allowedLists;
  const others = rest.map((list) => new Set(list));
  const candidates = first.filter((v) => isStable(v) && others.every((set) => set.has(v)));
  return candidates.sort(compareVersions).at(-1);
}

export function supportRanges(info, pkg) {
  return [info.peerDependencies?.[pkg], info.supportedTranspilers?.[pkg]].filter(Boolean);
}

// npm view --json 的结果：查一个字段时，有的 npm 版本直接给值，有的包成只有一个元素的数组；查一个范围的 version 时给版本列表。
export const asList = (value) => (value === undefined ? [] : [value].flat());
export const asSingle = (value) => (Array.isArray(value) && value.length === 1 ? value[0] : value);

function npmView(args) {
  const command = ['npm', 'view', ...args.map((a) => `"${a}"`), '--json'].join(' ');
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} 失败：\n${result.stderr}`);
  const text = result.stdout.trim();
  return text ? JSON.parse(text) : undefined;
}

const npmField = (pkg, field) => asSingle(npmView([pkg, field]));

function compatibleNpmVersion(pkg, tools) {
  const latest = npmField(pkg, 'dist-tags.latest');
  const ranges = [`<=${latest}`];
  for (const tool of tools) {
    const info = { peerDependencies: npmField(tool, 'peerDependencies'), supportedTranspilers: npmField(tool, 'supportedTranspilers') };
    for (const range of supportRanges(info, pkg)) {
      console.error(`${tool} 支持 ${pkg} ${range}`);
      ranges.push(range);
    }
  }
  const version = pickCompatible(ranges.map((range) => asList(npmView([`${pkg}@${range}`, 'version']))));
  if (!version) throw new Error(`没有同时满足这些范围的 ${pkg} 版本：${ranges.join('；')}`);
  if (version !== latest) console.error(`${pkg} 的最新版是 ${latest}，工具链还没全部支持，用 ${version}`);
  return version;
}

async function ltsVersion(product) {
  const response = await fetch(`https://endoflife.date/api/${product}.json`);
  if (!response.ok) throw new Error(`查不到 ${product}：endoflife.date 返回 ${response.status}`);
  const version = pickLts(await response.json(), new Date().toISOString().slice(0, 10));
  if (!version) throw new Error(`${product} 没有已发布的版本`);
  return version;
}

async function main([mode, name, ...tools]) {
  if (mode === 'lts' && name) return ltsVersion(name);
  if (mode === 'npm' && name) return compatibleNpmVersion(name, tools);
  throw new Error('用法：node versions.mjs lts <产品> | node versions.mjs npm <包> <工具>...');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then(
    (version) => console.log(version),
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
