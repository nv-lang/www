// Синхронизация спецификации Nova из репозитория nv-lang/nova.
// Тянет ВСЁ дерево spec/ и раскладывает по контент-коллекциям сайта:
//   spec/decisions/NN-*.md, README.md  -> src/content/decisions/
//   spec/*.md (обзорные документы)      -> src/content/spec/
//   spec/decisions/history/*.md         -> src/content/spec/history/
// Перекрёстные ссылки переписываются под URL сайта; якоря, которых нет
// на целевой странице, отбрасываются (ссылка ведёт на саму страницу) —
// чтобы линк-чекер не падал на неточных ссылках исходника.
// Запускается как prebuild/predev — часть `npm run build`.
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { posix } from 'node:path';
import GithubSlugger from 'github-slugger';

const REPO = 'nv-lang/nova';
const BRANCH = 'main';
const UA = { 'User-Agent': 'nv-lang-www-build' };
const GH_BLOB = `https://github.com/${REPO}/blob/${BRANCH}`;
const DEC_OUT = new URL('../src/content/decisions/', import.meta.url);
const SPEC_OUT = new URL('../src/content/spec/', import.meta.url);

// Обзорные документы spec/*.md -> /spec/<name>/
const SPEC_DOCS = new Set([
  'overview', 'paradigm', 'revolutionary',
  'syntax', 'effects', 'conversions', 'open-questions',
]);

// slug темы из имени файла решений: 09-tooling.md -> tooling
const topicSlug = (decFile) => decFile.replace(/^\d+-/, '').replace(/\.md$/, '');

// repo-путь .md -> URL страницы сайта, либо null (ведёт на GitHub).
function pathToSite(repoPath) {
  let m = repoPath.match(/^spec\/decisions\/(\d\d-[a-z]+)\.md$/);
  if (m) return `/spec/decisions/${topicSlug(m[1])}/`;
  m = repoPath.match(/^spec\/decisions\/history\/([a-z][a-z-]*)\.md$/);
  if (m) return `/spec/history/${m[1]}/`;
  m = repoPath.match(/^spec\/([a-z][a-z-]*)\.md$/);
  if (m && SPEC_DOCS.has(m[1])) return `/spec/${m[1]}/`;
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

const isLink = (t) =>
  t.startsWith('#') || t.startsWith('./') || t.startsWith('../') ||
  /\.md([#?]|$)/.test(t);

// Переписать ссылки markdown под структуру сайта.
function rewriteLinks(md, repoPath, dMap, anchors) {
  const dir = posix.dirname(repoPath);
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

async function main() {
  const apiHeaders = { ...UA, Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN)
    apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  // всё дерево репозитория -> отбор spec/**/*.md
  const treeUrl = `https://api.github.com/repos/${REPO}/git/trees/${BRANCH}?recursive=1`;
  const tr = await fetch(treeUrl, { headers: apiHeaders });
  if (!tr.ok) throw new Error(`GitHub API ${tr.status} — ${treeUrl}`);
  const paths = (await tr.json()).tree
    .filter((e) => e.type === 'blob' && e.path.startsWith('spec/') && e.path.endsWith('.md'))
    .map((e) => e.path);
  if (paths.length === 0) throw new Error('нет .md в spec/');

  const files = [];
  for (const p of paths) {
    const r = await fetch(
      `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${p}`, { headers: UA });
    if (!r.ok) throw new Error(`fetch ${r.status} — ${p}`);
    files.push({ path: p, text: await r.text() });
  }

  // классификация
  const decFiles = []; // { name, text, path }
  const specFiles = []; // { rel, text, path }
  for (const f of files) {
    let m;
    if ((m = f.path.match(/^spec\/decisions\/(\d\d-[a-z]+\.md|README\.md)$/)))
      decFiles.push({ name: m[1], text: f.text, path: f.path });
    else if ((m = f.path.match(/^spec\/decisions\/history\/([a-z][a-z-]*\.md)$/)))
      specFiles.push({ rel: `history/${m[1]}`, text: f.text, path: f.path });
    else if ((m = f.path.match(/^spec\/([a-z][a-z-]*)\.md$/)) && SPEC_DOCS.has(m[1]))
      specFiles.push({ rel: `${m[1]}.md`, text: f.text, path: f.path });
  }
  if (decFiles.length === 0 || specFiles.length === 0)
    throw new Error('неожиданная структура spec/');

  const dMap = buildDMap(decFiles);
  const anchors = new Map();
  for (const f of [...decFiles, ...specFiles]) {
    const url = pathToSite(f.path);
    if (url) anchors.set(url, anchorsOf(f.text));
  }

  await rm(DEC_OUT, { recursive: true, force: true });
  await rm(SPEC_OUT, { recursive: true, force: true });
  await mkdir(DEC_OUT, { recursive: true });
  await mkdir(new URL('history/', SPEC_OUT), { recursive: true });
  for (const f of decFiles)
    await writeFile(new URL(f.name, DEC_OUT),
      rewriteLinks(f.text, f.path, dMap, anchors), 'utf8');
  for (const f of specFiles)
    await writeFile(new URL(f.rel, SPEC_OUT),
      rewriteLinks(f.text, f.path, dMap, anchors), 'utf8');

  console.log(
    `sync: ${decFiles.length} файлов решений + ${specFiles.length} spec-документов, ` +
    `${Object.keys(dMap).length} D-блоков`);
}

main().catch((e) => {
  console.error('sync-decisions FAILED:', e.message);
  process.exit(1);
});
