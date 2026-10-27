import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

/**
 * Dimensions & Placement Configuration for QR FRONT.png on A3 Sheet
 *
 * Source Image Dimensions: 1530 x 1028 px (Aspect ratio: 1.4883)
 * White QR Box bounds in QR FRONT.png:
 *   Horizontal bounds: x = 1038 to 1500 (Width = 463 px, CenterX = 1269)
 *   Vertical bounds:   y = 284 to 746   (Height = 463 px, CenterY = 515)
 *
 * QR Placement:
 *   Square size = 380 x 380 px
 *   Centered at x = 1079, y = 325 (leaves 41.5px uniform quiet zone on all sides)
 */

export interface GenerateA3Options {
  mockTokenPrefix?: string;
  onProgress?: (msg: string) => void;
}

export interface GenerateCustomA3Options {
  tokens: string[]; // List of unique token codes to render
  brandSlug?: string;
  onProgress?: (msg: string, current: number, total: number) => void;
}

/**
 * Downloads the pre-built high-res A3 Front Test Sheet directly,
 * or dynamically builds it in-browser if not cached.
 */
export async function downloadA3TestSheet(): Promise<void> {
  try {
    const link = document.createElement('a');
    link.href = `/Popular_Sparky_A3_Test_Sheet.pdf?v=${Date.now()}`;
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
 * Downloads the pre-built high-res A3 Back Sheet directly.
 */
export function downloadA3BackSheet(): void {
  const link = document.createElement('a');
  link.href = `/Popular_Sparky_A3_Back_Sheet.pdf?v=${Date.now()}`;
  link.download = 'Popular_Sparky_A3_Back_Sheet.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Fully dynamic in-browser multi-page A3 PDF generator for an array of unique tokens
 * Each page contains 36 coupons (4 cols x 9 rows)
 */
export async function generateA3PdfForTokens(options: GenerateCustomA3Options): Promise<void> {
  const { tokens, brandSlug = 'popular-electricals-qatar', onProgress } = options;

  if (!tokens || tokens.length === 0) {
    throw new Error('No tokens provided for PDF generation');
  }

  onProgress?.('Loading coupon template...', 0, tokens.length);
  const baseImg = await loadImgElement('/QR FRONT.png');

  // A3 Portrait layout
  const PAGE_W = 297;
  const PAGE_H = 420;
  const COLS = 4;
  const ROWS = 9;
  const COUPONS_PER_PAGE = COLS * ROWS; // 36

  const CARD_W = 69.0;
  const CARD_H = 44.5;
  const GAP_X = 1.2;
  const GAP_Y = 1.2;

  const totalGridW = COLS * CARD_W + (COLS - 1) * GAP_X;
  const totalGridH = ROWS * CARD_H + (ROWS - 1) * GAP_Y;

  const MARGIN_X = (PAGE_W - totalGridW) / 2;
  const MARGIN_Y = (PAGE_H - totalGridH) / 2;

  const totalPages = Math.ceil(tokens.length / COUPONS_PER_PAGE);

  // Setup offscreen canvas for stamping
  const cardCanvas = document.createElement('canvas');
  cardCanvas.width = 1530;
  cardCanvas.height = 1028;
  const cardCtx = cardCanvas.getContext('2d');
  if (!cardCtx) throw new Error('Could not get 2D canvas context');

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a3',
  });

  const QR_SIZE = 380;
  const QR_X = 1079;
  const QR_Y = 325;

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage('a3', 'portrait');
    }

    // Page background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');

    // Header info
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 20, 25);
    pdf.text(
      `POPULAR ELECTRICALS & TRADING CO. — SPARKY RUN A3 QR SHEET • PAGE ${pageIdx + 1} OF ${totalPages}`,
      MARGIN_X,
      3.5
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(120, 120, 120);
    pdf.text(
      `36 Unique Tokens • Brand: ${brandSlug}`,
      PAGE_W - MARGIN_X - 60,
      3.5
    );

    const startIdx = pageIdx * COUPONS_PER_PAGE;
    const pageTokens = tokens.slice(startIdx, startIdx + COUPONS_PER_PAGE);

    for (let slotIdx = 0; slotIdx < pageTokens.length; slotIdx++) {
      const token = pageTokens[slotIdx];
      const globalIdx = startIdx + slotIdx + 1;
      onProgress?.(
        `Rendering QR code ${globalIdx} of ${tokens.length}...`,
        globalIdx,
        tokens.length
      );

      // Generate QR for this specific unique token
      const qrTargetUrl = `https://sparkyrun.gamefaktory.com/?token=${encodeURIComponent(
        token
      )}&brand=${encodeURIComponent(brandSlug)}`;

      const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        width: QR_SIZE,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });

      const qrImg = await loadImgElement(qrDataUrl);

      // Clear & redraw card
      cardCtx.clearRect(0, 0, 1530, 1028);
      cardCtx.drawImage(baseImg, 0, 0);
      cardCtx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);

      const compositeCardDataUrl = cardCanvas.toDataURL('image/jpeg', 0.95);

      const col = slotIdx % COLS;
      const row = Math.floor(slotIdx / COLS);
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

  onProgress?.('Finalizing and downloading PDF...', tokens.length, tokens.length);
  const filename = `Popular_Sparky_Tokens_${tokens.length}_Coupons.pdf`;
  pdf.save(filename);
}

/**
 * Fully dynamic in-browser A3 PDF generator for test/preview QR FRONT.png
 */
export async function generateDynamicA3TestSheet(options: GenerateA3Options = {}): Promise<void> {
  const { mockTokenPrefix = 'PET-TEST', onProgress } = options;

  // Generate 36 sample tokens
  const sampleTokens: string[] = [];
  for (let i = 1; i <= 36; i++) {
    const pad = i.toString().padStart(3, '0');
    sampleTokens.push(`${mockTokenPrefix}-${pad}`);
  }

  return generateA3PdfForTokens({
    tokens: sampleTokens,
    brandSlug: 'popular-electricals-qatar',
    onProgress: (msg) => onProgress?.(msg),
  });
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
