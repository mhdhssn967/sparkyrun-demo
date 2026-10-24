import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

/**
 * Dimensions & Placement Configuration for SARKPNG.png on A3 Sheet
 *
 * Source Image Dimensions: 1530 x 1028 px (Aspect ratio: 1.4883)
 * Card Container on Right:
 *   Horizontal bounds: x = 1174 to 1468 (Width = 294 px, CenterX = 1321)
 *   White QR Box: y = 312 to 587 (Height = 275 px, CenterY = 450)
 *
 * QR Placement:
 *   Square size = 240 x 240 px
 *   Centered at x = 1201, y = 330
 *   Leaves generous quiet zone margin on all 4 sides and above the red 'SCAN TO PLAY' badge.
 */

export interface GenerateA3Options {
  mockTokenPrefix?: string;
  onProgress?: (msg: string) => void;
}

/**
 * Downloads the pre-built high-res A3 Test Sheet directly,
 * or dynamically builds it in-browser if not cached.
 */
export async function downloadA3TestSheet(): Promise<void> {
  try {
    // 1. Direct instant download from public folder
    const link = document.createElement('a');
    link.href = '/Popular_Sparky_A3_Test_Sheet.pdf';
    link.download = 'Popular_Sparky_A3_Test_Sheet.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Failed to trigger static download, falling back to dynamic generation:', err);
    await generateDynamicA3TestSheet();
  }
}

/**
 * Fully dynamic in-browser A3 PDF generator for SARKPNG.png
 */
export async function generateDynamicA3TestSheet(options: GenerateA3Options = {}): Promise<void> {
  const { mockTokenPrefix = 'PET-TEST', onProgress } = options;

  onProgress?.('Loading coupon template...');
  const baseImg = await loadImgElement('/SARKPNG.png');

  onProgress?.('Generating mock QR codes...');
  const qrDataUrl = await QRCode.toDataURL(
    `https://sparkyrun.gamefaktory.com/?token=${mockTokenPrefix}-A3`,
    {
      width: 240,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    },
  );
  const qrImg = await loadImgElement(qrDataUrl);

  // Composite single card on offscreen canvas
  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 1530;
  cardCanvas.height = 1028;
  const cardCtx = cardCanvas.getContext('2d');
  if (!cardCtx) throw new Error('Could not get 2D canvas context');

  cardCtx.drawImage(baseImg, 0, 0);

  // Stamp QR code centered in the white space above 'SCAN TO PLAY'
  // CenterX = 1321, CenterY = 450, QR size = 240x240
  const qrX = 1201;
  const qrY = 330;
  cardCtx.drawImage(qrImg, qrX, qrY, 240, 240);

  const compositeCardDataUrl = cardCanvas.toDataURL('image/jpeg', 0.95);

  onProgress?.('Building Portrait A3 Sheet PDF...');
  // A3 Portrait: 297mm x 420mm
  const PAGE_W = 297;
  const PAGE_H = 420;
  const COLS = 4;
  const ROWS = 9;

  const CARD_W = 69.0;
  const CARD_H = 44.5;
  const GAP_X = 1.2;
  const GAP_Y = 1.2;

  const totalGridW = COLS * CARD_W + (COLS - 1) * GAP_X;
  const totalGridH = ROWS * CARD_H + (ROWS - 1) * GAP_Y;

  const MARGIN_X = (PAGE_W - totalGridW) / 2;
  const MARGIN_Y = (PAGE_H - totalGridH) / 2;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3',
  });

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

  // Sheet Header
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(180, 20, 25);
  pdf.text('POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 PORTRAIT QR SHEET (36 COUPONS)', MARGIN_X, 3.5);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(120, 120, 120);
  pdf.text(
    `4 x 9 Grid • Card: ${CARD_W}mm x ${CARD_H}mm • Placement Test`,
    PAGE_W - MARGIN_X - 65,
    3.5,
  );

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x = MARGIN_X + col * (CARD_W + GAP_X);
      const y = MARGIN_Y + row * (CARD_H + GAP_Y);

      pdf.addImage(compositeCardDataUrl, 'JPEG', x, y, CARD_W, CARD_H);

      // Crop marks
      pdf.setDrawColor(210, 210, 210);
      pdf.setLineWidth(0.12);
      const mark = 1.5;
      pdf.line(x - mark, y, x, y);
      pdf.line(x, y - mark, x, y);
      pdf.line(x + CARD_W, y, x + CARD_W + mark, y);
      pdf.line(x + CARD_W, y - mark, x + CARD_W, y);
      pdf.line(x - mark, y + CARD_H, x, y + CARD_H);
      pdf.line(x, y + CARD_H, x, y + CARD_H + mark);
      pdf.line(x + CARD_W, y + CARD_H, x + CARD_W + mark, y + CARD_H);
      pdf.line(x + CARD_W, y + CARD_H, x + CARD_W, y + CARD_H + mark);
    }
  }

  onProgress?.('Saving PDF...');
  pdf.save('Popular_Sparky_A3_Test_Sheet.pdf');
}

function loadImgElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src} - ${e}`));
    img.src = src;
  });
}
