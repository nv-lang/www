// Разделы спецификации Nova (файлы spec/decisions/ репозитория nova).
export interface Topic {
  file: string;  // id записи коллекции = имя файла без расширения
  slug: string;  // сегмент URL
  title: string;
}

export const TOPICS: Topic[] = [
  { file: '01-philosophy', slug: 'philosophy', title: 'Философия' },
  { file: '02-types', slug: 'types', title: 'Типы' },
  { file: '03-syntax', slug: 'syntax', title: 'Синтаксис' },
  { file: '04-effects', slug: 'effects', title: 'Эффекты' },
  { file: '05-memory', slug: 'memory', title: 'Память' },
  { file: '06-concurrency', slug: 'concurrency', title: 'Конкурентность' },
  { file: '07-modules', slug: 'modules', title: 'Модули' },
  { file: '08-runtime', slug: 'runtime', title: 'Рантайм' },
  { file: '09-tooling', slug: 'tooling', title: 'Инструменты' },
  { file: '10-overloading', slug: 'overloading', title: 'Перегрузка' },
];

export interface DBlock {
  anchor: string;  // #dNN
  num: number;
  title: string;
}

// Извлечь D-блоки из markdown по заголовкам «## DNN. Заголовок».
export function parseDBlocks(body: string): DBlock[] {
  const out: DBlock[] = [];
  const re = /^##\s+D(\d+)\.?\s+(.+?)\s*$/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.push({
      anchor: 'd' + m[1],
      num: Number(m[1]),
      title: m[2].replace(/`/g, '').trim(),
    });
  }
  return out;
}
