// Дата последнего коммита источника для рукописных страниц (план 241, §1.3):
// ВСЕГДА по локальному `git log -1 --format=%cI -- <партиал>` — сборка идёт
// из клона www, это бесплатно. CI делает checkout с fetch-depth: 0
// (.github/workflows/deploy.yml), чтобы даты не схлопывались к дате
// последнего пуша (depth-ловушка, #honest-dates).
import { execSync } from 'node:child_process';
import { join } from 'node:path';

let repoRoot: string | null | undefined;

function root(): string | null {
  if (repoRoot !== undefined) return repoRoot;
  try {
    repoRoot = execSync('git rev-parse --show-toplevel', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    repoRoot = null;
  }
  return repoRoot;
}

/** ISO-дата последнего коммита файла (git log -1 --format=%cI), либо undefined. */
export function gitFileDate(absPath: string): string | undefined {
  const r = root();
  if (!r) return undefined;
  const abs = absPath.replace(/\\/g, '/');
  const prefix = r.replace(/\\/g, '/') + '/';
  const rel = abs.startsWith(prefix) ? abs.slice(prefix.length) : abs;
  try {
    const out = execSync(
      `git log -1 --format=%cI -- "${rel}"`,
      { cwd: r, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim();
    return out || undefined;
  } catch {
    return undefined;
  }
}

/**
 * ISO-дата последнего коммита партиала (имя файла в src/partials/).
 * Путь партиала считается от корня клона www (site/src/partials/<f>), а не
 * через import.meta.url: при сборке Astro импортированные модули бандлятся,
 * и import.meta.url указывает на dist/.prerender/chunks/ (не на исходник).
 */
export function partialDate(fileName: string): string | undefined {
  const r = root();
  if (!r) return undefined;
  return gitFileDate(join(r, 'site', 'src', 'partials', fileName));
}
