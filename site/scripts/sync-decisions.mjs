// Синхронизация D-блоков спецификации.
// Тянет spec/decisions/*.md из репозитория nv-lang/nova через
// raw.githubusercontent.com — только нужные файлы, без клонирования репо.
// Запускается как prebuild/predev — часть `npm run build`, работает
// одинаково локально и в CI (отдельный шаг workflow не нужен).
import { mkdir, writeFile, rm } from 'node:fs/promises';

const REPO = 'nv-lang/nova';
const BRANCH = 'main';
const SRC = 'spec/decisions';
const OUT = new URL('../src/content/decisions/', import.meta.url);
const UA = { 'User-Agent': 'nv-lang-www-build' };
const GH_BLOB = `https://github.com/${REPO}/blob/${BRANCH}/spec`;

// slug темы из имени файла: 09-tooling.md -> tooling
const slugOf = (name) => name.replace(/^\d+-/, '').replace(/\.md$/, '');

// Карта D-номер -> slug темы по ВСЕМ файлам. Нужна, потому что исходник
// бывает неточен: ссылка (#dNN) или (NN-file.md#dNN) может указывать на
// блок, который физически лежит в другом файле (D-блоки переезжают между
// темами). Карта строится из фактических заголовков «## DNN.».
function buildDMap(files) {
  const map = {};
  for (const { name, text } of files) {
    const slug = slugOf(name);
    for (const m of text.matchAll(/^##[ \t]+D(\d+)\./gm)) map[m[1]] = slug;
  }
  return map;
}

// Переписать перекрёстные ссылки .md под структуру сайта /spec/decisions/.
// Любая ссылка на D-блок приводится к каноническому пути по карте dMap —
// тема определяется по факту, а не по тому, как ссылка записана в исходнике.
function rewriteLinks(md, dMap) {
  return md
    // ссылка на D-блок в любой форме:
    //   (#d52), (#d52-slug), (02-types.md#d52), (02-types.md#d52-slug)
    .replace(/\((?:\d\d-[a-z]+\.md)?#d(\d+)[^)]*\)/gi, (full, n) => {
      const slug = dMap[n];
      return slug ? `(/spec/decisions/${slug}/#d${n})` : full;
    })
    // ссылка на файл решений целиком: (02-types.md) -> (/spec/decisions/types/)
    .replace(/\((\d\d)-([a-z]+)\.md\)/g, '(/spec/decisions/$2/)')
    // history/ и ../ (в репо, не на сайте) -> GitHub
    .replace(/\(history\/([^)]*)\)/g, `(${GH_BLOB}/decisions/history/$1)`)
    .replace(/\(\.\.\/([^)]*)\)/g, `(${GH_BLOB}/$1)`);
}

async function main() {
  // Список файлов каталога — через GitHub contents API.
  // GITHUB_TOKEN (в CI — github.token) поднимает лимит API 60/ч → 5000/ч.
  const apiHeaders = { ...UA, Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    apiHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const api = `https://api.github.com/repos/${REPO}/contents/${SRC}?ref=${BRANCH}`;
  const res = await fetch(api, { headers: apiHeaders });
  if (!res.ok) throw new Error(`GitHub API ${res.status} — ${api}`);
  const entries = (await res.json()).filter(
    (e) => e.type === 'file' && e.name.endsWith('.md'),
  );
  if (entries.length === 0) throw new Error(`нет .md в ${SRC}`);

  // Скачать все файлы — карта D->тема строится по полному набору.
  const files = [];
  for (const e of entries) {
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${SRC}/${e.name}`;
    const r = await fetch(url, { headers: UA });
    if (!r.ok) throw new Error(`fetch ${r.status} — ${url}`);
    files.push({ name: e.name, text: await r.text() });
  }
  const dMap = buildDMap(files);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });
  for (const { name, text } of files) {
    await writeFile(new URL(name, OUT), rewriteLinks(text, dMap), 'utf8');
    console.log(`  ✓ ${name}`);
  }
  console.log(
    `sync-decisions: ${files.length} файлов, ${Object.keys(dMap).length} D-блоков`,
  );
}

main().catch((e) => {
  console.error('sync-decisions FAILED:', e.message);
  process.exit(1);
});
