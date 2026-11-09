#!/usr/bin/env node
// Architecture check: runs dependency-cruiser with the rules in .dependency-cruiser.cjs.
// When dependency-cruiser cannot read the sources (e.g. the configured parser is not installed, or the parser does not
// support the installed TypeScript version), it does not fail but passes with "0 modules, 0 violations",
// so analyzing no modules at all counts as a failure here.
// When an existing project joins, existing violations can be recorded as a baseline (.dependency-cruiser-known-violations.json):
// old violations in the baseline do not fail, new ones still do. Regenerate the baseline after fixing old violations; it only shrinks.
// Usage: node scripts/arch-check.mjs [source directory, default src]
//        node scripts/arch-check.mjs --baseline [source directory]   record or update the baseline
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const BASELINE = '.dependency-cruiser-known-violations.json';
const args = process.argv.slice(2);
const writeBaseline = args[0] === '--baseline';
const sourceDir = (writeBaseline ? args[1] : args[0]) ?? 'src';

const depcruise = (extra) =>
  spawnSync('npx', ['--no-install', 'depcruise', sourceDir, '--config', '.dependency-cruiser.cjs', ...extra], {
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    shell: process.platform === 'win32',
  });

if (writeBaseline) {
  const result = depcruise(['--output-type', 'baseline', '--output-to', BASELINE]);
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  console.log(`Existing violations recorded in ${BASELINE}. New violations still fail the check.`);
  process.exit(0);
}

const useBaseline = existsSync(BASELINE);
const result = depcruise(['--output-type', 'json', ...(useBaseline ? ['--ignore-known', BASELINE] : [])]);

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  console.error(`dependency-cruiser did not run properly:\n${result.stderr || result.stdout}`);
  process.exit(1);
}

const { summary } = report;
if (summary.totalCruised === 0) {
  console.error(
    `The architecture check analyzed no modules, so nothing was checked. Common causes: the parser configured in ` +
      `.dependency-cruiser.cjs is not installed (parser: 'swc' needs @swc/core), the parser does not support the ` +
      `installed TypeScript version, or the source directory (${sourceDir}) is wrong.\n${result.stderr}`,
  );
  process.exit(1);
}

const errors = summary.violations.filter((v) => v.rule.severity === 'error');
for (const v of errors) {
  console.error(`error ${v.rule.name}: ${v.from} → ${v.to}`);
}
const ignored = summary.ignore ?? 0;
console.log(
  `Architecture check: ${summary.totalCruised} modules analyzed, ${errors.length} violations` +
    (useBaseline ? ` (plus ${ignored} known violations in the baseline, see ${BASELINE})` : '') +
    '.',
);
process.exit(errors.length > 0 ? 1 : 0);
