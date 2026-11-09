// Unit tests for the scripts the plugin installs into projects or runs inside them:
// commit message check, risk tiers, format hook, installer, screen rendering, current-system screen capture, version lookup.
// Run: node --test "tests/*.test.mjs"
// The real screenshot tests download Chromium and only run with RENDER_SMOKE=1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_SIZE, collectScreens, openCommand, parseSize, pngPathFor, sizeOf } from '../skills/design/render-screens.mjs';
import { captureArgs, parseArgs, readList } from '../skills/onboard/capture-screens.mjs';
import { asList, asSingle, compareVersions, pickCompatible, pickLts, supportRanges } from '../skills/scaffold/shared/versions.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const template = join(root, 'skills', 'setup-ai-review', 'template');
const commitCheck = join(template, '.github', 'scripts', 'check-commit-message.mjs');
const riskClassify = join(template, '.github', 'scripts', 'risk-classify.mjs');
const formatHook = join(template, '.claude', 'hooks', 'format.mjs');
const installer = join(root, 'skills', 'setup-ai-review', 'install.mjs');
const renderScreens = join(root, 'skills', 'design', 'render-screens.mjs');
const captureScreens = join(root, 'skills', 'onboard', 'capture-screens.mjs');
const renderSmoke = {
  skip: process.env.RENDER_SMOKE ? false : 'runs only with RENDER_SMOKE=1 (downloads Chromium)',
  timeout: 300_000,
};

const tempDir = () => mkdtempSync(join(tmpdir(), 'dev-workflow-test-'));
const run = (command, args, options = {}) => spawnSync(command, args, { encoding: 'utf8', ...options });
const pngSize = (file) => {
  const png = readFileSync(file);
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
};

test('commit message: valid messages pass', () => {
  const dir = tempDir();
  for (const message of [
    'feat(auth): support sign-in for café accounts (#12)',
    'fix: handle empty list',
    'feat(api)!: remove the old endpoint',
    'chore(release): 1.2.0',
    "Merge branch 'develop'",
    'Revert "feat: x"',
    'fixup! feat: x',
    '# comment line\nfeat: with a comment line',
    'feat: title\n\nbody',
  ]) {
    const file = join(dir, 'msg');
    writeFileSync(file, `${message}\n`);
    const result = run('node', [commitCheck, '--file', file]);
    assert.equal(result.status, 0, `${message}: ${result.stderr}`);
  }
});

test('commit message: invalid messages are rejected', () => {
  const dir = tempDir();
  for (const message of ['random change', 'feat:no space', 'feature: wrong type', 'feat: title\nbody right after', '', `feat: ${'x'.repeat(120)}`]) {
    const file = join(dir, 'msg');
    writeFileSync(file, `${message}\n`);
    const result = run('node', [commitCheck, '--file', file]);
    assert.equal(result.status, 1, `should be rejected: ${message}`);
  }
});

test('commit message: checks a commit range, fixup is not allowed in CI', () => {
  const dir = tempDir();
  const git = (...args) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd: dir });
  git('init', '-q', '-b', 'main');
  git('commit', '-q', '--allow-empty', '-m', 'chore: initialize');
  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  git('commit', '-q', '--allow-empty', '-m', 'feat: a feature');
  assert.equal(run('node', [commitCheck, '--range', `${base}..HEAD`], { cwd: dir }).status, 0);
  git('commit', '-q', '--allow-empty', '-m', 'fixup! feat: a feature');
  git('commit', '-q', '--allow-empty', '-m', 'scribble');
  const result = run('node', [commitCheck, '--range', `${base}..HEAD`], { cwd: dir });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /scribble/);
  assert.match(result.stderr, /fixup/);
});

