// Проверка целостности ссылок в собранном сайте (dist/).
// Запускается как `postbuild` — падение валит `npm run build`, а значит и
// CI-сборку: красный CI = нет деплоя. Локальная сборка проверяется так же.
//
// Что проверяется:
//  • каждая внутренняя ссылка (href/src + любой https://nv-lang.org/...) —
//    целевой файл существует в dist/;
//  • каждый якорь #id — в целевом файле есть элемент с таким id;
//  • каждый <loc> из sitemap.xml — соответствующий файл существует.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const ORIGIN = 'https://nv-lang.org';

if (!existsSync(DIST)) {
  console.error('check-links: dist/ не найден — сначала запусти сборку');
  process.exit(1);
}

// Рекурсивный обход dist/ — собрать все .html.
function htmlFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...htmlFiles(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

// URL-путь (начинается с /) → файл на диске или null.
function resolveUrlPath(urlPath) {
  let p = urlPath;
  if (p === '/' || p.endsWith('/')) p += 'index.html';
  const direct = join(DIST, p);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  // путь без расширения и без / — попробовать .html и /index.html
  if (!p.includes('.')) {
    const asHtml = join(DIST, p + '.html');
    if (existsSync(asHtml)) return asHtml;
    const asDir = join(DIST, p, 'index.html');
    if (existsSync(asDir)) return asDir;
  }
  return null;
}

// Множество id-ов файла (кэш) — для проверки якорей.
const idCache = new Map();
function idsOf(file) {
  let ids = idCache.get(file);
  if (ids) return ids;
  ids = new Set();
  for (const m of readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g))
    ids.add(m[1]);
  idCache.set(file, ids);
  return ids;
}

// Настоящие ссылки страницы: атрибуты href/src + URL своего домена в
// og/twitter-мета. Содержимое <pre>/<code> вырезается — примеры команд
// (curl … | sh и т.п.) ссылками не являются и проверке не подлежат.
function linksOf(html) {
  const clean = html
    .replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/gi, '');
  const links = new Set();
  for (const m of clean.matchAll(/(?:href|src)="([^"]*)"/g)) links.add(m[1]);
  for (const m of clean.matchAll(
    /<meta[^>]+content="(https:\/\/nv-lang\.org[^"]*)"/g,
  ))
    links.add(m[1]);
  return links;
}

const errors = [];
const files = htmlFiles(DIST);

for (const file of files) {
  const rel = file.slice(DIST.length).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  for (const raw of linksOf(html)) {
    let link = raw.trim();
    if (!link) continue;
    if (/^(mailto:|tel:|data:|javascript:)/i.test(link)) continue;
    if (link.startsWith('//')) continue; // protocol-relative — внешнее
    if (link.startsWith(ORIGIN)) link = link.slice(ORIGIN.length) || '/';
    else if (/^https?:\/\//i.test(link)) continue; // чужой домен
    if (!link.startsWith('/') && !link.startsWith('#')) continue;

    let [path, anchor] = link.split('#');
    path = path.split('?')[0];
    // якоря/пути сравниваем декодированными: id в HTML — сырой UTF-8,
    // а href может быть percent-encoded (кириллица в #-якоре).
    const decode = (s) => {
      try { return decodeURIComponent(s); } catch { return s; }
    };
    path = decode(path);
    if (anchor) anchor = decode(anchor);

    let target;
    if (path === '') {
      target = file; // ссылка только #anchor — текущая страница
    } else {
      target = resolveUrlPath(path);
      if (!target) {
        errors.push(`${rel}: битая ссылка → ${raw}`);
        continue;
      }
    }
    if (anchor && !idsOf(target).has(anchor))
      errors.push(`${rel}: нет якоря #${anchor} → ${raw}`);
  }
}

// sitemap.xml — каждый <loc> должен соответствовать файлу.
const sitemap = join(DIST, 'sitemap.xml');
if (existsSync(sitemap)) {
  const xml = readFileSync(sitemap, 'utf8');
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    let u = m[1];
    if (u.startsWith(ORIGIN)) u = u.slice(ORIGIN.length) || '/';
    if (!resolveUrlPath(u.split('#')[0]))
      errors.push(`sitemap.xml: <loc> без файла → ${m[1]}`);
  }
} else {
  errors.push('sitemap.xml не найден в dist/');
}

if (errors.length) {
  console.error(`\ncheck-links: найдено проблем — ${errors.length}:`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(
  `check-links: OK — ${files.length} страниц, все ссылки и якоря целы`,
);
