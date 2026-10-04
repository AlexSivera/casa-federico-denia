// Genera las imágenes optimizadas de /assets/img a partir de /_src/img (fotos de la web oficial de Casa Federico).
// Uso: npm run images   (requiere la devDependency "sharp")
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = '_src/img';
const OUT = 'assets/img';
await mkdir(OUT, { recursive: true });

// crop: [left, top, width, height] en proporción (0–1) sobre la foto ya girada.
const photos = [
  { src: 'AAA7460-1', out: 'terraza-canyis', widths: [800, 1280, 1920] },
  { src: 'AAA7480-1', out: 'terraza-mesas', widths: [640, 1024, 1600] },
  { src: 'AAA7467', out: 'terraza-jardin', widths: [640, 1024, 1600] },
  { src: 'AAA7495-1', out: 'interior-arcos', widths: [640, 1024, 1600] },
  { src: 'AAA7485-1', out: 'interior-chimenea', widths: [640, 1024] },
  { src: 'AAA7501-2', out: 'acceso-palmeras', widths: [640, 1024, 1600] },
  { src: 'DSC0614', out: 'cristalera', widths: [640, 1024] },
  { src: 'AAA7490-1', out: 'bodega-estantes', widths: [640, 1024, 1600] },
  { src: 'AAA7491-1', out: 'bodega-barrica', widths: [640, 1024] },
  { src: 'DSC0646-1', out: 'bodega-botella', widths: [480, 800] },
  { src: 'AAA6582-1', out: 'paella-valenciana', widths: [640, 1024, 1600] },
  { src: 'DSC0651-1', out: 'paella-bogavante', widths: [640, 1024, 1280] },
  { src: 'DSC0650-1', out: 'paella-pan-allioli', widths: [640, 1024, 1600] },
  { src: '20160911_150603', out: 'arroz-mesa', widths: [640, 1024, 1600] },
  { src: '20161005_200344-1', out: 'gamba-roja', crop: [0, 0.12, 1, 0.76], widths: [640, 1024, 1600] },
  { src: '20161022_225731_HDR', out: 'gambas-hielo', widths: [640, 1024, 1500] },
  { src: 'AAA6549-1', out: 'cigalas', widths: [640, 1024, 1600] },
  { src: 'AAA6633-1', out: 'pescado-plancha', widths: [640, 1024, 1600] },
  { src: '20160911_151751-1', out: 'parrillada', widths: [640, 1024, 1500] },
  { src: '20160911_150028', out: 'suquet', widths: [640, 1024, 1500] },
  { src: '20160911_151056', out: 'salazones', widths: [640, 1024, 1280] },
  { src: '20160911_145739', out: 'gambeta-allets', widths: [640, 1024, 1500] },
  { src: '20160911_153105', out: 'ensalada-marines', widths: [640, 1024, 1500] },
  { src: '20160911_155633', out: 'ventresca', widths: [640, 1024, 1600] },
  { src: 'AAA6673-1', out: 'pepa-jaime', widths: [640, 1024, 1600] },
  { src: 'Rosa-Devesa', out: 'rosa-devesa', widths: [480, 960] },
  { src: '20160908_185752', out: 'playa-marines', widths: [640, 1024, 1600] },
];

const encode = async (img, out, w) => {
  await img.clone().avif({ quality: 46, effort: 5 }).toFile(`${OUT}/${out}-${w}.avif`);
  await img.clone().webp({ quality: 72 }).toFile(`${OUT}/${out}-${w}.webp`);
  await img.clone().jpeg({ quality: 74, mozjpeg: true, progressive: true }).toFile(`${OUT}/${out}-${w}.jpg`);
};

