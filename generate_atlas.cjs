const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const products = [
  'cable_reel', 'conduit_fittings', 'distribution_boxes', 'float_switch',
  'flood_light_400w', 'flood_light_poster', 'industrial_plugs', 'isolator_switch',
  'metal_exhaust_fans', 'power_strips', 'ventilation_fan', 'wall_switches'
];

async function createAtlas() {
  const cellW = 512;
  const cellH = 512;
  const cols = 4;
  const rows = 3;
  const atlasW = cellW * cols; // 2048
  const atlasH = cellH * rows; // 1536

  const composites = [];

  for (let i = 0; i < products.length; i++) {
    const pName = products[i];
    const pPath = path.join(__dirname, 'public', 'products', pName + '.webp');
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * cellW;
    const top = row * cellH;

    // Load product image, resize to fit within 430x410, centered
    const pBuf = await sharp(pPath)
      .resize(430, 410, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .toBuffer();

    const cardSvg = Buffer.from(`
      <svg width="${cellW}" height="${cellH}" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="6" width="${cellW - 12}" height="${cellH - 12}" rx="22" fill="#ffffff" stroke="#ED1C24" stroke-width="8"/>
        <rect x="14" y="14" width="${cellW - 28}" height="44" rx="10" fill="#ED1C24"/>
        <text x="${cellW / 2}" y="44" font-family="Arial, sans-serif" font-weight="900" font-size="22" fill="#ffffff" text-anchor="middle" letter-spacing="2">POPULAR ELECTRICALS</text>
      </svg>
    `);

    const cellBuf = await sharp({
      create: {
        width: cellW,
        height: cellH,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .composite([
      { input: cardSvg, top: 0, left: 0 },
      { input: pBuf, top: 72, left: Math.floor((cellW - 430) / 2) }
    ])
    .png()
    .toBuffer();

    composites.push({
      input: cellBuf,
      left: left,
      top: top
    });
  }

  const outPath = path.join(__dirname, 'public', 'products_atlas.webp');
  await sharp({
    create: {
      width: atlasW,
      height: atlasH,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    }
  })
  .composite(composites)
  .webp({ quality: 85, effort: 5 })
  .toFile(outPath);

  const stat = fs.statSync(outPath);
  console.log(`Atlas created: ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

createAtlas().catch(err => {
  console.error(err);
  process.exit(1);
});
