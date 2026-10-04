// Genera las páginas publicadas (raíz) a partir de _plantillas/*.html.
//  · <x-pic name="…" alt="…" sizes="…" [eager] [class="…"]></x-pic> → <picture> AVIF/WebP/JPEG (o PNG) con srcset y tamaño real.
//  · <x-carta-indice></x-carta-indice> y <x-carta-platos></x-carta-platos> → carta trilingüe estática (scripts/carta-data.mjs).
// Uso: npm run build   (necesita la devDependency sharp para leer las dimensiones)
// _plantillas/ empieza por «_»: GitHub Pages (Jekyll) no la publica.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { secciones } from './carta-data.mjs';

const IMG = 'assets/img';
const files = await readdir(IMG);
const meta = {};

async function pic(attrs) {
  const a = Object.fromEntries([...attrs.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]));
  const name = a.name;
  const re = (ext) => new RegExp(`^${name}-(\\d+)\\.${ext}$`);
  const raster = files.some((f) => re('png').test(f)) ? 'png' : 'jpg';
  const widths = files.filter((f) => re(raster).test(f)).map((f) => +f.match(re(raster))[1]).sort((x, y) => x - y);
  if (!widths.length) throw new Error(`Sin imágenes para ${name}`);
  const big = `${IMG}/${name}-${widths.at(-1)}.${raster}`;
  meta[big] ??= await sharp(big).metadata();
  const { width, height } = meta[big];
  const set = (ext) => widths.map((w) => `${IMG}/${name}-${w}.${ext} ${Math.min(w, width)}w`).join(', ');
  const sizes = a.sizes || '100vw';
  const mid = widths[Math.min(1, widths.length - 1)];
  const load = a.eager ? 'fetchpriority="high" decoding="async"' : 'loading="lazy" decoding="async"';
  const cls = a.class ? ` class="${a.class}"` : '';
  return `<picture${cls}><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="${IMG}/${name}-${mid}.${raster}" srcset="${set(raster)}" sizes="${sizes}" width="${width}" height="${height}" alt="${a.alt ?? ''}" ${load}></picture>`;
}

// ——— Carta ———
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const precio = (p) => (p === 'S/M'
  ? '<abbr class="l-es" lang="es" title="Según mercado">S/M</abbr><abbr class="l-val" lang="ca" title="Segons mercat">S/M</abbr><abbr class="l-en" lang="en" title="Market price">MP</abbr>'
  : `${p.toFixed(2).replace('.', ',')}&nbsp;€`);
const tri = (o) => ['val', 'es', 'en']
  .map((l, i) => `<span class="l-${l}" lang="${['ca', 'es', 'en'][i]}">${esc(o[['v', 'e', 'n'][i]])}</span>`).join('');
const indice = secciones.map((s) => `<li><a href="#${s.id}">${tri(s)}</a></li>`).join('\n          ');
const platos = secciones.map((s, i) => `<section class="carta-sec" id="${s.id}" aria-labelledby="${s.id}-t">
        <header class="carta-sec__cab">
          <span class="carta-sec__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
          <h2 id="${s.id}-t">${tri(s)}</h2>
        </header>${s.nota ? `\n        <p class="carta-sec__nota">${tri(s.nota)}</p>` : ''}
        <ul class="platos">
${s.platos.map((p) => `          <li class="plato${p.v === p.e ? ' plato--ves' : ''}${p.v === p.n ? ' plato--ven' : ''}">
            <p class="plato__nom">${tri(p)}</p>${p.d ? `\n            <p class="plato__desc">${tri(p.d)}</p>` : ''}
            <span class="plato__preu">${precio(p.p)}</span>
          </li>`).join('\n')}
        </ul>
      </section>`).join('\n      ');

const AVISO = '<!-- Generado por scripts/build.mjs desde _plantillas/. No editar a mano: edita la plantilla y ejecuta npm run build. -->';
for (const f of (await readdir('_plantillas')).filter((x) => x.endsWith('.html'))) {
  let html = await readFile(`_plantillas/${f}`, 'utf8');
  html = html.replace('<x-carta-indice></x-carta-indice>', indice).replace('<x-carta-platos></x-carta-platos>', platos);
  const tags = [...html.matchAll(/<x-pic\b([^>]*)><\/x-pic>/g)];
  for (const t of tags) html = html.replace(t[0], await pic(t[1]));
  html = html.replace(/^<!doctype html>/i, (d) => `${d}\n${AVISO}`);
  await writeFile(f, html);
  console.log(`${f}: ${tags.length} imágenes`);
}
const total = secciones.reduce((n, s) => n + s.platos.length, 0);
console.log(`Carta: ${secciones.length} secciones, ${total} platos.`);
