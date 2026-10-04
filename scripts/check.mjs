// Comprobación estática del sitio publicado: recursos, anclas, ids, alt, h1, títulos, JSON-LD y restos de plantilla.
// Uso: npm run check   (sale con código 1 si encuentra errores)
import { readFile, access } from 'node:fs/promises';
import { posix } from 'node:path';
const { join, dirname } = posix;

const PAGES = ['index.html', 'carta.html', 'reservas.html', '404.html'];
const errores = [];
const avisos = [];
const existe = (p) => access(p).then(() => true, () => false);

for (const page of PAGES) {
  const html = await readFile(page, 'utf8');
  const err = (m) => errores.push(`${page}: ${m}`);

  const refs = new Set();
  for (const m of html.replace(/<base\b[^>]*>/, '').matchAll(/\s(?:href|src)="([^"#][^"]*)"/g)) refs.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((s) => refs.add(s.trim().split(/\s+/)[0]));
  for (const ref of refs) {
    if (/^(https?:|tel:|mailto:|data:)/.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    let file = clean.startsWith('/') ? clean.slice(1) : join(dirname(page), clean);
    if (file === '' || file === '.' || clean.endsWith('/')) file = join(file, 'index.html');
    if (!(await existe(file))) err(`recurso inexistente → ${ref}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dup.length) err(`ids duplicados: ${[...new Set(dup)].join(', ')}`);
  for (const m of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(m[1])) err(`ancla sin destino → #${m[1]}`);
  // Anclas entre páginas (./#x, carta.html#x)
  for (const m of html.matchAll(/href="(\.\/|index\.html|carta\.html)#([^"]+)"/g)) {
    const destino = await readFile(m[1] === './' ? 'index.html' : m[1], 'utf8');
    if (!destino.includes(`id="${m[2]}"`)) err(`ancla externa sin destino → ${m[1]}#${m[2]}`);
  }

  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) err(`img sin alt → ${m[0].slice(0, 80)}`);
    if (!/\swidth="\d+"/.test(m[0]) || !/\sheight="\d+"/.test(m[0])) avisos.push(`${page}: img sin width/height → ${m[0].slice(0, 60)}`);
  }

  if (!/<html lang="es">/.test(html)) err('falta lang en <html>');
  if (!/<title>[^<]{10,}<\/title>/.test(html)) err('title ausente o corto');
  if (page !== '404.html' && !/<meta name="description" content="[^"]{50,}">/.test(html)) err('meta description ausente o corta');
  const h1 = (html.match(/<h1\b/g) || []).length;
  if (h1 !== 1) err(`hay ${h1} h1`);
  const niveles = [...html.matchAll(/<h([1-6])\b/g)].map((m) => +m[1]);
  niveles.forEach((n, i) => { if (i && n > niveles[i - 1] + 1) err(`salto de título h${niveles[i - 1]} → h${n}`); });

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err(`JSON-LD inválido: ${e.message}`); }
  }
  if (/<x-pic|<x-carta|CANYIS_URL|TODO|[Ll]orem ipsum/.test(html)) err('quedan marcadores de plantilla');
}

const css = await readFile('assets/css/styles.css', 'utf8');
if (css.includes('CANYIS_URL')) errores.push('styles.css: falta el SVG del cañizo');

avisos.forEach((a) => console.warn('aviso  ', a));
errores.forEach((e) => console.error('ERROR  ', e));
console.log(errores.length ? `\n${errores.length} error(es).` : `OK: ${PAGES.length} páginas sin errores.`);
process.exit(errores.length ? 1 : 0);
