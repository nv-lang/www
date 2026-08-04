// Карта сайта — ГЕНЕРИРУЕТСЯ из собранного dist (postbuild), а не ведётся
// руками. Прежний public/sitemap.xml был ручным и молча отставал: страницы
// z3-setup / running-tests / building-from-source в него не попали и были
// невидимы для поисковиков (найдено аудитом 2026-08-04).
import { readdir, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = new URL('../dist/', import.meta.url);
const SITE = 'https://nv-lang.org';

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'pagefind' || e.name === '_astro') continue;
      out.push(...await walk(p));
    } else if (e.name === 'index.html') out.push(p);
  }
  return out;
}

// fileURLToPath — единственный переносимый способ: ручное срезание ведущего
// слэша ломает путь на Linux (было: ENOENT 'home/runner/...' в CI).
const distDir = fileURLToPath(new URL('../dist', import.meta.url));
const files = await walk(distDir);
const urls = files
  .map((f) => '/' + relative(distDir, f).split(sep).slice(0, -1).join('/'))
  .map((u) => (u === '/' ? '/' : u.replace(/\/?$/, '/')))
  .filter((u, i, a) => a.indexOf(u) === i)
  .sort();

const today = (await stat(files[0])).mtime.toISOString().slice(0, 10);
const body = urls.map((u) =>
  `  <url>\n    <loc>${SITE}${u}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`).join('\n');
await writeFile(new URL('sitemap.xml', DIST),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, 'utf8');
console.log(`sitemap: ${urls.length} страниц`);
