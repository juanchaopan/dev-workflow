// 插件里那些会装进项目或在项目里运行的脚本的单元测试：提交信息检查、风险分级、格式化钩子、安装脚本、画面截图。
// 运行：node --test "tests/*.test.mjs"
// 画面截图的真实截图要下载 Chromium，设置 RENDER_SMOKE=1 时才运行。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SIZE, collectHtml, openCommand, pngPathFor, sizeOf } from '../skills/design/render-screens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const template = join(root, 'skills', 'setup-ai-review', 'template');
const commitCheck = join(template, '.github', 'scripts', 'check-commit-message.mjs');
const riskClassify = join(template, '.github', 'scripts', 'risk-classify.mjs');
const formatHook = join(template, '.claude', 'hooks', 'format.mjs');
const installer = join(root, 'skills', 'setup-ai-review', 'install.mjs');
const renderScreens = join(root, 'skills', 'design', 'render-screens.mjs');

const tempDir = () => mkdtempSync(join(tmpdir(), 'dev-workflow-test-'));
const run = (command, args, options = {}) => spawnSync(command, args, { encoding: 'utf8', ...options });

test('提交信息：合格的写法通过', () => {
  const dir = tempDir();
  for (const message of [
    'feat(auth): 支持邮箱登录 (#12)',
    'fix: 修复空列表',
    'feat(api)!: 删除旧接口',
    'chore(release): 1.2.0',
    "Merge branch 'develop'",
    'Revert "feat: x"',
    'fixup! feat: x',
    '# 注释行\nfeat: 有注释行',
    'feat: 标题\n\n正文',
  ]) {
    const file = join(dir, 'msg');
    writeFileSync(file, `${message}\n`);
    const result = run('node', [commitCheck, '--file', file]);
    assert.equal(result.status, 0, `${message}：${result.stderr}`);
  }
});

test('提交信息：不合格的写法被拦下', () => {
  const dir = tempDir();
  for (const message of ['随便改改', 'feat:没空格', 'feature: 类型不对', 'feat: 标题\n正文紧跟', '', `feat: ${'长'.repeat(120)}`]) {
    const file = join(dir, 'msg');
    writeFileSync(file, `${message}\n`);
    const result = run('node', [commitCheck, '--file', file]);
    assert.equal(result.status, 1, `应该被拦下：${message}`);
  }
});

test('提交信息：检查一段提交范围，fixup 在 CI 里不允许', () => {
  const dir = tempDir();
  const git = (...args) => execFileSync('git', ['-c', 'user.email=t@t', '-c', 'user.name=t', ...args], { cwd: dir });
  git('init', '-q', '-b', 'main');
  git('commit', '-q', '--allow-empty', '-m', 'chore: 初始化');
  const base = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' }).trim();
  git('commit', '-q', '--allow-empty', '-m', 'feat: 一个功能');
  assert.equal(run('node', [commitCheck, '--range', `${base}..HEAD`], { cwd: dir }).status, 0);
  git('commit', '-q', '--allow-empty', '-m', 'fixup! feat: 一个功能');
  git('commit', '-q', '--allow-empty', '-m', '乱写');
  const result = run('node', [commitCheck, '--range', `${base}..HEAD`], { cwd: dir });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /乱写/);
  assert.match(result.stderr, /fixup/);
});

test('风险分级：按路径和分支定级', () => {
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
  assert.equal(tier('apps/web/e2e/visual.spec.ts-snapshots/home-chromium-linux.png'), 'high');
  assert.equal(tier('apps/api/src/test/java/com/x/ArchitectureTest.java'), 'high');
  assert.equal(tier('--head', 'release/1.2.0', 'src/a.ts'), 'high');
  assert.equal(tier('--head', 'main', '.github/workflows/ci.yml'), 'low');
});

test('格式化钩子：按目录选最深的规则，命令在规则目录下运行', () => {
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
  assert.match(failed.stderr, /没有通过 lint/);

  assert.equal(hook(join(dir, 'apps', 'web', 'src', 'none.md')).status, 0, '没有规则的文件直接放行');
  assert.equal(hook(join(tmpdir(), 'outside.txt')).status, 0, '项目外的文件直接放行');
});

test('安装脚本：复制模板，已有文件跳过', () => {
  const dir = tempDir();
  execFileSync('git', ['init', '-q'], { cwd: dir });
  writeFileSync(join(dir, 'CLAUDE.md'), '# 已有的内容\n');
  const result = JSON.parse(execFileSync('node', [installer, dir], { encoding: 'utf8' }));
  assert.deepEqual(result.skipped, ['CLAUDE.md']);
  assert.ok(result.copied.includes('.github/workflows/ai-review.yml'));
  assert.ok(result.copied.includes('AGENTS.md'));
  assert.ok(existsSync(join(dir, '.githooks', 'commit-msg')));
  assert.equal(readFileSync(join(dir, 'CLAUDE.md'), 'utf8'), '# 已有的内容\n');
  rmSync(dir, { recursive: true, force: true });
});

test('安装脚本：目标不是 git 仓库时拒绝', () => {
  assert.equal(run('node', [installer, tempDir()]).status, 1);
});

test('画面截图：从原型里读截图尺寸，没写时用默认尺寸', () => {
  assert.deepEqual(sizeOf('<meta name="screenshot-size" content="390x844" />'), { width: 390, height: 844 });
  assert.deepEqual(sizeOf("<meta content='800 x 600' name='screenshot-size'>"), { width: 800, height: 600 });
  assert.deepEqual(sizeOf('<meta name="viewport" content="width=device-width">'), DEFAULT_SIZE);
});

test('画面截图：PNG 和原型同名，目录下的原型都收进来，各平台用系统程序打开', () => {
  assert.equal(pngPathFor(join('screens', 'SCR-001-login--error.html')), join('screens', 'SCR-001-login--error.png'));

  const dir = tempDir();
  mkdirSync(join(dir, 'sub'));
  for (const name of ['SCR-001-a.html', join('sub', 'SCR-002-b.html'), 'tokens.css', 'SCR-001-a.md']) {
    writeFileSync(join(dir, name), '');
  }
  assert.deepEqual(collectHtml([dir, join(dir, 'SCR-001-a.html'), join(dir, 'tokens.css')]), [
    join(dir, 'SCR-001-a.html'),
    join(dir, 'sub', 'SCR-002-b.html'),
  ]);
  rmSync(dir, { recursive: true, force: true });

  assert.deepEqual(openCommand('win32', 'a.png'), ['cmd', ['/c', 'start', '', 'a.png']]);
  assert.deepEqual(openCommand('darwin', 'a.png'), ['open', ['a.png']]);
  assert.deepEqual(openCommand('linux', 'a.png'), ['xdg-open', ['a.png']]);
});

test('画面截图：真的截出 PNG，宽度按原型，高度截整页', {
  skip: process.env.RENDER_SMOKE ? false : '设置 RENDER_SMOKE=1 时才运行（要下载 Chromium）',
  timeout: 300_000,
}, () => {
  const dir = tempDir();
  writeFileSync(join(dir, 'SCR-001-demo.html'),
    '<!doctype html><meta charset="utf-8"><meta name="screenshot-size" content="400x300"><div style="height:600px">画面</div>');
  const result = run('node', [renderScreens, dir], { cwd: dir });
  assert.equal(result.status, 0, result.stderr);
  const png = readFileSync(join(dir, 'SCR-001-demo.png'));
  assert.equal(png.readUInt32BE(16), 400);
  assert.ok(png.readUInt32BE(20) >= 600, '内容比截图尺寸高时截整页');
  rmSync(dir, { recursive: true, force: true });
});
