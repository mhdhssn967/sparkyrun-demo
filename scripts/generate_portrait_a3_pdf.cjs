const fs = require('fs');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

async function generatePortraitA3Sheet() {
  console.log('Generating Portrait A3 Sheet (4 cols x 9 rows = 36 coupons)...');

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

  // 2. Setup Portrait A3 PDF (297mm x 420mm)
  const PAGE_W = 297; // mm
  const PAGE_H = 420; // mm
  const COLS = 4;
  const ROWS = 9;

  // Let's test card dimensions
  // With 4 columns:
  // Option A (Edge-to-edge / minimal margin like tokengenerator.jsx):
  // CARD_W = 71.5 mm, CARD_H = 45 mm (or 71.25 x 45)
  // Let's check aspect ratio: 1530 / 1028 = 1.4883
  // If CARD_H = 45 mm, exact aspect width = 45 * 1.488327 = 67.0 mm
  // If CARD_W = 71.5 mm, exact aspect height = 71.5 / 1.488327 = 48.0 mm
  // If we give CARD_W = 70.0 mm and CARD_H = 45.0 mm:
  // In 4 cols: 4 * 70.0 = 280 mm. Margin X = (297 - 280) / 2 = 8.5 mm.
  // In 9 rows: 9 * 45.0 = 405 mm. Margin Y = (420 - 405) / 2 = 7.5 mm.
  // Let's check gap:
  // If we leave 1 mm gap between coupons:
  // CARD_W = 69.0 mm
  // CARD_H = 44.5 mm
  // Total width: 4 * 69 + 3 * 1 = 276 + 3 = 279 mm -> Margin X = (297 - 279) / 2 = 9 mm
  // Total height: 9 * 44.5 + 8 * 1 = 400.5 + 8 = 408.5 mm -> Margin Y = (420 - 408.5) / 2 = 5.75 mm
  // Card aspect ratio: 69 / 44.5 = 1.55 (virtually indistinguishable from 1.488)

  const CARD_W = 69.0;
  const CARD_H = 44.5;
  const GAP_X = 1.2;
  const GAP_Y = 1.2;

  const totalGridW = COLS * CARD_W + (COLS - 1) * GAP_X; // 4 * 69 + 3 * 1.2 = 276 + 3.6 = 279.6 mm
  const totalGridH = ROWS * CARD_H + (ROWS - 1) * GAP_Y; // 9 * 44.5 + 8 * 1.2 = 400.5 + 9.6 = 410.1 mm

  const MARGIN_X = (PAGE_W - totalGridW) / 2; // (297 - 279.6) / 2 = 8.7 mm
  const MARGIN_Y = (PAGE_H - totalGridH) / 2; // (420 - 410.1) / 2 = 4.95 mm

  console.log(`Grid config: CARD_W=${CARD_W}mm, CARD_H=${CARD_H}mm, Margins: (${MARGIN_X.toFixed(1)}mm, ${MARGIN_Y.toFixed(1)}mm)`);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3', // 297 x 420 mm
  });

  // Background clean white
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Sheet Header text at top edge
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(180, 20, 25);
  pdf.text('POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 PORTRAIT QR SHEET (36 COUPONS)', MARGIN_X, 3.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text(`4 x 9 Grid • Card: ${CARD_W}mm x ${CARD_H}mm • Placement Test`, PAGE_W - MARGIN_X - 65, 3.5);

  // Draw 36 cards
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_X + col * (CARD_W + GAP_X);
      const y = MARGIN_Y + row * (CARD_H + GAP_Y);

      // Add image
      pdf.addImage(compositeBase64, 'PNG', x, y, CARD_W, CARD_H);

      // Draw thin cutting crop marks at the 4 corners of each card
      pdf.setDrawColor(210, 210, 210);
      pdf.setLineWidth(0.12);
      const markLen = 1.5; // mm

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
      pdf.line(x + CARD_W, y + CARD_H, x + CARD_W, y + CARD_H + markLen);
    }
  }

  const pdfOutput = pdf.output('arraybuffer');
  fs.writeFileSync('public/Popular_Sparky_A3_Test_Sheet.pdf', Buffer.from(pdfOutput));
  console.log('Successfully generated public/Popular_Sparky_A3_Test_Sheet.pdf (Portrait A3, 36 coupons)');
}

generatePortraitA3Sheet().catch(console.error);