test('risk tiers: by path and branch', () => {
  const tier = (...args) => run('node', [riskClassify, '--dry-run', ...args]).stdout.split('\n')[0];
  assert.equal(tier('README.md', 'docs/a/b.md'), 'low');
  assert.equal(tier(), 'low');
  assert.equal(tier('README.md', 'src/app.ts'), 'medium');
  assert.equal(tier('src/auth/login.ts'), 'high');
  assert.equal(tier('.github/workflows/ci.yml'), 'high');
  assert.equal(tier('db/migrations/001.sql'), 'high');
  assert.equal(tier('.env.local'), 'high');
  assert.equal(tier('apps/web/.dependency-cruiser.cjs'), 'high');
  assert.equal(tier('apps/web/eslint.config.js'), 'high');
  assert.equal(tier('apps/api/.oxlintrc.json'), 'high');
  assert.equal(tier('apps/web/e2e/visual.spec.ts-snapshots/home-chromium-linux.png'), 'high');
  assert.equal(tier('apps/api/src/test/java/com/x/ArchitectureTest.java'), 'high');
  assert.equal(tier('--head', 'release/1.2.0', 'src/a.ts'), 'high');
  assert.equal(tier('--head', 'main', '.github/workflows/ci.yml'), 'low');
});

test('format hook: picks the deepest matching rule and runs it in the rule directory', () => {
  const dir = tempDir();
  mkdirSync(join(dir, '.claude', 'hooks'), { recursive: true });
  mkdirSync(join(dir, 'apps', 'web', 'src'), { recursive: true });
  mkdirSync(join(dir, 'apps', 'api'), { recursive: true });
  writeFileSync(join(dir, 'fake-lint.cjs'), `
    const fs = require('fs');
    const [label, file] = process.argv.slice(2);
    fs.appendFileSync(${JSON.stringify(join(dir, 'calls.log'))}, label + ' ' + process.cwd() + ' ' + file + '\\n');
    if (fs.readFileSync(file, 'utf8').includes('bad')) process.exit(1);
  `);
  const lint = (label) => `node ${JSON.stringify(join(dir, 'fake-lint.cjs'))} ${label} {relfile}`;
  writeFileSync(join(dir, '.claude', 'hooks', 'format.config.json'), JSON.stringify({
    rules: [
      { extensions: ['.txt'], lint: lint('root') },
      { dir: 'apps/web', extensions: ['.txt'], lint: lint('web') },
    ],
  }));
  const hook = (file) => run('node', [formatHook], {
    input: JSON.stringify({ tool_input: { file_path: file } }),
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
  });

  writeFileSync(join(dir, 'apps', 'web', 'src', 'a.txt'), 'good');
  assert.equal(hook(join(dir, 'apps', 'web', 'src', 'a.txt')).status, 0);
  writeFileSync(join(dir, 'apps', 'api', 'b.txt'), 'good');
  assert.equal(hook(join(dir, 'apps', 'api', 'b.txt')).status, 0);
  const calls = readFileSync(join(dir, 'calls.log'), 'utf8').trim().split('\n');
  assert.match(calls[0], /^web .*apps[\\/]web src\/a\.txt$/);
  assert.match(calls[1], /^root /);

  writeFileSync(join(dir, 'apps', 'web', 'src', 'a.txt'), 'bad');
  const failed = hook(join(dir, 'apps', 'web', 'src', 'a.txt'));
  assert.equal(failed.status, 2);
  assert.match(failed.stderr, /failed lint/);

  assert.equal(hook(join(dir, 'apps', 'web', 'src', 'none.md')).status, 0, 'files without a rule pass');
  assert.equal(hook(join(tmpdir(), 'outside.txt')).status, 0, 'files outside the project pass');
});

test('installer: copies the template and skips existing files', () => {
  const dir = tempDir();
  execFileSync('git', ['init', '-q'], { cwd: dir });
  writeFileSync(join(dir, 'CLAUDE.md'), '# existing content\n');
  const result = JSON.parse(execFileSync('node', [installer, dir], { encoding: 'utf8' }));
  assert.deepEqual(result.skipped, ['CLAUDE.md']);
  assert.ok(result.copied.includes('.github/workflows/ai-review.yml'));
  assert.ok(result.copied.includes('AGENTS.md'));
  assert.ok(existsSync(join(dir, '.githooks', 'commit-msg')));
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '# existing content\n');
  rmSync(dir, { recursive: true, force: true });
});

