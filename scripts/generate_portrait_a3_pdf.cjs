const fs = require('fs');
const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');
const { PNG } = require('pngjs');

async function generateSheets() {
  console.log('Generating A3 Portrait Sheets (4 cols x 9 rows = 36 coupons)...');

  // Shared A3 dimensions
  const PAGE_W = 297; // mm
  const PAGE_H = 420; // mm
  const COLS = 4;
  const ROWS = 9;

  const CARD_W = 69.0;
  const CARD_H = 44.5;
  const GAP_X = 1.2;
  const GAP_Y = 1.2;

  const totalGridW = COLS * CARD_W + (COLS - 1) * GAP_X; // 279.6 mm
  const totalGridH = ROWS * CARD_H + (ROWS - 1) * GAP_Y; // 410.1 mm

  const MARGIN_X = (PAGE_W - totalGridW) / 2; // 8.7 mm
  const MARGIN_Y = (PAGE_H - totalGridH) / 2; // 4.95 mm

  // =========================================================================
  // 1. FRONT SHEET (QR FRONT.png with embedded QR code)
  // =========================================================================
  console.log('1. Preparing Front Coupons with QR FRONT.png...');
  const frontData = fs.readFileSync('public/QR FRONT.png');
  const frontPng = PNG.sync.read(frontData);

  // Exact white box in QR FRONT.png:
  // x: [1038, 1500] (width = 463 px, center = 1269)
  // y: [284, 746]   (height = 463 px, center = 515)
  // QR code size: 380x380 px, centered at (1079, 325)
  const QR_SIZE = 380;
  const QR_X = 1079;
  const QR_Y = 325;

  const qrPngBuffer = await QRCode.toBuffer('https://sparkyrun.gamefaktory.com/?token=PET-DEMO-TEST', {
    width: QR_SIZE,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const qrPng = PNG.sync.read(qrPngBuffer);

  for (let y = 0; y < qrPng.height; y++) {
    for (let x = 0; x < qrPng.width; x++) {
      const srcIdx = (qrPng.width * y + x) << 2;
      const targetX = QR_X + x;
      const targetY = QR_Y + y;

      if (targetX < frontPng.width && targetY < frontPng.height) {
        const destIdx = (frontPng.width * targetY + targetX) << 2;
        frontPng.data[destIdx] = qrPng.data[srcIdx];
        frontPng.data[destIdx + 1] = qrPng.data[srcIdx + 1];
        frontPng.data[destIdx + 2] = qrPng.data[srcIdx + 2];
        frontPng.data[destIdx + 3] = 255;
      }
    }
  }

  const frontCompositeBuffer = PNG.sync.write(frontPng);
  const frontCompositeBase64 = `data:image/png;base64,${frontCompositeBuffer.toString('base64')}`;

  const frontPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3',
  });

  frontPdf.setFillColor(255, 255, 255);
  frontPdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  frontPdf.setFont('helvetica', 'bold');
  frontPdf.setFontSize(8);
  frontPdf.setTextColor(180, 20, 25);
  frontPdf.text('POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 PORTRAIT QR FRONT SHEET (36 COUPONS)', MARGIN_X, 3.5);

  frontPdf.setFont('helvetica', 'normal');
  frontPdf.setFontSize(7);
  frontPdf.setTextColor(120, 120, 120);
  frontPdf.text(`4 x 9 Grid • Card: ${CARD_W}mm x ${CARD_H}mm • Front with QR Codes`, PAGE_W - MARGIN_X - 65, 3.5);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_X + col * (CARD_W + GAP_X);
      const y = MARGIN_Y + row * (CARD_H + GAP_Y);

      frontPdf.addImage(frontCompositeBase64, 'PNG', x, y, CARD_W, CARD_H);

      // Crop marks
      frontPdf.setDrawColor(210, 210, 210);
      frontPdf.setLineWidth(0.12);
      const markLen = 1.5;

      frontPdf.line(x - markLen, y, x, y);
      frontPdf.line(x, y - markLen, x, y);
      frontPdf.line(x + CARD_W, y, x + CARD_W + markLen, y);
      frontPdf.line(x + CARD_W, y - markLen, x + CARD_W, y);
      frontPdf.line(x - markLen, y + CARD_H, x, y + CARD_H);
      frontPdf.line(x, y + CARD_H, x, y + CARD_H + markLen);
      frontPdf.line(x + CARD_W, y + CARD_H, x + CARD_W + markLen, y + CARD_H);
      frontPdf.line(x + CARD_W, y + CARD_H, x + CARD_W, y + CARD_H + markLen);
    }
  }

  const frontPdfOutput = frontPdf.output('arraybuffer');
  fs.writeFileSync('public/Popular_Sparky_A3_Test_Sheet.pdf', Buffer.from(frontPdfOutput));
  console.log('✓ Successfully generated public/Popular_Sparky_A3_Test_Sheet.pdf');

  // =========================================================================
  // 2. BACK SHEET (QR TOken back.png - identical dimensions, aligned for double-sided print)
  // =========================================================================
  console.log('2. Preparing Back Coupons with QR TOken back.png...');
  const backData = fs.readFileSync('public/QR TOken back.png');
  const backBase64 = `data:image/png;base64,${backData.toString('base64')}`;

  const backPdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3',
  });

  backPdf.setFillColor(255, 255, 255);
  backPdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  backPdf.setFont('helvetica', 'bold');
  backPdf.setFontSize(8);
  backPdf.setTextColor(180, 20, 25);
  backPdf.text('POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 PORTRAIT QR BACK SHEET (36 COUPONS)', MARGIN_X, 3.5);

  backPdf.setFont('helvetica', 'normal');
  backPdf.setFontSize(7);
  backPdf.setTextColor(120, 120, 120);
  backPdf.text(`4 x 9 Grid • Card: ${CARD_W}mm x ${CARD_H}mm • Back Side Print`, PAGE_W - MARGIN_X - 65, 3.5);

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_X + col * (CARD_W + GAP_X);
      const y = MARGIN_Y + row * (CARD_H + GAP_Y);

      backPdf.addImage(backBase64, 'PNG', x, y, CARD_W, CARD_H);

      // Crop marks
      backPdf.setDrawColor(210, 210, 210);
      backPdf.setLineWidth(0.12);
      const markLen = 1.5;

      backPdf.line(x - markLen, y, x, y);
      backPdf.line(x, y - markLen, x, y);
      backPdf.line(x + CARD_W, y, x + CARD_W + markLen, y);
      backPdf.line(x + CARD_W, y - markLen, x + CARD_W, y);
      backPdf.line(x - markLen, y + CARD_H, x, y + CARD_H);
      backPdf.line(x, y + CARD_H, x, y + CARD_H + markLen);
      backPdf.line(x + CARD_W, y + CARD_H, x + CARD_W + markLen, y + CARD_H);
      backPdf.line(x + CARD_W, y + CARD_H, x + CARD_W, y + CARD_H + markLen);
    }
  }

  const backPdfOutput = backPdf.output('arraybuffer');
  fs.writeFileSync('public/Popular_Sparky_A3_Back_Sheet.pdf', Buffer.from(backPdfOutput));
  console.log('✓ Successfully generated public/Popular_Sparky_A3_Back_Sheet.pdf');
}

generateSheets().catch(console.error);
