const fs = require('fs');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

async function testPlacement() {
  const baseData = fs.readFileSync('public/SARKPNG.png');
  const basePng = PNG.sync.read(baseData);

  // Generate 240x240 QR
  const qrPngBuffer = await QRCode.toBuffer('https://sparkyrun.gamefaktory.com/?token=PET-DEMO-2026', {
    width: 240,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const qrPng = PNG.sync.read(qrPngBuffer);

  // Exactly centered in the white card box:
  // CenterX = 1321, CenterY = 450
  const startX = 1321 - Math.round(qrPng.width / 2); // 1201
  const startY = 450 - Math.round(qrPng.height / 2); // 330

  console.log(`Embedding QR at (${startX}, ${startY}) with size ${qrPng.width}x${qrPng.height}`);

  for (let y = 0; y < qrPng.height; y++) {
    for (let x = 0; x < qrPng.width; x++) {
      const srcIdx = (qrPng.width * y + x) << 2;
      const targetX = startX + x;
      const targetY = startY + y;

      if (targetX < basePng.width && targetY < basePng.height) {
        const destIdx = (basePng.width * targetY + targetX) << 2;
        basePng.data[destIdx] = qrPng.data[srcIdx];
        basePng.data[destIdx + 1] = qrPng.data[srcIdx + 1];
        basePng.data[destIdx + 2] = qrPng.data[srcIdx + 2];
        basePng.data[destIdx + 3] = 255;
      }
    }
  }

  const outBuf = PNG.sync.write(basePng);
  fs.writeFileSync('public/SARKPNG_TEST_COMPOSITE.png', outBuf);
  console.log('Saved test composite to public/SARKPNG_TEST_COMPOSITE.png');
}

testPlacement().catch(console.error);