for (const p of photos) {
  let base = sharp(`${SRC}/${p.src}.jpg`).rotate();
  if (p.crop) {
    const buf = await base.toBuffer();
    const m = await sharp(buf).metadata();
    const [l, t, w, h] = p.crop;
    base = sharp(buf).extract({
      left: Math.round(m.width * l), top: Math.round(m.height * t),
      width: Math.round(m.width * w), height: Math.round(m.height * h),
    });
  }
  const master = await base.toBuffer();
  const meta = await sharp(master).metadata();
  for (const w of p.widths) {
    await encode(sharp(master).resize({ width: Math.min(w, meta.width), withoutEnlargement: true }), p.out, w);
  }
  console.log(`${p.out}: ${meta.width}x${meta.height} → ${Math.round(meta.height / meta.width * 1000) / 1000}`);
}

// Paella cenital (DSC0621) recortada en círculo por el borde de la paella, con transparencia.
{
  const cx = 1376, cy = 897, r = 792;
  const square = await sharp(`${SRC}/DSC0621.jpg`).extract({ left: cx - r, top: cy - r, width: r * 2, height: r * 2 }).toBuffer();
  const mask = Buffer.from(`<svg width="${r * 2}" height="${r * 2}"><circle cx="${r}" cy="${r}" r="${r - 2}" fill="#fff"/></svg>`);
  const round = await sharp(square).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  for (const w of [420, 720, 1100]) {
    const img = sharp(round).resize({ width: w });
    await img.clone().avif({ quality: 50, effort: 5 }).toFile(`${OUT}/paella-cenital-${w}.avif`);
    await img.clone().webp({ quality: 76, alphaQuality: 90 }).toFile(`${OUT}/paella-cenital-${w}.webp`);
    await img.clone().png({ compressionLevel: 9, palette: true, colours: 220 }).toFile(`${OUT}/paella-cenital-${w}.png`);
  }
  console.log('paella-cenital: ok');
}

// Tinta con transparencia: el negro del original pasa a ser opacidad, el color es el de la marca.
async function ink(src, extract, name, inks, widths, curve = [1.4, -60]) {
  for (const [suffix, color] of inks) {
    for (const w of widths) {
      let img = sharp(`${SRC}/${src}`);
      if (extract) img = img.extract(extract);
      const gray = await img.resize({ width: w }).grayscale().linear(curve[0], curve[1]).negate()
        .toColourspace('b-w').raw().toBuffer({ resolveWithObject: true });
      const { width, height } = gray.info;
      const rgba = Buffer.alloc(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        rgba[i * 4] = color.r; rgba[i * 4 + 1] = color.g; rgba[i * 4 + 2] = color.b; rgba[i * 4 + 3] = gray.data[i];
      }
      await sharp(rgba, { raw: { width, height, channels: 4 } })
        .png({ compressionLevel: 9, palette: true, colours: 48 }).toFile(`${OUT}/${name}${suffix}-${w}.png`);
    }
  }
  console.log(`${name}: ok`);
}

const GRABADO = { r: 0x8c, g: 0x2b, b: 0x1b };
const PAPEL = { r: 0xf4, g: 0xee, b: 0xe2 };
const TINTA = { r: 0x25, g: 0x1d, b: 0x17 };

// Grabado de la carta (pareja cocinando): ya es rojo, se convierte en tinta pura.
await ink('celiacos-1.jpg', { left: 248, top: 690, width: 510, height: 745 }, 'grabado',
  [['', GRABADO], ['-papel', PAPEL]], [360, 720], [1.9, -150]);

// Logotipo (palmeras, casa y rótulo) en tinta y en papel.
await ink('CASAFEDERICOpeq.jpg', null, 'logo', [['', TINTA], ['-papel', PAPEL]], [620], [1.6, -90]);

// Imagen para compartir (Open Graph) 1200x630: paella valenciana sobre el mantel.
await sharp(`${SRC}/AAA6582-1.jpg`).resize(1200, 630, { fit: 'cover', position: 'centre' })
  .jpeg({ quality: 80, mozjpeg: true }).toFile(`${OUT}/og-casa-federico.jpg`);
console.log('og: ok');
