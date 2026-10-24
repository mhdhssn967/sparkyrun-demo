import React, { useState } from 'react';
import { Ticket, Download, Loader2, X } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { db } from '../../../firebaseConfig';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';

const G = '#1B6B2F';

// ─── Page & Grid dimensions (all in mm) ──────────────────────────────────────
// Source measurements:
//   Page:              46.99cm × 31.75cm
//   Coupon:            7.28cm  × 4.46cm
//   Left/Right margin: 1.70cm
//   Top/Bottom margin: 0.28cm
//   Grid:              6 cols × 7 rows = 42 coupons per page

const PAGE_W = 285.0;   // mm  (46.99 cm)
const PAGE_H = 420.0;   // mm  (31.75 cm)

const COLS = 4;
const ROWS = 9;
const COUPONS_PER_PAGE = COLS * ROWS; // 42

const COUPON_W = 71.5;  // mm  (7.28 cm)
const COUPON_H = 45;  // mm  (4.46 cm)

const MARGIN_X = 0;  // mm  (1.70 cm) — left & right
const MARGIN_Y =  7.5;  // mm  (0.28 cm) — top & bottom

const GAP = 0;          // mm  — coupons tile edge-to-edge

// Image aspect ratio derived from exact coupon size: 72.8 / 44.6 ≈ 1.6323
const IMG_ASPECT = COUPON_W / COUPON_H;

// ─── QR Placement ────────────────────────────────────────────────────────────
// Derived from pixel analysis of the 1437 × 878 source coupon image:
//   White "Scan to Play" panel spans x ≈ 55% → 96% of coupon width
//   QR placeholder box:  x ≈ 790px, y ≈ 130–748px (centre of panel)
//
//   x ratio = 790/1437  = 0.5498  (left edge of QR box)
//   w ratio = 580/1437  = 0.4036  → ~29.4mm wide
//   h forced equal to w in mm so QR is perfectly square (~29.4 × 29.4mm)
//   y ratio = centred vertically inside the white panel

const QR_W_MM = 0.2900 * COUPON_W;           // 29.38 mm
const QR_H_MM = QR_W_MM;                      // forced square

