// Обзорные документы спецификации Nova (файлы spec/*.md и
// spec/decisions/history/*.md репозитория nova). Синхронизируются в
// коллекцию `spec`; страницы — src/pages/spec/[...slug].astro.
export interface SpecDoc {
  id: string;            // id записи коллекции spec
  slug: string;          // сегмент(ы) URL под /spec/
  title: string;          // русский заголовок (норматив)
  titleEn?: string;       // английский — для /spec/<slug>/ (241 Ф.2)
  github: string;        // путь файла в репозитории nv-lang/nova
  group: 'guide' | 'history';
}

export const SPEC_DOCS: SpecDoc[] = [
  { id: 'overview',       slug: 'overview',       title: 'Обзор языка',
    titleEn: 'Language overview',
    github: 'spec/overview.md',       group: 'guide' },
  { id: 'syntax',         slug: 'syntax',         title: 'Синтаксис',
    titleEn: 'Syntax',
    github: 'spec/syntax.md',         group: 'guide' },
  { id: 'effects',        slug: 'effects',        title: 'Система эффектов',
    titleEn: 'Effect system',
    github: 'spec/effects.md',        group: 'guide' },
  { id: 'conversions',    slug: 'conversions',    title: 'Конверсии типов',
    titleEn: 'Type conversions',
    github: 'spec/conversions.md',    group: 'guide' },
  { id: 'revolutionary',  slug: 'revolutionary',  title: 'Революционные возможности',
    titleEn: 'Revolutionary features',
    github: 'spec/revolutionary.md',  group: 'guide' },
  { id: 'open-questions', slug: 'open-questions', title: 'Открытые вопросы дизайна',
    titleEn: 'Open design questions',
    github: 'spec/open-questions.md', group: 'guide' },
  { id: 'history/evolution', slug: 'history/evolution', title: 'Эволюция решений',
    github: 'spec/decisions/history/evolution.md', group: 'history' },
  { id: 'history/rejected',  slug: 'history/rejected',  title: 'Отвергнутые альтернативы',
    github: 'spec/decisions/history/rejected.md',  group: 'history' },
];
