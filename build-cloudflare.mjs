import { mkdir, readFile, writeFile, copyFile, lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, '.cloudflare-public');
const files = [
  'index.html', 'favicon.png', 'assets/pronunciations.json', 'css/app.css',
  'js/config.js', 'js/legacy-translations.js', 'js/lesson-contexts.js', 'js/library-data.js', 'js/sounds.js',
  'js/academy.js', 'js/audio-lifecycle.js', 'js/dialogue-audio.js', 'js/dialogue-voice.js', 'js/dialogue.js', 'js/voice.js', 'js/ui.js', 'js/app.js'
];
await mkdir(output, { recursive: true });
if ((await lstat(output)).isSymbolicLink()) throw new Error('Build directory must not be a link');
async function checkExisting(dir, prefix = '') {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isSymbolicLink()) throw new Error('Unexpected build symlink: ' + relative);
    if (entry.isDirectory()) {
      if (!files.some(file => file.startsWith(relative + '/'))) throw new Error('Unexpected build directory: ' + relative);
      await checkExisting(path.join(dir, entry.name), relative + '/');
    } else if (!files.includes(relative)) throw new Error('Unexpected build file: ' + relative);
  }
}
await checkExisting(output);
// Minify CSS/JS when esbuild is available (project, .deploy-tools, or the copy bundled with wrangler).
async function loadEsbuild() {
  const bases = [process.env.READFOX_ESBUILD_DIR, root, path.join(root, '.deploy-tools')].filter(Boolean);
  for (const base of bases) {
    try { return createRequire(path.join(base, 'noop.js'))('esbuild'); } catch { /* try next */ }
  }
  try {
    const pnpm = path.join(root, '.deploy-tools', 'node_modules', '.pnpm');
    const folder = (await readdir(pnpm)).find(name => name.startsWith('esbuild@'));
    if (folder) return createRequire(path.join(pnpm, folder, 'node_modules', 'noop.js'))('esbuild');
  } catch { /* no pnpm layout */ }
  return null;
}
let esbuild = await loadEsbuild();
let savedBytes = 0;
for (const file of files) {
  const source = path.join(root, file);
  if (!(await lstat(source)).isFile()) throw new Error('Not a regular file: ' + file);
  const destination = path.join(output, file);
  await mkdir(path.dirname(destination), { recursive: true });
  let minified = false;
  if (esbuild && /\.(css|js)$/.test(file)) {
    try {
      const code = await readFile(source, 'utf8');
      const result = await esbuild.transform(code, { loader: file.endsWith('.css') ? 'css' : 'js', minify: true, charset: 'utf8', target: 'safari15', legalComments: 'none' });
      savedBytes += Buffer.byteLength(code) - Buffer.byteLength(result.code);
      await writeFile(destination, result.code);
      minified = true;
    } catch (error) {
      console.warn('esbuild is unusable here (' + String(error.message).split('\n').find(Boolean) + '); copying files without minification.');
      esbuild = null;
    }
  }
  if (!minified) await copyFile(source, destination);
}
// Change asset URLs whenever their content changes, including on repeat deployments.
const { createHash } = await import('node:crypto');
let html = await readFile(path.join(output, 'index.html'), 'utf8');
for (const file of files.filter(file => /\.(css|js)$/.test(file))) {
  const hash = createHash('sha256').update(await readFile(path.join(output, file))).digest('hex').slice(0, 12);
  const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  html = html.replace(new RegExp(escaped + '(?:\\?[^"\\s]*)?', 'g'), file + '?v=' + hash);
}
await writeFile(path.join(output, 'index.html'), html);
console.log('Cloudflare build: ' + files.length + ' public files in ' + output + (esbuild ? ' (minified, saved ' + Math.round(savedBytes / 1024) + ' KB)' : ' (esbuild not found: files copied as is)'));
