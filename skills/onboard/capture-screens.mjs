#!/usr/bin/env node
// Captures screenshots of a running system as evidence of its current state, for docs/design/as-is/screens/.
// Usage: node capture-screens.mjs [--storage <file>] [--open] <list.json>
//   list.json   [{ "url": "http://localhost:8080/orders", "file": "docs/design/as-is/screens/CUR-SCR-001-order-list.png", "size": "1280x800" }]
//               "size" is optional (1280x800); the height is a minimum and taller pages are captured in full.
//               Relative "file" paths are resolved from the current directory; missing directories are created.
//   --storage   a Playwright storage state file with a signed-in session, saved beforehand with
//               npx playwright open --save-storage=<file> <sign-in URL>   (sign in, then close the window).
//               It holds session cookies: keep it outside the repository and delete it afterwards.
//   --open      open the screenshots in the system image viewer afterwards.
// Uses the same Playwright command line and bundled Chromium as the design skill's render-screens.mjs.
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SIZE, ensureChromium, openImages, parseSize, playwright } from '../design/render-screens.mjs';

export function readList(text) {
  const list = JSON.parse(text);
  if (!Array.isArray(list) || list.length === 0) throw new Error('The list must be a non-empty JSON array.');
  return list.map((entry, index) => {
    const where = `Entry ${index + 1}`;
    if (!entry || typeof entry.url !== 'string' || !/^(https?|file):\/\//i.test(entry.url)) {
      throw new Error(`${where}: "url" must be an http, https or file URL.`);
    }
    if (typeof entry.file !== 'string' || !entry.file.toLowerCase().endsWith('.png')) {
      throw new Error(`${where}: "file" must be a .png path.`);
    }
    const size = entry.size === undefined ? DEFAULT_SIZE : parseSize(entry.size);
    if (!size) throw new Error(`${where}: "size" must look like 1280x800.`);
    return { url: entry.url, file: resolve(entry.file), size };
  });
}

export function captureArgs({ url, file, size }, storage) {
  return [
    'screenshot',
    `--viewport-size=${size.width},${size.height}`,
    '--full-page',
    ...(storage ? [`--load-storage=${storage}`] : []),
    url,
    file,
  ];
}

export function parseArgs(argv) {
  const options = { open: false, storage: undefined, list: undefined };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--open') options.open = true;
    else if (argv[i] === '--storage') options.storage = argv[++i];
    else options.list = argv[i];
  }
  return options;
}

function main(argv) {
  const { open, storage, list } = parseArgs(argv);
  if (!list || (argv.includes('--storage') && !storage)) {
    console.error('Usage: node capture-screens.mjs [--storage <file>] [--open] <list.json>');
    return 1;
  }
  const entries = readList(readFileSync(list, 'utf8'));
  ensureChromium();
  const captured = [];
  const failed = [];
  for (const entry of entries) {
    mkdirSync(dirname(entry.file), { recursive: true });
    const result = playwright(captureArgs(entry, storage && resolve(storage)));
    if (result.status === 0) captured.push(entry.file);
    else failed.push({ url: entry.url, error: `${result.stdout}${result.stderr}`.trim() });
  }
  if (open) openImages(captured);
  console.log(JSON.stringify({ captured: captured.map((file) => relative(process.cwd(), file)), failed }, null, 2));
  return failed.length === 0 ? 0 : 1;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
