const fs = require('fs');
const path = require('path');

const SITE_URL = process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://yourdomain.com');

function buildSitemap(urls) {
  const today = new Date().toISOString();
  const items = urls.map(u => `  <url>\n    <loc>${SITE_URL.replace(/\/$/, '')}${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>`;
}

function extractSubjectSlugs(subjectFilePath) {
  try {
    const txt = fs.readFileSync(subjectFilePath, 'utf8');
    const re = /id:\s*'([^']+)'/g;
    const ids = [];
    let m;
    while ((m = re.exec(txt)) !== null) {
      ids.push(m[1]);
    }
    return ids;
  } catch (e) {
    console.warn('Could not read subjectData file to extract slugs:', e.message || e);
    return [];
  }
}

function main() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const subjectFile = path.join(process.cwd(), 'src', 'lib', 'subjectData.tsx');
  const subjectSlugs = extractSubjectSlugs(subjectFile);

  const staticUrls = [
    '/',
    '/dashboard',
    '/subjects',
    '/schedule',
    '/profile',
    '/auth',
    '/quiz'
  ];

  const subjectUrls = subjectSlugs.map(s => `/subjects/${encodeURIComponent(s)}`);

  const all = [...staticUrls, ...subjectUrls];
  const xml = buildSitemap(all);
  const out = path.join(publicDir, 'sitemap.xml');
  fs.writeFileSync(out, xml, 'utf8');
  console.log('Wrote sitemap with', all.length, 'entries to', out);
}

main();