const QR_AREA = {
  x: 0.5898,                                  // 40.0 mm from coupon left
  y: (0.466 - (QR_H_MM / COUPON_H) / 2),       // centred vertically ≈ 0.1706
  w: QR_W_MM / COUPON_W,                      // 0.4036
  h: QR_H_MM / COUPON_H,                      // 0.6588 — square in real mm
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loadImage(src) {
  if (src.startsWith('data:')) return loadImageElement(src);
  const res = await fetch(src);
  if (!res.ok) throw new Error(`Failed to fetch image: ${src} (${res.status})`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const img = await loadImageElement(objectUrl);
  img._objectUrl = objectUrl;
  return img;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Image load failed: ${src.substring(0, 80)}`));
    img.src = src;
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

const TokenGenerator = ({ isOpen, onClose }) => {
  const [pageCount,    setPageCount]    = useState(1);
  const [tokenSetName, setTokenSetName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress,     setProgress]     = useState({ current: 0, total: 0, label: '' });

  const handleGenerate = async () => {
    setIsGenerating(true);
    const totalTokens = pageCount * COUPONS_PER_PAGE;
    setProgress({ current: 0, total: totalTokens, label: 'Loading coupon template…' });

    try {
      const couponImg = await loadImage('/qr/qrwhite.webp');

      // jsPDF with exact custom page size in mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [PAGE_W, PAGE_H],
      });

      // High-DPI canvas (200 DPI)
      const PX_PER_MM = 200 / 25.4;
      const canvasW   = Math.round(PAGE_W   * PX_PER_MM);
      const canvasH   = Math.round(PAGE_H   * PX_PER_MM);
      const couponPxW = Math.round(COUPON_W * PX_PER_MM);
      const couponPxH = Math.round(COUPON_H * PX_PER_MM);

      const canvas = document.createElement('canvas');
      canvas.width  = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');

      let tokenIndex = 0;

      for (let page = 0; page < pageCount; page++) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasW, canvasH);

        const tokenIds = [];

        for (let row = 0; row < ROWS; row++) {
          for (let col = 0; col < COLS; col++) {
            const tokenId = `GLB-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
            tokenIds.push(tokenId);

            const x = Math.round((MARGIN_X + col * (COUPON_W + GAP)) * PX_PER_MM);
            const y = Math.round((MARGIN_Y + row * (COUPON_H + GAP)) * PX_PER_MM);

            // QR code
            const qrUrl = `https://zuzyrun.gamefaktory.com/?token=${tokenId}`;
            const qrDataUrl = await QRCode.toDataURL(qrUrl, {
              width: 300,
              margin: 1,
              color: { dark: '#000000ff', light: '#FFFFFF' },
            });
            const qrImg = await loadImage(qrDataUrl);

            // Draw coupon base
            ctx.drawImage(couponImg, x, y, couponPxW, couponPxH);

            // Overlay QR into white placeholder
            const qx = x + Math.round(QR_AREA.x * couponPxW);
            const qy = y + Math.round(QR_AREA.y * couponPxH);
            const qw =     Math.round(QR_AREA.w * couponPxW);
            const qh =     Math.round(QR_AREA.h * couponPxH);
            ctx.drawImage(qrImg, qx, qy, qw, qh);

            // Corner cut marks
            const markHalf = Math.round(1 * PX_PER_MM);
            ctx.save();
            ctx.strokeStyle = '#ffffffff';
            ctx.lineWidth   = Math.ceil(0.25 * PX_PER_MM);
            ctx.lineCap     = 'round';

            [
              { cx: x,             cy: y             },
              { cx: x + couponPxW, cy: y             },
              { cx: x,             cy: y + couponPxH },
              { cx: x + couponPxW, cy: y + couponPxH },
            ].forEach(({ cx, cy }) => {
              ctx.beginPath();
              ctx.moveTo(cx - markHalf, cy); ctx.lineTo(cx + markHalf, cy);
              ctx.moveTo(cx, cy - markHalf); ctx.lineTo(cx, cy + markHalf);
              ctx.stroke();
            });

            ctx.restore();

            tokenIndex++;
            setProgress({
              current: tokenIndex,
              total:   totalTokens,
              label:   `Page ${page + 1}/${pageCount} · coupon ${col + 1 + row * COLS}/${COUPONS_PER_PAGE}`,
            });
          }
        }

        // Save tokens to Firestore
        await Promise.all(
          tokenIds.map((id) =>
            setDoc(doc(db, 'tokens', id), {
              type:      'global',
              livesLeft: 3,
              status:    'active',
              createdAt: new Date().toISOString(),
            })
          )
        );

        setProgress({ current: tokenIndex, total: totalTokens, label: `Encoding page ${page + 1}…` });
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        if (page > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, PAGE_W, PAGE_H);
      }

      setProgress({ current: totalTokens, total: totalTokens, label: 'Saving PDF…' });
      const finalSetName = tokenSetName || `Mouzy_Tokens_${pageCount}pg_${Date.now()}`;
      pdf.save(`${finalSetName}.pdf`);

      try {
        await addDoc(collection(db, 'tokenHistory'), {
          setName: finalSetName,
          pages: pageCount,
          coupons: totalTokens,
          createdAt: new Date().toISOString()
        });
      } catch (historyErr) {
        console.error('Failed to save token history:', historyErr);
      }

      if (couponImg._objectUrl) URL.revokeObjectURL(couponImg._objectUrl);
      onClose();
    } catch (err) {
      console.error('Token generation error:', err?.message || err);
      alert(`Failed to generate tokens:\n\n${err?.message || 'Unknown error'}\n\nCheck the browser console for details.`);
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0, label: '' });
    }
  };

  if (!isOpen) return null;

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '20px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px',
        width: '100%', maxWidth: '420px', padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '12px', background: `${G}10`, color: G }}>
              <Ticket size={24} />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', margin: 0 }}>
              Generate Token PDF
            </h3>
          </div>
          <button onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Token Set Name */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '12px', fontWeight: '800',
            color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: '12px',
          }}>
            Token Set Name (Optional)
          </label>
          <input
            type="text"
            value={tokenSetName}
            onChange={(e) => setTokenSetName(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600',
              outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="e.g. Weekend Event Tokens"
          />
        </div>

        {/* Page-count picker */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block', fontSize: '12px', fontWeight: '800',
            color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em',
            marginBottom: '12px',
          }}>
            Number of Pages to Print
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '14px' }}>
            {[1, 5, 10, 25].map((n) => (
              <button key={n} onClick={() => setPageCount(n)} style={{
                padding: '12px', borderRadius: '12px',
                border: `2px solid ${pageCount === n ? G : '#f3f4f6'}`,
                background: pageCount === n ? `${G}10` : 'white',
                color: pageCount === n ? G : '#6b7280',
                fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {n}
              </button>
            ))}
          </div>
          <input
            type="number" min={1}
            value={pageCount}
            onChange={(e) => setPageCount(Math.max(1, parseInt(e.target.value) || 1))}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: '12px',
              border: '1px solid #e5e7eb', fontSize: '14px', fontWeight: '600',
              outline: 'none', boxSizing: 'border-box',
            }}
            placeholder="Custom page count…"
          />
        </div>

        {/* Info summary */}
        <div style={{
          background: `${G}08`, border: `1px solid ${G}25`,
          borderRadius: '12px', padding: '14px 16px', marginBottom: '24px',
        }}>
          {[
            ['Page size',           `${PAGE_W / 10}cm × ${PAGE_H / 10}cm`],
            ['Coupon size',         `${COUPON_W / 10}cm × ${COUPON_H / 10}cm`],
            ['Margins (L&R / T&B)', `${MARGIN_X / 10}cm / ${MARGIN_Y / 10}cm`],
            ['Coupons per page',    `${COUPONS_PER_PAGE} (${COLS} × ${ROWS})`],
            ['Total tokens',        (pageCount * COUPONS_PER_PAGE).toLocaleString()],
            ['Lives per token',     '3'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', flexShrink: 1, marginRight: '8px' }}>
                {progress.label}
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: G, whiteSpace: 'nowrap' }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: '8px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: G, borderRadius: '99px', transition: 'width 0.25s ease',
              }} />
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || pageCount < 1}
          style={{
            width: '100%', padding: '16px', borderRadius: '14px',
            background: G, color: 'white', border: 'none',
            fontSize: '16px', fontWeight: '800',
            cursor: isGenerating ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            boxShadow: '0 4px 12px rgba(27,107,47,0.2)',
            opacity: isGenerating || pageCount < 1 ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {isGenerating ? (
            <>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              GENERATING… ({pct}%)
            </>
          ) : (
            <>
              <Download size={20} />
              GENERATE {pageCount} PAGE{pageCount !== 1 ? 'S' : ''} PDF
            </>
          )}
        </button>

        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TokenGenerator;