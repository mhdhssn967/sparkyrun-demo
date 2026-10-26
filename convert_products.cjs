const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const srcDir = path.join(__dirname, 'public', 'productimages');
const outDir = path.join(__dirname, 'public', 'products');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Map original names to clean descriptive names
const fileMapping = [
  { original: 'WhatsApp Image 2026-10-25 at 10.45.43 AM.jpeg', name: 'cable_reel' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.44 AM (1).jpeg', name: 'wall_switches' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.44 AM (2).jpeg', name: 'flood_light_400w' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.44 AM.jpeg', name: 'distribution_boxes' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.45 AM (1).jpeg', name: 'conduit_fittings' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.45 AM (2).jpeg', name: 'industrial_plugs' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.45 AM (3).jpeg', name: 'power_strips' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.45 AM.jpeg', name: 'metal_exhaust_fans' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.46 AM (1).jpeg', name: 'float_switch' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.46 AM (2).jpeg', name: 'isolator_switch' },
  { original: 'WhatsApp Image 2026-10-25 at 10.45.46 AM.jpeg', name: 'ventilation_fan' },
  { original: 'WhatsApp Image 2026-10-25 at 11.04.33 AM.jpeg', name: 'flood_light_poster' },
];

async function processImages() {
  console.log('Starting conversion to WebP...');
  for (const item of fileMapping) {
    const inputPath = path.join(srcDir, item.original);
    const outputPath = path.join(outDir, `${item.name}.webp`);

    if (!fs.existsSync(inputPath)) {
      console.warn(`File not found: ${inputPath}`);
      continue;
    }

    const img = sharp(inputPath);
    const meta = await img.metadata();

    // Resize max dimension to 800px to keep web assets ultra-lightweight and sharp for webgl textures
    const maxDim = 800;
    let resizeOptions = {};
    if (meta.width > maxDim || meta.height > maxDim) {
      if (meta.width >= meta.height) {
        resizeOptions = { width: maxDim };
      } else {
        resizeOptions = { height: maxDim };
      }
    }

    await sharp(inputPath)
      .resize(resizeOptions)
      .webp({ quality: 82, effort: 5 })
      .toFile(outputPath);

    const outStat = fs.statSync(outputPath);
    console.log(`✓ ${item.name}.webp: ${(outStat.size / 1024).toFixed(1)} KB (orig: ${(fs.statSync(inputPath).size / 1024).toFixed(1)} KB)`);
  }
}

processImages().catch(err => {
  console.error('Error processing images:', err);
  process.exit(1);
});
