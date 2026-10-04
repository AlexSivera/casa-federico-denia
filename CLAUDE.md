# CLAUDE.md

Guía para trabajar en este repositorio.

## Proyecto

Propuesta de web de **Casa Federico · Restaurant Les Marines** (Dénia, desde 1980). Sitio estático HTML/CSS/JS vanilla, sin dependencias en runtime. Solo castellano; la **carta** es trilingüe (VAL/ES/EN).

Antes de tocar copy o diseño, lee `docs/business-brief.md` (hechos verificados y fuentes), `docs/design-direction.md` (concepto «Bajo el cañizo») y `docs/qa-report.md` (pendientes). `docs/` y `research/` no se versionan.

## Comandos

```bash
npm run dev      # servidor local (scripts/serve.mjs, sin caché, sirve 404.html y también bajo /casa-federico-denia/)
npm run build    # genera index.html, carta.html y reservas.html desde _plantillas/
npm run check    # comprobación estática: recursos, anclas (también entre páginas), alt, h1, JSON-LD, marcadores
npm run images   # regenera assets/img/ desde _src/img/ (necesita sharp)
node scripts/set-domain.mjs https://dominio.es [--preview]   # URLs SEO, sitemap, robots, <base> del 404; luego npm run build
```

## Reglas

- **No edites a mano** `index.html`, `carta.html` ni `reservas.html`: se generan. Edita `_plantillas/*.html` y ejecuta `npm run build`.
- `<x-pic name="…" alt="…" sizes="…" [eager]></x-pic>` en las plantillas se expande a `<picture>` AVIF/WebP/JPEG (o PNG con transparencia) con las anchuras que existan en `assets/img/`.
- La carta vive en `scripts/carta-data.mjs` (`v` valencià, `e` castellano, `n` english, `d` descripción, `p` precio o `'S/M'`). El inglés corrige errores de la carta impresa.
- Rutas siempre relativas (GitHub Pages sirve bajo subdirectorio). Excepción: `404.html`, con `<base>` que mantiene `set-domain.mjs`.
- Tokens de color y tipografía en `:root` de `assets/css/styles.css`. Clases en español/valenciano según el concepto (`canyis`, `receptari`, `olla`, `arros`, `espais`…).
- `assets/js/main.js`: estado abierto/cerrado (Europe/Madrid; martes y enero cerrado), menú `<dialog>`, paella que gira, selector seco/meloso/caldoso, filtros de arroces, apariciones, idioma de la carta y módulo de reservas ES/EN. Añade `.js` a `<html>`: sin JS todo es visible.
- No inventes datos: horarios, precios, premios y frases salen de fuentes verificadas (ver `docs/business-brief.md`).

## Despliegue

GitHub Pages desde `main` (raíz), repo `AlexSivera/casa-federico-denia`. Está en **modo vista previa** (`noindex` y `robots.txt` con `Disallow`) para no competir con la web oficial. Para el dominio definitivo: `node scripts/set-domain.mjs https://www.casafederico.es && npm run build` y añadir `CNAME`.
