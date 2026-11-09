#!/usr/bin/env node
// Renders screen prototypes (HTML) to PNG so the user can confirm them. Each HTML file gets a PNG of the same name next to it.
// Usage: node render-screens.mjs [--open] <HTML file or directory>...
//   --open  open each image in the system image viewer afterwards.
// The screenshot size is set in the prototype: <meta name="screenshot-size" content="1280x800">; 1280x800 when missing.
// The width is fixed and the height is a minimum: taller content is captured as a full page.
// Rendering uses the Playwright command line and its bundled Chromium (free, open source), downloaded on first run.
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
  if (result.status !== 0) throw new Error(`Rendering failed: ${file}\n${result.stdout}${result.stderr}`);
  return png;
}

function main(argv) {
  const open = argv.includes('--open');
  const files = collectHtml(argv.filter((arg) => arg !== '--open'));
  if (files.length === 0) {
    console.error('Usage: node render-screens.mjs [--open] <HTML file or directory>...');
    return 1;
  }
  const install = npx(['install', 'chromium']);
  if (install.status !== 0) {
    console.error(`Installing Chromium failed:\n${install.stdout}${install.stderr}`);
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
