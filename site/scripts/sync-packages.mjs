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
// 404 is the ONLY 4xx we trust as final -- it is the honest "not there".
// Every other 4xx gets retried, because raw.githubusercontent.com hands out
// SPURIOUS 400s. Measured 2026-08-31 over one repository: the same blob
// answered 400 and 200 within a minute, by branch AND by commit SHA, while
// the API listed it present and GitHub status was all-green; which file was
// hit moved between runs. Treating that 400 as "absent" is what killed the
// whole build -- a missing half of a doc pair is a hard error downstream, so
// one flaky edge response blocked every deploy.
async function fetchRetry(url, init, tries = 5) {
  let last;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, init);
      if (r.ok || r.status === 404) return r;
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

// BRANCH is resolved to a COMMIT SHA once per repository, and everything is
// then fetched by that SHA. Two reasons, the first one measured on 2026-08-31:
//
//  1. raw.githubusercontent.com can serve a POISONED CACHE for a branch path.
//     `nova-polaris/main/docs/auth.ru.md` returned HTTP 400 on every retry and
//     on both raw routes, while the SAME blob by SHA returned 200 and the API
//     reported it present at 11364 bytes. A neighbouring `routing.ru.md` was
//     fine, GitHub status was all-green, and the file holds nothing unusual.
//     One bad edge entry blocked the ENTIRE site build, because a missing
//     half of a doc pair is a hard error below.
//  2. A build that reads a moving branch is not reproducible: two files in
//     one run can come from two different commits. Pinning the SHA fixes
//     that as a side effect, which is the better reason of the two.
//
// One extra API call per repository (six in total), unauthenticated, well
// inside the rate limit. If the call fails, we fall back to the branch name --
// the previous behaviour, no worse than before.
const REF_CACHE = new Map();
async function refOf(repo) {
  if (REF_CACHE.has(repo)) return REF_CACHE.get(repo);
  let ref = BRANCH;
  try {
    const r = await fetchRetry(
      `https://api.github.com/repos/${repo}/commits/${BRANCH}`, { headers: UA });
    if (r.ok) {
      const j = await r.json();
      if (j && typeof j.sha === 'string' && j.sha.length >= 7) ref = j.sha;
    }
  } catch {}
  REF_CACHE.set(repo, ref);
  return ref;
}

async function raw(repo, path) {
  const ref = await refOf(repo);
  const r = await fetchRetry(`https://raw.githubusercontent.com/${repo}/${ref}/${path}`, { headers: UA });
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
