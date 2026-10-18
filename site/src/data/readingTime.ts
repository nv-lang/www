// Время чтения поста блога для карточек в списке /blog/ и /ru/blog/.
// Правило записано в CLAUDE.md, раздел «Блог»: считаются слова тела поста
// без блоков кода, ссылок и картинок; 250 слов в минуту; минимум 1 минута.
export const WORDS_PER_MINUTE = 250;

export function readingMinutes(body: string | undefined): number {
  const text = (body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')        // блоки кода
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')  // картинки
    .replace(/\]\([^)]*\)/g, ']')           // адреса ссылок, текст ссылки остаётся
    .replace(/<[^>]+>/g, ' ');              // html-теги
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}
