// Разделы спецификации Nova (файлы spec/decisions/ репозитория nova).
export interface Topic {
  file: string;  // id записи коллекции = имя файла без расширения
  slug: string;  // сегмент URL
  title: string;          // русский
  titleEn?: string;       // английский — для /spec/ (241 Ф.2)
}

export const TOPICS: Topic[] = [
  { file: '01-philosophy', slug: 'philosophy', title: 'Философия' , titleEn: 'Philosophy' },
  { file: '02-types', slug: 'types', title: 'Типы' , titleEn: 'Types' },
  { file: '03-syntax', slug: 'syntax', title: 'Синтаксис' , titleEn: 'Syntax' },
  { file: '04-effects', slug: 'effects', title: 'Эффекты' , titleEn: 'Effects' },
  { file: '05-memory', slug: 'memory', title: 'Память' , titleEn: 'Memory' },
  { file: '06-concurrency', slug: 'concurrency', title: 'Конкурентность' , titleEn: 'Concurrency' },
  { file: '07-modules', slug: 'modules', title: 'Модули' , titleEn: 'Modules' },
  { file: '08-runtime', slug: 'runtime', title: 'Рантайм' , titleEn: 'Runtime' },
  { file: '09-tooling', slug: 'tooling', title: 'Инструменты' , titleEn: 'Tooling' },
  { file: '10-overloading', slug: 'overloading', title: 'Перегрузка' , titleEn: 'Overloading' },
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