test('installer: refuses a target that is not a git repository', () => {
  assert.equal(run('node', [installer, tempDir()]).status, 1);
});

test('screen rendering: reads the screenshot size from the prototype, with a default', () => {
  assert.deepEqual(sizeOf('<meta name="screenshot-size" content="390x844" />'), { width: 390, height: 844 });
  assert.deepEqual(sizeOf("<meta content='800 x 600' name='screenshot-size'>"), { width: 800, height: 600 });
  assert.deepEqual(sizeOf('<meta name="viewport" content="width=device-width">'), DEFAULT_SIZE);
  assert.deepEqual(sizeOf('<meta name="screenshot-size" content="wide">'), DEFAULT_SIZE);
  assert.deepEqual(parseSize('1440X900'), { width: 1440, height: 900 });
  assert.equal(parseSize('1440'), undefined);
  assert.equal(parseSize(undefined), undefined);
});

test('screen rendering: PNG next to the prototype; directories give HTML, named PNGs are passed through', () => {
  assert.equal(pngPathFor(join('screens', 'SCR-001-login--error.html')), join('screens', 'SCR-001-login--error.png'));

  const dir = tempDir();
  mkdirSync(join(dir, 'sub'));
  for (const name of ['SCR-001-a.html', 'SCR-001-a.png', join('sub', 'SCR-002-b.html'), 'tokens.css', 'SCR-001-a.md', 'CUR-SCR-001-a.png']) {
    writeFileSync(join(dir, name), '');
  }
  assert.deepEqual(collectScreens([dir, join(dir, 'SCR-001-a.html'), join(dir, 'tokens.css'), join(dir, 'CUR-SCR-001-a.png')]), [
    join(dir, 'CUR-SCR-001-a.png'),
    join(dir, 'SCR-001-a.html'),
    join(dir, 'sub', 'SCR-002-b.html'),
  ]);
  rmSync(dir, { recursive: true, force: true });

  assert.deepEqual(openCommand('win32', 'a.png'), ['cmd', ['/c', 'start', '', 'a.png']]);
  assert.deepEqual(openCommand('darwin', 'a.png'), ['open', ['a.png']]);
  assert.deepEqual(openCommand('linux', 'a.png'), ['xdg-open', ['a.png']]);
});

test('screen rendering: renders a real PNG, width from the prototype, full page height', renderSmoke, () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'SCR-001-demo.html'),
    '<!doctype html><meta charset="utf-8"><meta name="screenshot-size" content="400x300"><div style="height:600px">Screen</div>');
  const result = run('node', [renderScreens, dir], { cwd: dir });
  assert.equal(result.status, 0, result.stderr);
  const { width, height } = pngSize(join(dir, 'SCR-001-demo.png'));
  assert.equal(width, 400);
  assert.ok(height >= 600, 'content taller than the screenshot size is captured in full');
  rmSync(dir, { recursive: true, force: true });
});

test('screen capture: validates the list and builds Playwright arguments', () => {
  const [entry, sized] = readList(JSON.stringify([
    { url: 'http://localhost:8080/orders', file: 'docs/design/as-is/screens/CUR-SCR-001-orders.png' },
    { url: 'https://example.test/m', file: 'm.png', size: '390x844' },
  ]));
  assert.equal(entry.file, resolve('docs/design/as-is/screens/CUR-SCR-001-orders.png'));
  assert.deepEqual(entry.size, DEFAULT_SIZE);
  assert.deepEqual(sized.size, { width: 390, height: 844 });
  assert.deepEqual(captureArgs(entry), ['screenshot', '--viewport-size=1280,800', '--full-page', entry.url, entry.file]);
  assert.deepEqual(captureArgs(sized, 'auth.json'),
    ['screenshot', '--viewport-size=390,844', '--full-page', '--load-storage=auth.json', sized.url, sized.file]);

  assert.throws(() => readList('[]'), /non-empty/);
  assert.throws(() => readList('[{"url":"javascript:alert(1)","file":"a.png"}]'), /url/);
  assert.throws(() => readList('[{"url":"http://x","file":"a.jpg"}]'), /png/);
  assert.throws(() => readList('[{"url":"http://x","file":"a.png","size":"big"}]'), /size/);

  assert.deepEqual(parseArgs(['--storage', 's.json', '--open', 'list.json']), { open: true, storage: 's.json', list: 'list.json' });
  assert.deepEqual(parseArgs(['list.json']), { open: false, storage: undefined, list: 'list.json' });
});

