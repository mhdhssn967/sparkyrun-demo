const fs = require('fs');
const { PNG } = require('pngjs');

const data = fs.readFileSync('public/SARKPNG.png');
const png = PNG.sync.read(data);

// Sample horizontal slice at y = 400 (which is right in the middle of the white card on the right)
// Let's find where the white card begins on the right
console.log('Scanning horizontal line at y = 400:');
let cardLeft = -1, cardRight = -1;
for (let x = 1100; x < png.width; x++) {
  const idx = (png.width * 400 + x) << 2;
  const r = png.data[idx];
  const g = png.data[idx + 1];
  const b = png.data[idx + 2];
  const isWhite = r > 245 && g > 245 && b > 245;

  if (isWhite && cardLeft === -1) {
    cardLeft = x;
  }
  if (!isWhite && cardLeft !== -1 && cardRight === -1 && x > cardLeft + 50) {
    cardRight = x - 1;
  }
}

// Sample vertical slice at x = (cardLeft + cardRight) / 2
const centerX = Math.round((cardLeft + cardRight) / 2);
console.log(`Card horizontal bounds at y=400: Left=${cardLeft}, Right=${cardRight}, Width=${cardRight - cardLeft}, CenterX=${centerX}`);

let cardTop = -1, cardBottomWhite = -1;
for (let y = 200; y < 800; y++) {
  const idx = (png.width * y + centerX) << 2;
  const r = png.data[idx];
  const g = png.data[idx + 1];
  const b = png.data[idx + 2];
  const isWhite = r > 245 && g > 245 && b > 245;

  if (isWhite && cardTop === -1) {
    cardTop = y;
  }
  if (!isWhite && cardTop !== -1 && cardBottomWhite === -1 && y > cardTop + 50) {
    cardBottomWhite = y - 1;
  }
}

console.log(`Card vertical white space bounds at centerX=${centerX}: Top=${cardTop}, BottomWhite=${cardBottomWhite}, Height=${cardBottomWhite - cardTop}`);
