// Синхронизация документации Nova из репозитория nv-lang/nova.
// Тянет дерево spec/ + выбранные пользовательские гайды docs/guide/ и
// раскладывает по контент-коллекциям сайта:
//   spec/decisions/NN-*.md, README.md         -> src/content/decisions/
//   spec/*.md (обзорные документы)             -> src/content/spec/
//   spec/decisions/history/*.md                -> src/content/spec/history/
//   docs/guide/<slug>.md / <slug>.ru.md         -> src/content/docs/{en,ru}/<slug>.md
//     (состав гайдов — из docs/guide/PUBLISHED.list репы nova, №307)
// docs/guide/ — ПОЛЬЗОВАТЕЛЬСКИЕ гайды nova (docs-split 2026-08-02, см.
// nova/docs/README.md). docs/dev/ (внутренние конвенции/процесс/промпты
// для агентов) сюда НИКОГДА не попадает — ни при каком расширении
// DOC_SLUGS путь внутри docs/dev/ добавлять нельзя.
// Перекрёстные ссылки переписываются под URL сайта; якоря, которых нет
// на целевой странице, отбрасываются (ссылка ведёт на саму страницу) —
// чтобы линк-чекер не падал на неточных ссылках исходника.
// Для гайдов docs/guide/ дополнительно срезается дублирующий хром сайта:
// строка-переключатель языка и ручное оглавление (## Contents /
// ## Содержание) — их заменяют header lang-switch и sidebar-TOC.
// Запускается как prebuild/predev — часть `npm run build`.
import { mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { posix } from 'node:path';
import GithubSlugger from 'github-slugger';

const REPO = 'nv-lang/nova';
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
const GH_BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;
const GH_GRAPHQL = 'https://api.github.com/graphql';
const DEC_OUT = new URL('../src/content/decisions/', import.meta.url);
const SPEC_OUT = new URL('../src/content/spec/', import.meta.url);
const DOCS_OUT = new URL('../src/content/docs/', import.meta.url);

// Кэш дат последнего коммита источника (план 241, §1.1): site/src/data/
// source-dates.json, обновляется при успешном синке с токеном (CI/ручные
// волны). Локальные сборки без токена рендерят даты из кэша. CI кэш назад
// НЕ коммитит — освежение кэша происходит в ручных волнах, это норма.
const DATES_CACHE = new URL('../src/data/source-dates.json', import.meta.url);

// Пользовательские гайды docs/guide/<slug>.md (+ <slug>.ru.md) -> /doc/<slug>/.
// Только этот whitelist; прочее в docs/ (docs/dev/ внутреннее, docs/plans/
// планы, docs/idiom(s)/, docs/research/ и т.п.) на сайт не попадает.
// Должен совпадать с DOC_GUIDES в src/data/docs.ts.
// №307: список публикуемых гайдов больше НЕ зашит здесь. Канон — файл
// docs/guide/PUBLISHED.list в репозитории nova (план 241 Ф.1b): один slug в
// строке, `#` — комментарий. Тот же файл читает страж doc-conventions, так
// что зеркал-констант в репе сайта не остаётся.
const PUBLISHED_LIST_PATH = 'docs/guide/PUBLISHED.list';
let DOC_SLUGS = new Set();   // заполняется из манифеста до синка
async function fetchPublishedSlugs() {
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${PUBLISHED_LIST_PATH}`;
  const r = await fetchRetry(url, { headers: UA });
  if (!r.ok) throw new Error(
    `не прочитан манифест публикации ${PUBLISHED_LIST_PATH} (${r.status}) — ` +
    `он канон состава гайдов, молча падать на старый список нельзя`);
  const slugs = (await r.text())
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  if (!slugs.length) throw new Error(`манифест ${PUBLISHED_LIST_PATH} пуст`);
  return new Set(slugs);
}

// Обзорные документы spec/*.md -> /spec/<name>/
const SPEC_DOCS = new Set([
  'overview', 'revolutionary',
  'syntax', 'effects', 'conversions', 'open-questions',
]);

// slug темы из имени файла решений: 09-tooling.md -> tooling
const topicSlug = (decFile) => decFile.replace(/^\d+-/, '').replace(/\.md$/, '');

// repo-путь .md -> URL страницы сайта, либо null (ведёт на GitHub).
function pathToSite(repoPath) {
  let m = repoPath.match(/^spec\/decisions\/(\d\d-[a-z]+)\.md$/);
  if (m) return `/spec/decisions/${topicSlug(m[1])}/`;
  m = repoPath.match(/^spec\/decisions\/history\/([a-z][a-z0-9-]*)\.md$/);
  if (m) return `/spec/history/${m[1]}/`;
  // 241 Ф.2: русский файл спеки живёт на /ru/spec/<slug>/ (там же его
  // русские якоря), английский перевод — на /spec/<slug>/. Ссылки из
  // русских источников обязаны вести на русскую страницу, иначе якорь
  // не находится (поймано check-links при вводе двуязычия).
  m = repoPath.match(/^spec\/([a-z][a-z0-9-]*)\.en\.md$/);
  if (m && SPEC_DOCS.has(m[1])) return `/spec/${m[1]}/`;
  m = repoPath.match(/^spec\/([a-z][a-z0-9-]*)\.md$/);
  if (m && SPEC_DOCS.has(m[1])) return `/ru/spec/${m[1]}/`;
  m = repoPath.match(/^docs\/guide\/([a-z][a-z0-9-]*)\.ru\.md$/);
  if (m && DOC_SLUGS.has(m[1])) return `/ru/doc/${m[1]}/`;
  m = repoPath.match(/^docs\/guide\/([a-z][a-z0-9-]*)\.md$/);
  if (m && DOC_SLUGS.has(m[1])) return `/doc/${m[1]}/`;
  return null;
}

// Текст заголовка markdown в том виде, в каком его слагает rehype-slug.
function headingText(line) {
  return line
    .replace(/^#+\s+/, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~]+/g, '')
    .trim();
}

// Множество валидных якорей файла: dNN для «## DNN.» (rehypeDAnchors) +
// github-слаги остальных заголовков (rehype-slug пропускает те, у кого
// уже есть id — поэтому для D-заголовков slug не вызывается).
function anchorsOf(md) {
  const set = new Set();
  const slugger = new GithubSlugger();
  for (const line of md.split('\n')) {
    const h = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (!h) continue;
    const d = h[2].match(/^D(\d+)\b/);
    if (d && h[1].length >= 2 && h[1].length <= 4) set.add('d' + d[1]);
    else set.add(slugger.slug(headingText(line)));
  }
  return set;
}

// Карта D-номер -> slug темы по всем файлам решений.
function buildDMap(decFiles) {
  const map = {};
  for (const f of decFiles) {
    if (!/^\d/.test(f.name)) continue;
    const slug = topicSlug(f.name);
    for (const m of f.text.matchAll(/^##[ \t]+D(\d+)\./gm)) map[m[1]] = slug;
  }
  return map;
}

// Срезать дублирующий хром сайта из тела гайда docs/guide/.
function stripDocChrome(md) {
  // строка-переключатель языка («**English** | [Русский](x.ru.md)» либо
  // зеркально для RU) — на сайте её заменяет lang-switch в шапке.
  md = md.replace(
    /^(?:\*\*English\*\*|\[English\]\([^)]*\))[ \t]*\|[ \t]*(?:\[Русский\]\([^)]*\)|\*\*Русский\*\*)[ \t]*\r?\n\r?\n?/m,
    '',
  );
  // ручное оглавление (## Contents / ## Содержание + список) до
  // закрывающего --- или следующего заголовка — заменяет sidebar-TOC.
  md = md.replace(
    /^##[ \t]+(?:Contents|Содержание)[ \t]*\r?\n[\s\S]*?(?:^---[ \t]*\r?\n|(?=^#{1,2}[ \t]))/m,
    '',
  );
  return md;
}

const isLink = (t) =>
  t.startsWith('#') || t.startsWith('./') || t.startsWith('../') ||
  /\.md([#?]|$)/.test(t);

// Переписать ссылки markdown под структуру сайта.
function rewriteLinks(md, repoPath, dMap, anchors) {
  const dir = posix.dirname(repoPath);
  // Reference-стиль markdown: строка вида «[D58]: ../spec/decisions/03-syntax.md».
  // Инлайновый перезаписчик ниже такие не видел, и ссылка уезжала на сайт как
  // есть — 404 (найдено проверкой относительных .md, 2026-08-04).
  md = md.replace(/^(\[[^\]]+\]:\s*)([^\s#]+\.md)(#[^\s]*)?\s*$/gm,
    (full, label, rawPath, hash) => {
      let resolved = posix.normalize(posix.join(dir, rawPath));
      let site = pathToSite(resolved);
      if (!site) {                      // путь мог быть записан от корня репы
        const fromRoot = posix.normalize(rawPath.replace(/^(\.\.\/)+/, ''));
        site = pathToSite(fromRoot);
        if (site) resolved = fromRoot;
      }
      return site ? `${label}${site}${hash ?? ''}`
                  : `${label}${GH_BLOB}/${resolved}${hash ?? ''}`;
    });

  const selfUrl = pathToSite(repoPath);
  return md.replace(
    /\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g,
    (full, target) => {
      if (/^(https?:|mailto:|tel:)/i.test(target)) return full;
      if (!isLink(target)) return full; // не ссылка (код вида `T[x](y)`)

      const hash = target.indexOf('#');
      const rawPath = hash >= 0 ? target.slice(0, hash) : target;
      const anchor = hash >= 0 ? target.slice(hash + 1) : '';
      const dm = anchor.match(/^d(\d+)$/i);

      // ссылка-якорь на ту же страницу
      if (rawPath === '') {
        if (dm) {
          const slug = dMap[dm[1]];
          return `](${slug ? `/spec/decisions/${slug}/#d${dm[1]}` : '/spec/decisions/'})`;
        }
        if (selfUrl && anchors.get(selfUrl)?.has(anchor)) return full;
        return '](#)'; // якоря нет на странице — ведём на верх
      }

      // ссылка на файл
      const resolved = posix.normalize(posix.join(dir, rawPath));
      const site = pathToSite(resolved);
      if (!site) {
        return `](${GH_BLOB}/${resolved}${anchor ? '#' + anchor : ''})`;
      }
      if (dm) {
        const slug = dMap[dm[1]];
        return `](${slug ? `/spec/decisions/${slug}/#d${dm[1]}` : site})`;
      }
      if (anchor) {
        return `](${anchors.get(site)?.has(anchor) ? `${site}#${anchor}` : site})`;
      }
      return `](${site})`;
    },
  );
}

// ── Даты последнего коммита источника (план 241, §1.1) ────────────────────
// GraphQL-батч по всем путям (commit.history(path:) через aliases p0..pN)
// работает только с токеном (CI). Локальная сборка без токена берёт кэш
// source-dates.json; свежие даты попадают в кэш при успешном синке с токеном.
// Нет даты ни в ответе, ни в кэше — поле sourceDate в frontmatter не пишется
// и блок даты на странице не рендерится (#honest-dates: дата сборки как
// fallback ЗАПРЕЩЕНА). Для ru-пар (*.ru.md) дата берётся от СВОЕГО файла —
// каждый путь опрашивается отдельно.

async function loadDateCache() {
  try {
    return JSON.parse(await readFile(DATES_CACHE, 'utf8'));
  } catch {
    return {};
  }
}

async function saveDateCache(map) {
  try {
    await writeFile(DATES_CACHE, JSON.stringify(map, null, 2) + '\n', 'utf8');
  } catch (e) {
    console.warn('sync: кэш дат не записан:', e instanceof Error ? e.message : e);
  }
}

// map path -> ISO committedDate последнего коммита пути на BRANCH.
async function fetchDatesGraphQL(paths, token) {
  const CHUNK = 50;
  const out = {};
  for (let i = 0; i < paths.length; i += CHUNK) {
    const chunk = paths.slice(i, i + CHUNK);
    const fields = chunk
      .map((p, j) =>
        `p${j}: history(first: 1, path: ${JSON.stringify(p)}) { nodes { committedDate } }`)
      .join('\n');
    const query =
      'query {\n' +
      '  repository(owner: "nv-lang", name: "nova") {\n' +
      '    object(expression: "main") {\n' +
      '      ... on Commit {\n' +
      `        ${fields}\n` +
      '      }\n' +
      '    }\n' +
      '  }\n' +
      '}';
    const res = await fetch(GH_GRAPHQL, {
      method: 'POST',
      headers: {
        ...UA,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`GraphQL ${res.status}`);
    const data = await res.json();
    if (data.errors) throw new Error('GraphQL: ' + data.errors.map((e) => e.message).join('; '));
    const commit = data.data?.repository?.object ?? null;
    for (let j = 0; j < chunk.length; j++) {
      const nodes = commit?.[`p${j}`]?.nodes;
      if (nodes?.length) out[chunk[j]] = nodes[0].committedDate;
    }
  }
  return out;
}

async function sourceDates(paths) {
  const cache = await loadDateCache();
  if (!process.env.GITHUB_TOKEN) {
    console.log(`sync: даты источников — из кэша (${Object.keys(cache).length} путей), токена нет`);
    return cache; // локально — кэш; GraphQL без токена недоступен
  }
  try {
    const fresh = await fetchDatesGraphQL(paths, process.env.GITHUB_TOKEN);
    const merged = { ...cache, ...fresh };
    await saveDateCache(merged);
    console.log(`sync: даты источников — GraphQL, ${Object.keys(fresh).length} путей`);
    return merged;
  } catch (e) {
    console.warn('sync: GraphQL дат не сработал, рендер из кэша:',
      e instanceof Error ? e.message : e);
    return cache;
  }
}

// frontmatter сгенерированной страницы: путь источника + дата коммита.
// Исходники в nova могут нести СВОЙ frontmatter (spec/*.en.md — source_rev/
// source_date перевода). Его нужно срезать, иначе он попадёт в тело страницы
// вторым блоком «---» и отрисуется как текст (поймано на /spec/syntax/).
function stripSourceFrontmatter(text) {
  const t = text.replace(/^\uFEFF/, "");
  if (!t.startsWith("---")) return text;
  const nl = String.fromCharCode(10);
  const end = t.indexOf(nl + "---", 3);
  if (end < 0) return text;
  const after = t.slice(end + 4);
  const cut = after.indexOf(nl);
  return (cut < 0 ? "" : after.slice(cut + 1)).replace(/^\s*\n/, "");
}

function frontmatter(repoPath, date) {
  const lines = ['---', `sourcePath: ${JSON.stringify(repoPath)}`];
  if (date) lines.push(`sourceDate: ${JSON.stringify(date.slice(0, 10))}`);
  lines.push('---');
  return lines.join('\n') + '\n\n';
}

async function main() {
  const apiHeaders = { ...UA, Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN)
    apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  // состав гайдов — из манифеста репы nova (№307), не из зашитого списка
  DOC_SLUGS = await fetchPublishedSlugs();

  // имена нужных doc-файлов (EN + RU) для отбора из дерева репозитория
  const DOC_FILES = new Set();
  for (const s of DOC_SLUGS) {
    DOC_FILES.add(`docs/guide/${s}.md`);
    DOC_FILES.add(`docs/guide/${s}.ru.md`);
  }

  // всё дерево репозитория -> отбор spec/**/*.md + выбранных docs/guide/*.md
  const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
  const tr = await fetchRetry(treeUrl, { headers: apiHeaders });
  if (!tr.ok) throw new Error(`GitHub API ${tr.status} — ${treeUrl}`);
  const paths = (await tr.json()).tree
    .filter((e) => e.type === 'blob' && e.path.endsWith('.md') &&
      (e.path.startsWith('spec/') || DOC_FILES.has(e.path)))
    .map((e) => e.path);
  if (paths.length === 0) throw new Error('нет .md в spec/ и docs/guide/');

  const files = [];
  for (const p of paths) {
    const r = await fetchRetry(
      `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`, { headers: UA });
    if (!r.ok) throw new Error(`fetch ${r.status} — ${p}`);
    files.push({ path: p, text: await r.text() });
  }

  // классификация
  const decFiles = []; // { name, text, path }
  const specFiles = []; // { rel, text, path }
  const docFiles = []; // { slug, lang, text, path }
  for (const f of files) {
    let m;
    if ((m = f.path.match(/^spec\/decisions\/(\d\d-[a-z]+\.md|README\.md)$/)))
      decFiles.push({ name: m[1], text: f.text, path: f.path });
    else if ((m = f.path.match(/^spec\/decisions\/history\/([a-z][a-z0-9-]*\.md)$/)))
      specFiles.push({ rel: `history/${m[1]}`, text: f.text, path: f.path });
    // 241 Ф.2: английские переводы читательской спеки — отдельной веткой,
    // ложатся в подкаталог en/ коллекции. Русский файл остаётся нормативом
    // и адресуется прежним id (без префикса).
    else if ((m = f.path.match(/^spec\/([a-z][a-z0-9-]*)\.en\.md$/)) && SPEC_DOCS.has(m[1]))
      specFiles.push({ rel: `en/${m[1]}.md`, text: f.text, path: f.path });
    else if ((m = f.path.match(/^spec\/([a-z][a-z0-9-]*)\.md$/)) && SPEC_DOCS.has(m[1]))
      specFiles.push({ rel: `${m[1]}.md`, text: f.text, path: f.path });
    else if ((m = f.path.match(/^docs\/guide\/([a-z][a-z0-9-]*)\.ru\.md$/)) && DOC_SLUGS.has(m[1]))
      docFiles.push({ slug: m[1], lang: 'ru', text: stripDocChrome(f.text), path: f.path });
    else if ((m = f.path.match(/^docs\/guide\/([a-z][a-z0-9-]*)\.md$/)) && DOC_SLUGS.has(m[1]))
      docFiles.push({ slug: m[1], lang: 'en', text: stripDocChrome(f.text), path: f.path });
  }
  if (decFiles.length === 0 || specFiles.length === 0)
    throw new Error('неожиданная структура spec/');
  if (docFiles.length === 0)
    throw new Error('не найдены гайды docs/guide/ (DOC_SLUGS)');

  const dMap = buildDMap(decFiles);
  const anchors = new Map();
  for (const f of [...decFiles, ...specFiles, ...docFiles]) {
    const url = pathToSite(f.path);
    if (url) anchors.set(url, anchorsOf(f.text));
  }

  const dates = await sourceDates(files.map((f) => f.path));

  await rm(DEC_OUT, { recursive: true, force: true });
  await rm(SPEC_OUT, { recursive: true, force: true });
  await rm(DOCS_OUT, { recursive: true, force: true });
  await mkdir(DEC_OUT, { recursive: true });
  await mkdir(new URL('history/', SPEC_OUT), { recursive: true });
  await mkdir(new URL('en/', SPEC_OUT), { recursive: true });
  await mkdir(new URL('en/', DOCS_OUT), { recursive: true });
  await mkdir(new URL('ru/', DOCS_OUT), { recursive: true });
  for (const f of decFiles)
    await writeFile(new URL(f.name, DEC_OUT),
      frontmatter(f.path, dates[f.path]) + rewriteLinks(stripSourceFrontmatter(f.text), f.path, dMap, anchors), 'utf8');
  for (const f of specFiles)
    await writeFile(new URL(f.rel, SPEC_OUT),
      frontmatter(f.path, dates[f.path]) + rewriteLinks(stripSourceFrontmatter(f.text), f.path, dMap, anchors), 'utf8');
  for (const f of docFiles)
    await writeFile(new URL(`${f.lang}/${f.slug}.md`, DOCS_OUT),
      frontmatter(f.path, dates[f.path]) + rewriteLinks(stripSourceFrontmatter(f.text), f.path, dMap, anchors), 'utf8');

  // №307: навигация и мета-теги страниц гайдов — ИЗ МАНИФЕСТА, а не из
  // ручной таблицы. Заголовок берём из H1 файла, описание — из первого
  // содержательного абзаца. Курируемые SEO-тексты остаются в docs.ts и
  // перекрывают сгенерированное (см. CURATED там же).
  const meta = new Map();
  for (const f of docFiles) {
    const lines = f.text.split(/\r?\n/);
    const h1 = (lines.find((l) => /^#\s+/.test(l)) || '').replace(/^#\s+/, '').trim();
    let desc = '';
    for (const l of lines) {
      const t = l.trim();
      if (!t || t.startsWith('#') || t.startsWith('>') || t.startsWith('`')
          || t.startsWith('|') || t.startsWith('-') || t.startsWith('*')
          || t.startsWith('[') || t.startsWith('<')) continue;
      desc = t.replace(/[*`_]/g, '');
      break;
    }
    if (desc.length > 200) desc = desc.slice(0, 197).replace(/\s+\S*$/, '') + '…';
    const e = meta.get(f.slug) || { slug: f.slug };
    e[f.lang] = { title: h1, description: desc };
    meta.set(f.slug, e);
  }
  const generated = [...meta.values()]
    .filter((e) => e.en && e.ru)
    .sort((a, b) => a.slug.localeCompare(b.slug))
    .map((e) => ({
      slug: e.slug,
      github: `docs/guide/${e.slug}.md`,
      title: { en: e.en.title, ru: e.ru.title },
      description: { en: e.en.description, ru: e.ru.description },
    }));
  await writeFile(new URL('../src/data/docs.generated.ts', import.meta.url),
    '// СГЕНЕРИРОВАНО scripts/sync-decisions.mjs из docs/guide/PUBLISHED.list\n' +
    '// репозитория nova (№307). Руками не править — правь источник в nova.\n' +
    "import type { DocGuide } from './docs';\n\n" +
    'export const DOC_GUIDES_GENERATED: DocGuide[] = ' +
    JSON.stringify(generated, null, 2) + ';\n', 'utf8');

  console.log(
    `sync: ${decFiles.length} файлов решений + ${specFiles.length} spec-документов + ` +
    `${docFiles.length} doc-гайдов, ${Object.keys(dMap).length} D-блоков`);
}

main().catch((e) => {
  console.error('sync-decisions FAILED:', e.message);
  process.exit(1);
});
