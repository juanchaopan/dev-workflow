#!/usr/bin/env node
// Looks versions up when a project is created, so no version number is ever hard-coded in the plugin:
// a project created today gets today's versions, one created later gets later versions.
// Usage:
//   node versions.mjs lts <product>         the current long-term support release of a runtime, e.g. nodejs → 24,
//                                           eclipse-temurin → 25, dotnet → 10. Products without an LTS concept (e.g. python)
//                                           get the latest stable release. Data from https://endoflife.date.
//   node versions.mjs npm <package> <tool>...  the highest stable version of an npm package that the latest release of
//                                           every given tool declares support for (peerDependencies or supportedTranspilers
//                                           in its package.json). E.g. `npm typescript typescript-eslint`: when TypeScript
//                                           ships a new major and the tool has not caught up, the previous major comes back;
//                                           once the tool catches up, the new major does.
// The version goes to standard output; the constraints used go to standard error.
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

// npm view --json results: for a single field some npm versions return the value and others a one-element array;
// for the version of a range they return the list of matching versions.
export const asList = (value) => (value === undefined ? [] : [value].flat());
export const asSingle = (value) => (Array.isArray(value) && value.length === 1 ? value[0] : value);

function npmView(args) {
  const command = ['npm', 'view', ...args.map((a) => `"${a}"`), '--json'].join(' ');
  const result = spawnSync(command, { shell: true, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr}`);
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
      console.error(`${tool} supports ${pkg} ${range}`);
      ranges.push(range);
    }
  }
  const version = pickCompatible(ranges.map((range) => asList(npmView([`${pkg}@${range}`, 'version']))));
  if (!version) throw new Error(`No version of ${pkg} satisfies all of: ${ranges.join('; ')}`);
  if (version !== latest) console.error(`The latest ${pkg} is ${latest}; not every tool supports it yet, so ${version} is used`);
  return version;
}

async function ltsVersion(product) {
  const response = await fetch(`https://endoflife.date/api/${product}.json`);
  if (!response.ok) throw new Error(`Cannot look up ${product}: endoflife.date returned ${response.status}`);
  const version = pickLts(await response.json(), new Date().toISOString().slice(0, 10));
  if (!version) throw new Error(`${product} has no released version`);
  return version;
}

async function main([mode, name, ...tools]) {
  if (mode === 'lts' && name) return ltsVersion(name);
  if (mode === 'npm' && name) return compatibleNpmVersion(name, tools);
  throw new Error('Usage: node versions.mjs lts <product> | node versions.mjs npm <package> <tool>...');
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