test('screen capture: captures a real page into a new directory', renderSmoke, () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'page.html'), '<!doctype html><meta charset="utf-8"><div style="height:500px">Current screen</div>');
  writeFileSync(join(dir, 'list.json'), JSON.stringify([
    { url: pathToFileURL(join(dir, 'page.html')).href, file: join('as-is', 'screens', 'CUR-SCR-001-page.png'), size: '360x200' },
  ]));
  const result = run('node', [captureScreens, 'list.json'], { cwd: dir });
  assert.equal(result.status, 0, result.stderr);
  const { width, height } = pngSize(join(dir, 'as-is', 'screens', 'CUR-SCR-001-page.png'));
  assert.equal(width, 360);
  assert.ok(height >= 500);
  rmSync(dir, { recursive: true, force: true });
});

test('versions: LTS from endoflife.date cycles', () => {
  const today = '2026-11-09';
  const node = [
    { cycle: '27', releaseDate: '2027-04-20', lts: false },
    { cycle: '26', releaseDate: '2026-04-21', lts: '2026-10-28' },
    { cycle: '25', releaseDate: '2025-10-15', lts: false },
    { cycle: '24', releaseDate: '2025-05-06', lts: '2025-10-28' },
  ];
  assert.equal(pickLts(node, today), '26', 'an LTS start date in the past counts');
  assert.equal(pickLts(node, '2026-10-01'), '24', 'an LTS start date in the future does not count yet');
  const java = [
    { cycle: '27', releaseDate: '2026-09-15', lts: false },
    { cycle: '25', releaseDate: '2025-09-16', lts: true },
  ];
  assert.equal(pickLts(java, today), '25');
  const python = [
    { cycle: '3.14', releaseDate: '2025-10-07', lts: false },
    { cycle: '3.15', releaseDate: '2026-10-01', lts: false },
  ];
  assert.equal(pickLts(python, today), '3.15', 'without an LTS concept the newest release wins');
  assert.equal(pickLts([], today), undefined);
});

test('versions: highest stable version allowed by every tool', () => {
  assert.equal(compareVersions('6.10.0', '6.9.3') > 0, true);
  assert.equal(compareVersions('7.0.0', '7.0.0'), 0);
  const latest = ['6.0.2', '6.0.3', '7.0.0', '7.0.1-rc', '7.0.2'];
  const eslintRange = ['6.0.2', '6.0.3'];
  assert.equal(pickCompatible([latest, eslintRange]), '6.0.3');
  assert.equal(pickCompatible([latest]), '7.0.2', 'pre-releases are skipped');
  assert.equal(pickCompatible([latest, ['5.9.3']]), undefined);
  assert.deepEqual(
    supportRanges({ peerDependencies: { typescript: '>=4.8.4 <6.1.0' }, supportedTranspilers: { typescript: '<7.0.0' } }, 'typescript'),
    ['>=4.8.4 <6.1.0', '<7.0.0'],
  );
  assert.deepEqual(supportRanges({ peerDependencies: undefined, supportedTranspilers: undefined }, 'typescript'), []);
  assert.deepEqual(asList('6.0.3'), ['6.0.3']);
  assert.deepEqual(asList(undefined), []);
  assert.equal(asSingle(['7.0.2']), '7.0.2');
  assert.deepEqual(asSingle({ a: 1 }), { a: 1 });
});
