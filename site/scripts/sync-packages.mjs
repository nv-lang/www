// Синк документации ПАКЕТНЫХ реп (план 241 Ф.2b): polaris — 13 двуязычных
// страниц из docs/ своей репы, остальные пакеты — пара README как
// единственная публикуемая страница. Состав берётся из манифеста
// PUBLISHED.list В КАЖДОЙ репе (тот же канон, что для гайдов nova).
// Результат — коллекция `packages`: <pkg>/{en,ru}/<slug>.md.
import { mkdir, writeFile, rm } from 'node:fs/promises';

const BRANCH = 'main';
const UA = { 'User-Agent': 'nv-lang-www-build' };
const OUT = new URL('../src/content/packages/', import.meta.url);

// repo — путь на github; docsDir — где лежат страницы (null = только README)
export const PACKAGES = [
  { pkg: 'polaris',  repo: 'nv-lang/nova-polaris',  docsDir: 'docs',
    title: { en: 'Polaris — web framework', ru: 'Polaris — веб-фреймворк' } },
  { pkg: 'http',     repo: 'nv-lang/nova-http',     docsDir: null,
    title: { en: 'nova-http — HTTP protocol core', ru: 'nova-http — ядро протокола HTTP' } },
  { pkg: 'tls',      repo: 'nv-lang/nova-tls',      docsDir: null,
    title: { en: 'nova-tls — TLS', ru: 'nova-tls — TLS' } },
  { pkg: 'compress', repo: 'nv-lang/nova-compress', docsDir: null,
    title: { en: 'nova-compress — compression', ru: 'nova-compress — сжатие' } },
  { pkg: 'bignum',   repo: 'nv-lang/nova-bignum',   docsDir: null,
    title: { en: 'nova-bignum — arbitrary precision', ru: 'nova-bignum — произвольная точность' } },
];

async function raw(repo, path) {
  const r = await fetch(`https://raw.githubusercontent.com/${repo}/${BRANCH}/${path}`, { headers: UA });
  return r.ok ? await r.text() : null;
}

// исходный frontmatter источника срезаем: он не должен рендериться в тело
function stripFm(text) {
  if (!text.startsWith('---')) return text;
  const nl = String.fromCharCode(10);
  const end = text.indexOf(nl + '---', 3);
  if (end < 0) return text;
  const after = text.slice(end + 4);
  const cut = after.indexOf(nl);
  return (cut < 0 ? '' : after.slice(cut + 1)).replace(/^\s*\n/, '');
}

function fm(repo, path) {
  return ['---', `sourceRepo: ${JSON.stringify(repo)}`,
    `sourcePath: ${JSON.stringify(path)}`, '---', '', ''].join('\n');
}

export async function syncPackages() {
  await rm(OUT, { recursive: true, force: true });
  const index = [];
  for (const p of PACKAGES) {
    const pages = [];
    if (p.docsDir) {
      const manifest = await raw(p.repo, `${p.docsDir}/PUBLISHED.list`);
      if (!manifest) throw new Error(`нет манифеста ${p.docsDir}/PUBLISHED.list в ${p.repo}`);
      const slugs = manifest.split(/\r?\n/).map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      for (const slug of slugs) {
        const en = await raw(p.repo, `${p.docsDir}/${slug}.md`);
        const ru = await raw(p.repo, `${p.docsDir}/${slug}.ru.md`);
        if (!en || !ru) throw new Error(`пара ${slug} неполна в ${p.repo}`);
        // README пакета — корневая страница /doc/<pkg>/, а не /doc/<pkg>/README/
        const routeSlug = (slug === 'README' || slug === 'readme') ? 'index' : slug;
        pages.push({ slug: routeSlug, en, ru, pathEn: `${p.docsDir}/${slug}.md` });
      }
    } else {
      const en = await raw(p.repo, 'README.md');
      const ru = await raw(p.repo, 'README.ru.md');
      if (!en || !ru) throw new Error(`README-пара неполна в ${p.repo}`);
      pages.push({ slug: 'index', en, ru, pathEn: 'README.md' });
    }
    await mkdir(new URL(`${p.pkg}/en/`, OUT), { recursive: true });
    await mkdir(new URL(`${p.pkg}/ru/`, OUT), { recursive: true });
    for (const page of pages) {
      await writeFile(new URL(`${p.pkg}/en/${page.slug}.md`, OUT),
        fm(p.repo, page.pathEn) + stripFm(page.en), 'utf8');
      await writeFile(new URL(`${p.pkg}/ru/${page.slug}.md`, OUT),
        fm(p.repo, page.pathEn.replace(/\.md$/, '.ru.md')) + stripFm(page.ru), 'utf8');
    }
    index.push({ pkg: p.pkg, repo: p.repo, title: p.title,
      slugs: pages.map((x) => x.slug) });
    console.log(`sync-packages: ${p.pkg} — ${pages.length} страниц(ы)`);
  }
  await writeFile(new URL('../src/data/packages.generated.ts', import.meta.url),
    '// СГЕНЕРИРОВАНО scripts/sync-packages.mjs (план 241 Ф.2b). Не править руками.\n' +
    'export const PACKAGE_DOCS = ' + JSON.stringify(index, null, 2) + ' as const;\n', 'utf8');
  return index;
}

await syncPackages();
