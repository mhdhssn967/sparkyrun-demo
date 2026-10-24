const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('public/SARKPNG.png');
const png = PNG.sync.read(data);
console.log('PNG parsed:', png.width, 'x', png.height);

// Let's inspect the right side
// Find white box above the red 'SCAN TO PLAY' button
let minX = png.width, maxX = 0, minY = png.height, maxY = 0;

for (let y = 200; y < 700; y++) {
  for (let x = 1100; x < 1500; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    const a = png.data[idx + 3];

    // Check pure white
    if (r >= 250 && g >= 250 && b >= 250 && a >= 250) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('White Box:');
console.log('minX:', minX, 'maxX:', maxX, 'width:', maxX - minX);
console.log('minY:', minY, 'maxY:', maxY, 'height:', maxY - minY);
console.log('Relative (x, y, w, h):', {
  x: minX / png.width,
  y: minY / png.height,
  w: (maxX - minX) / png.width,
  h: (maxY - minY) / png.height
});

// Also find the red button 'SCAN TO PLAY' top edge to know exactly where the white box stops before the red button
let redMinY = png.height;
for (let y = 500; y < 700; y++) {
  for (let x = minX; x < maxX; x++) {
    const idx = (png.width * y + x) << 2;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];
    if (r > 200 && g < 50 && b < 50) {
      if (y < redMinY) redMinY = y;
    }
  }
}
console.log('Red button top Y:', redMinY);
console.log('White QR area (above red button): height =', redMinY - minY);
console.log('Relative QR Area (above button):', {
  x: minX / png.width,
  y: minY / png.height,
  w: (maxX - minX) / png.width,
  h: (redMinY - minY) / png.height
});
