// Fija la URL pública del sitio en las plantillas: canonical, og:image, JSON-LD, <base> del 404, sitemap.xml y robots.txt.
// Uso:
//   node scripts/set-domain.mjs https://www.casafederico.es                       → dominio definitivo (indexable)
//   node scripts/set-domain.mjs https://alexsivera.github.io/casa-federico-denia --preview
//       → vista previa: noindex + robots Disallow, para que la demo no compita con la web oficial en Google
// Después ejecuta npm run build. La URL anterior se guarda en package.json ("siteUrl") y se sustituye.
import { readFile, writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const preview = args.includes('--preview');
const site = (args.find((a) => !a.startsWith('--')) || '').replace(/\/$/, '');
if (!/^https:\/\/[^/\s]+(\/[^\s]*)?$/.test(site)) {
  console.error('Indica la URL con https:// y sin barra final. Ej.: node scripts/set-domain.mjs https://www.ejemplo.es [--preview]');
  process.exit(1);
}
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const anterior = pkg.siteUrl || 'https://alexsivera.github.io/casa-federico-denia';
const NOINDEX = '<meta name="robots" content="noindex, nofollow">';
const pages = ['index.html', 'carta.html', 'reservas.html'];

for (const p of pages) {
  let html = await readFile(`_plantillas/${p}`, 'utf8');
  html = html.split(anterior + '/').join(site + '/');
  html = html.replace(`\n  ${NOINDEX}`, '');
  if (preview) html = html.replace('\n  <meta name="theme-color"', `\n  ${NOINDEX}\n  <meta name="theme-color"`);
  await writeFile(`_plantillas/${p}`, html);
}

const ruta = new URL(site).pathname.replace(/\/?$/, '/');
let e404 = await readFile('404.html', 'utf8');
e404 = e404.replace(/<base href="[^"]*">/, `<base href="${ruta}">`);
await writeFile('404.html', e404);

const hoy = new Date().toISOString().slice(0, 10);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${['', 'carta.html', 'reservas.html'].map((u) => `  <url><loc>${site}/${u}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);
await writeFile('robots.txt', preview
  ? `# Vista previa: no indexar hasta publicar en el dominio definitivo.\nUser-agent: *\nDisallow: /\n`
  : `User-agent: *\nAllow: /\nSitemap: ${site}/sitemap.xml\n`);

pkg.siteUrl = site;
await writeFile('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log(`Sitio: ${site}${preview ? ' (vista previa, noindex)' : ''}. Ejecuta npm run build.`);
