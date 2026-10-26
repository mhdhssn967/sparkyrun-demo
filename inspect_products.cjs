const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const dir = path.join(__dirname, 'public', 'productimages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpeg') || f.endsWith('.jpg') || f.endsWith('.png'));

async function inspect() {
  for (const f of files) {
    const p = path.join(dir, f);
    const meta = await sharp(p).metadata();
    console.log(`${f} -> width: ${meta.width}, height: ${meta.height}, format: ${meta.format}, size: ${(fs.statSync(p).size/1024).toFixed(1)} KB`);
  }
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
