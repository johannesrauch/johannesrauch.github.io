// Single source of truth for the CV page. Replace the placeholders with real entries.
export interface Entry {
  title: string;
  org: string;
  place?: string;
  start: string;
  end?: string; // omit for "present"
  details?: string[];
}

export const education: Entry[] = [
  {
    title: 'PhD, Your Field',
    org: 'Your University',
    place: 'City, Country',
    start: '2022',
    details: ['Thesis: Working title here', 'Advisor: Prof. Name'],
  },
  {
    title: 'MSc, Your Field',
    org: 'Your University',
    place: 'City, Country',
    start: '2019',
    end: '2021',
  },
];

export const experience: Entry[] = [
  {
    title: 'Research Assistant',
    org: 'Your Institute',
    place: 'City, Country',
    start: '2021',
    details: ['One line describing what you did or achieved.'],
  },
];

export const publications: { authors: string; title: string; venue: string; year: string; href?: string }[] = [
  {
    authors: 'J. Rauch, A. Coauthor',
    title: 'Placeholder paper title',
    venue: 'Journal or Conference',
    year: '2025',
    href: undefined,
  },
];

export const skills: { group: string; items: string[] }[] = [
  { group: 'Languages', items: ['Python', 'C++', 'TypeScript'] },
  { group: 'Tools', items: ['Git', 'LaTeX', 'Linux'] },
];
