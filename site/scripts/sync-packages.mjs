// Синк документации ПАКЕТНЫХ реп (план 241 Ф.2b): polaris — 13 двуязычных
// страниц из docs/ своей репы, остальные пакеты — пара README как
// единственная публикуемая страница. Состав берётся из манифеста
// PUBLISHED.list В КАЖДОЙ репе (тот же канон, что для гайдов nova).
// Результат — коллекция `packages`: <pkg>/{en,ru}/<slug>.md.
import { mkdir, writeFile, rm } from 'node:fs/promises';

const BRANCH = 'main';
const UA = { 'User-Agent': 'nv-lang-www-build' };

// Разовая 5xx от GitHub роняла ВЕСЬ деплой (прецедент 2026-08-04: fetch 500 на
// одном файле из 70). Сеть — не повод считать сборку красной: три попытки с
// нарастающей паузой, и только потом падаем.
async function fetchRetry(url, init, tries = 3) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.ok || (r.status >= 400 && r.status < 500)) return r;
      last = new Error(`HTTP ${r.status}`);
    } catch (e) { last = e; }
    if (i < tries - 1) await new Promise((res) => setTimeout(res, 800 * (i + 1)));
  }
  throw last ?? new Error('fetch failed');
}
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
  { pkg: 'bignum',   repo: 'nv-lang/nova-bignum',   docsDir: 'docs',
    title: { en: 'nova-bignum — arbitrary precision', ru: 'nova-bignum — произвольная точность' } },
];

async function raw(repo, path) {
  const r = await fetchRetry(`https://raw.githubusercontent.com/${repo}/${BRANCH}/${path}`, { headers: UA });
  return r.ok ? await r.text() : null;
}

// исходный frontmatter источника срезаем: он не должен рендериться в тело

// Переключатель языка внутри страницы («**English** | [Русский](…)») дублирует
// переключатель RU/EN в шапке сайта и ведёт на .md-файл — на сайте не работает.
// Срезаем при импорте (замечание владельца 2026-08-05); в репозитории он полезен.
function stripLangSwitch(text) {
  return text.replace(
    /^(?:\*\*(?:English|Русский)\*\*|\[(?:English|Русский)\]\([^)]*\))[ \t]*\|[ \t]*(?:\*\*(?:English|Русский)\*\*|\[(?:English|Русский)\]\([^)]*\))[ \t]*\r?\n\r?\n?/m,
    '');
}

function stripFm(text) {
  if (!text.startsWith('---')) return text;
  const nl = String.fromCharCode(10);
  const end = text.indexOf(nl + '---', 3);
  if (end < 0) return text;
  const after = text.slice(end + 4);
  const cut = after.indexOf(nl);
  return (cut < 0 ? '' : after.slice(cut + 1)).replace(/^\s*\n/, '');
}


// Ссылки внутри доки пакета указывают на СОСЕДНИЕ .md-файлы («overview.md»,
// «./routing.md»). На сайте таких адресов нет — их надо переписать в маршруты,
// иначе читатель упирается в 404 (найдено владельцем 2026-08-04).
function rewritePkgLinks(text, pkg, lang, repo, published) {
  const base = lang === 'ru' ? `/ru/doc/${pkg}` : `/doc/${pkg}`;
  // «../README.md» — корень репы пакета: на сайте это его обзорная страница.
  // «../examples/...» и прочее вне docs/ — на сайте не публикуется, ведём в
  // репозиторий-источник (иначе 404).
  text = text.replace(/\]\(\.\.\/README(\.ru)?\.md(#[^)]*)?\)/g, `](${base}/`.replace(/\/$/, '/') + ')');
  text = text.replace(/\]\(\.\.\/([A-Za-z0-9._\/-]+\.md)(#[^)]*)?\)/g,
    (m, rel, hash) => `](https://github.com/${repo}/blob/main/${rel}${hash ?? ''})`);
  return text.replace(/\]\(\.?\/?([A-Za-z0-9._-]+)\.md(#[^)]*)?\)/g, (m, name, hash) => {
    const slug = name.replace(/\.ru$/, '');
    // Страница, исключённая из манифеста (жанр «внутреннее», site-conventions
    // #page-genre), на сайте не существует — ведём в репозиторий-источник,
    // иначе получаем битую ссылку (поймано при исключении roadmap полариса).
    if (published && !published.has(slug) && slug !== 'README' && slug !== 'readme')
      return `](https://github.com/${repo}/blob/main/docs/${name}.md${hash ?? ''})`;
    const route = (slug === 'README' || slug === 'readme') ? `${base}/` : `${base}/${slug}/`;
    return `](${route}${hash ?? ''})`;
  });
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
    const pubSet = new Set(pages.map((x) => x.slug === 'index' ? 'README' : x.slug));
    await mkdir(new URL(`${p.pkg}/en/`, OUT), { recursive: true });
    await mkdir(new URL(`${p.pkg}/ru/`, OUT), { recursive: true });
    for (const page of pages) {
      await writeFile(new URL(`${p.pkg}/en/${page.slug}.md`, OUT),
        fm(p.repo, page.pathEn) + rewritePkgLinks(stripLangSwitch(stripFm(page.en)), p.pkg, 'en', p.repo, pubSet), 'utf8');
      await writeFile(new URL(`${p.pkg}/ru/${page.slug}.md`, OUT),
        fm(p.repo, page.pathEn.replace(/\.md$/, '.ru.md')) + rewritePkgLinks(stripLangSwitch(stripFm(page.ru)), p.pkg, 'ru', p.repo, pubSet), 'utf8');
    }
    // Заголовок КАЖДОЙ страницы — из её H1 (иначе все 13 страниц пакета
    // получают один <title>, что портит и навигацию, и выдачу поиска).
    const h1 = (text) => {
      const line = text.split(/\r?\n/).find((l) => /^#\s+/.test(l));
      return line ? line.replace(/^#\s+/, '').trim() : '';
    };
    index.push({ pkg: p.pkg, repo: p.repo, title: p.title,
      pages: pages.map((x) => ({
        slug: x.slug,
        title: { en: h1(stripFm(x.en)) || p.title.en, ru: h1(stripFm(x.ru)) || p.title.ru },
      })),
      slugs: pages.map((x) => x.slug) });
    console.log(`sync-packages: ${p.pkg} — ${pages.length} страниц(ы)`);
  }
  await writeFile(new URL('../src/data/packages.generated.ts', import.meta.url),
    '// СГЕНЕРИРОВАНО scripts/sync-packages.mjs (план 241 Ф.2b). Не править руками.\n' +
    'export const PACKAGE_DOCS = ' + JSON.stringify(index, null, 2) + ' as const;\n', 'utf8');
  return index;
}

await syncPackages();
