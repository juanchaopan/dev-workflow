#!/usr/bin/env node
// 把画面原型（HTML）截成 PNG，给用户确认画面用。每个 HTML 截一张同名的 PNG，放在它旁边。
// 用法：node render-screens.mjs [--open] <HTML 文件或目录>...
//   --open  截完用系统的看图程序打开每张图。
// 截图尺寸写在原型里：<meta name="screenshot-size" content="1280x800">，没写时用 1280x800。
// 宽度固定，高度是最小高度：内容更长时截整页。
// 截图用 Playwright 的命令行和它自带的 Chromium（免费、开源），第一次运行时自动下载。
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const DEFAULT_SIZE = { width: 1280, height: 800 };

export function sizeOf(html) {
  const tag = html.match(/<meta\b[^>]*\bname=["']screenshot-size["'][^>]*>/i);
  const size = tag && tag[0].match(/\bcontent=["']\s*(\d+)\s*x\s*(\d+)\s*["']/i);
  return size ? { width: Number(size[1]), height: Number(size[2]) } : DEFAULT_SIZE;
}

export function pngPathFor(htmlPath) {
  return htmlPath.slice(0, htmlPath.length - extname(htmlPath).length) + '.png';
}

export function collectHtml(paths) {
  const files = paths.flatMap((path) => {
    const full = resolve(path);
    if (!statSync(full).isDirectory()) return extname(full) === '.html' ? [full] : [];
    return readdirSync(full, { recursive: true })
      .filter((name) => extname(name) === '.html')
      .map((name) => join(full, name));
  });
  return [...new Set(files)].sort();
}

export function openCommand(platform, file) {
  if (platform === 'win32') return ['cmd', ['/c', 'start', '', file]];
  if (platform === 'darwin') return ['open', [file]];
  return ['xdg-open', [file]];
}

function npx(args) {
  const command = ['npx', '--yes', 'playwright', ...args].map((a) => (/[\s"]/.test(a) ? `"${a}"` : a)).join(' ');
  return spawnSync(command, { shell: true, encoding: 'utf8' });
}

function screenshot(file) {
  const { width, height } = sizeOf(readFileSync(file, 'utf8'));
  const png = pngPathFor(file);
  const result = npx(['screenshot', `--viewport-size=${width},${height}`, '--full-page', pathToFileURL(file).href, png]);
  if (result.status !== 0) throw new Error(`截图失败：${file}\n${result.stdout}${result.stderr}`);
  return png;
}

function main(argv) {
  const open = argv.includes('--open');
  const files = collectHtml(argv.filter((arg) => arg !== '--open'));
  if (files.length === 0) {
    console.error('用法：node render-screens.mjs [--open] <HTML 文件或目录>...');
    return 1;
  }
  const install = npx(['install', 'chromium']);
  if (install.status !== 0) {
    console.error(`安装 Chromium 失败：\n${install.stdout}${install.stderr}`);
    return 1;
  }
  const rendered = files.map(screenshot);
  if (open) {
    for (const png of rendered) {
      const [command, args] = openCommand(process.platform, png);
      spawnSync(command, args, { stdio: 'ignore' });
    }
  }
  console.log(JSON.stringify({ rendered: rendered.map((png) => relative(process.cwd(), png)) }, null, 2));
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
