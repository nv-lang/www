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

// Переписать перекрёстные ссылки .md под структуру сайта /spec/decisions/.
function rewriteLinks(md) {
  return md
    // якорь той же страницы: (#d52-длинный-слаг) -> (#d52)
    .replace(/\(#d(\d+)[^)]*\)/g, '(#d$1)')
    // ссылка на другой файл решений: (02-types.md#d52) -> (/spec/decisions/types/#d52)
    .replace(/\((\d\d)-([a-z]+)\.md(#d\d+)?\)/g, '(/spec/decisions/$2/$3)')
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
  const md = (await res.json()).filter((e) => e.type === 'file' && e.name.endsWith('.md'));
  if (md.length === 0) throw new Error(`нет .md в ${SRC}`);

  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  for (const f of md) {
    const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${SRC}/${f.name}`;
    const r = await fetch(url, { headers: UA });
    if (!r.ok) throw new Error(`fetch ${r.status} — ${url}`);
    await writeFile(new URL(f.name, OUT), rewriteLinks(await r.text()), 'utf8');
    console.log(`  ✓ ${f.name}`);
  }
  console.log(`sync-decisions: ${md.length} файлов D-блоков получено`);
}

main().catch((e) => {
  console.error('sync-decisions FAILED:', e.message);
  process.exit(1);
});
