const fs = require('fs');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

async function generateA3TestSheet() {
  console.log('Generating A3 Test Sheet with SARKPNG.png and mock QRs...');

  // 1. Prepare base composite with QR placed at (1201, 330)
  const baseData = fs.readFileSync('public/SARKPNG.png');
  const basePng = PNG.sync.read(baseData);

  // QR dimensions: 240x240, centered at (1201, 330)
  const qrPngBuffer = await QRCode.toBuffer('https://sparkyrun.gamefaktory.com/?token=PET-DEMO-TEST', {
    width: 240,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const qrPng = PNG.sync.read(qrPngBuffer);
  const startX = 1201;
  const startY = 330;

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

  const compositePngBuffer = PNG.sync.write(basePng);
  const compositeBase64 = `data:image/png;base64,${compositePngBuffer.toString('base64')}`;

  // 2. Setup A3 PDF (Landscape: 420mm x 297mm or Portrait: 297mm x 420mm)
  // Let's use A3 Portrait: 297mm x 420mm, 3 cols x 6 rows = 18 coupons
  // Or A3 Landscape: 420mm x 297mm, 4 cols x 4 rows = 16 coupons
  // Let's make an A3 Landscape sheet: 4 cols x 4 rows = 16 coupons
  const PAGE_W = 420; // mm
  const PAGE_H = 297; // mm
  const COLS = 4;
  const ROWS = 4;

  const MARGIN_X = 12; // mm
  const MARGIN_Y = 12; // mm
  const GAP_X = 4;     // mm
  const GAP_Y = 4;     // mm

  // Calculate card width & height
  const CARD_W = (PAGE_W - 2 * MARGIN_X - (COLS - 1) * GAP_X) / COLS; // (420 - 24 - 12)/4 = 384/4 = 96 mm
  const CARD_H = CARD_W / (1530 / 1028); // 96 / 1.4883 ≈ 64.5 mm

  // Total grid height = 4 * 64.5 + 3 * 4 = 258 + 12 = 270 mm (fits within 297mm with 13.5mm top/bottom margin)
  const actualMarginY = (PAGE_H - (ROWS * CARD_H + (ROWS - 1) * GAP_Y)) / 2;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3', // 420 x 297 mm
  });

  // Background clean white
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Draw Header info on sheet edge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(180, 20, 25);
  pdf.text('POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 QR TEST PRINT SHEET', MARGIN_X, 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text('16 Coupons per A3 Sheet (Card Size: 96mm x 64.5mm) • Placement Test Only', PAGE_W - MARGIN_X - 110, 7);

  // Draw cards on grid
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_X + col * (CARD_W + GAP_X);
      const y = actualMarginY + row * (CARD_H + GAP_Y);

      // Add image
      pdf.addImage(compositeBase64, 'PNG', x, y, CARD_W, CARD_H);

      // Draw thin cutting crop marks at the 4 corners of each card
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.15);
      const markLen = 2; // mm

      // Top-Left
      pdf.line(x - markLen, y, x, y);
      pdf.line(x, y - markLen, x, y);

      // Top-Right
      pdf.line(x + CARD_W, y, x + CARD_W + markLen, y);
      pdf.line(x + CARD_W, y - markLen, x + CARD_W, y);

      // Bottom-Left
      pdf.line(x - markLen, y + CARD_H, x, y + CARD_H);
      pdf.line(x, y + CARD_H, x, y + CARD_H + markLen);

      // Bottom-Right
      pdf.line(x + CARD_W, y + CARD_H, x + CARD_W + markLen, y + CARD_H);
      pdf.line(x + CARD_W, y + CARD_H, x + CARD_W + markLen, y + CARD_H + markLen);
    }
  }

  const pdfOutput = pdf.output('arraybuffer');
  fs.writeFileSync('public/Popular_Sparky_A3_Test_Sheet.pdf', Buffer.from(pdfOutput));
  console.log('Successfully generated public/Popular_Sparky_A3_Test_Sheet.pdf');
}

generateA3TestSheet().catch(console.error);
