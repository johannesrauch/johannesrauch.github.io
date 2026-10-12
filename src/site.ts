// Site-wide settings. Edit these first.
export const SITE = {
  name: 'Johannes Rauch',
  title: 'Johannes Rauch',
  description: 'Personal website of Johannes Rauch: about, CV, projects and blog.',
  tagline: 'Researcher with a passion for algorithms.',
  links: [
    { label: 'GitHub', href: 'https://github.com/johannesrauch' },
    // { label: 'Google Scholar', href: 'https://scholar.google.com/citations?user=...' },
    // { label: 'ORCID', href: 'https://orcid.org/...' },
  ],
  nav: [
    { label: 'About', href: '/about/' },
    { label: 'CV', href: '/cv/' },
    { label: 'Projects', href: '/projects/' },
    { label: 'Blog', href: '/blog/' },
  ],
  // Number of items shown on the landing page.
  homeItems: 3,
};

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
