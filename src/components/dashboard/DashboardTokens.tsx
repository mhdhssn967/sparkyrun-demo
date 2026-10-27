import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { popularApi } from '../../services/popularApi';
import { generateA3PdfForTokens, downloadA3BackSheet } from '../../utils/a3SheetGenerator';
import type { BrandTokenRecord } from '../../types/customer';
import {
  IconQrCode,
  IconDownload,
  IconPrinter,
  IconRefresh,
  IconSearch,
} from './DashboardIcons';

export function DashboardTokens() {
  // Page Generator state
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);

  // Token Audit table state
  const [tokensList, setTokensList] = useState<BrandTokenRecord[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'USED'>('ALL');

  const couponsCount = pagesCount * 36;

  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const data = await popularApi.getBrandTokens('popular-electricals-qatar');
      setTokensList(data || []);
    } catch (err) {
      console.error('Failed to load tokens:', err);
      setTokensList([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleGenerateAndDownload = async () => {
    if (pagesCount < 1) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Page Count',
        text: 'Please select at least 1 A3 page (36 coupons).',
        confirmButtonColor: '#ED1C24',
      });
      return;
    }

    if (pagesCount > 20) {
      Swal.fire({
        icon: 'warning',
        title: 'Page Limit Exceeded',
        text: 'To avoid browser memory slowdowns, please generate up to 20 A3 pages (720 coupons) per batch.',
        confirmButtonColor: '#ED1C24',
      });
      return;
    }

    const confirmRes = await Swal.fire({
      title: 'Generate Printable Tokens?',
      html: `
        <div style="text-align: left; font-size: 14px; color: #334155; line-height: 1.6;">
          <p>You are about to generate <b>${couponsCount} unique tokens</b> across <b>${pagesCount} A3 ${pagesCount === 1 ? 'page' : 'pages'}</b>.</p>
          <div style="background: #F1F5F9; border-radius: 8px; padding: 12px; margin: 10px 0;">
            <div style="font-size: 12px; color: #64748B;">Target Game URL Format:</div>
            <div style="font-family: monospace; font-size: 12px; color: #0F172A; word-break: break-all; margin-top: 4px;">
              https://sparkyrun.gamefaktory.com/?token=PET-XXXX-YYYY&brand=popular-electricals-qatar
            </div>
          </div>
         
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: `Generate ${couponsCount} Tokens`,
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#ED1C24',
      cancelButtonColor: '#94A3B8',
    });

    if (!confirmRes.isConfirmed) return;

    setIsGenerating(true);
    setProgressMsg('Requesting unique tokens from backend database...');
    setProgressPercent(5);

    try {
      // 1. Backend generation
      const res = await popularApi.batchCreateTokens(couponsCount, 'popular-electricals-qatar', 'PET', 3);
      const generatedTokens = res.tokens;

      if (!generatedTokens || generatedTokens.length === 0) {
        throw new Error('No tokens were returned by the server.');
      }

      // 2. Client-side PDF stamping
      await generateA3PdfForTokens({
        tokens: generatedTokens,
        brandSlug: 'popular-electricals-qatar',
        onProgress: (msg, current, total) => {
          setProgressMsg(msg);
          const pct = Math.round((current / total) * 90) + 10;
          setProgressPercent(Math.min(pct, 100));
        },
      });

      // 3. Success feedback & refresh list
      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded Successfully!',
        html: `
          <div style="font-size: 14px; color: #334155; line-height: 1.6;">
            <b>${generatedTokens.length} unique QR coupons</b> have been generated and saved to the database.
            <div style="margin-top: 8px; font-size: 12.5px; color: #64748B;">
              Your A3 PDF is ready for showroom printing. Don't forget to download the matching Back Sheet if you plan to do double-sided printing!
            </div>
          </div>
        `,
        confirmButtonColor: '#ED1C24',
      });

      fetchTokens();
    } catch (err: any) {
      console.error('Failed to generate tokens:', err);
      Swal.fire({
        icon: 'error',
        title: 'Generation Failed',
        text: err.message || 'An error occurred while creating tokens or building the PDF.',
        confirmButtonColor: '#ED1C24',
      });
    } finally {
      setIsGenerating(false);
      setProgressMsg('');
      setProgressPercent(0);
    }
  };

  // Filter & Search tokens
  const filteredTokens = tokensList.filter((t) => {
    const isUsed = !!t.user || (t.livesRemaining !== undefined && t.livesRemaining < t.initialLives);
    if (filterStatus === 'ACTIVE' && isUsed) return false;
    if (filterStatus === 'USED' && !isUsed) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const codeMatch = t.code.toLowerCase().includes(q);
    const userNameMatch = t.user?.name?.toLowerCase().includes(q);
    const userPhoneMatch = t.user?.phone?.toLowerCase().includes(q);
    return codeMatch || userNameMatch || userPhoneMatch;
  });

  return (
    <div className="pet-dashboard-tokens">
      {/* 1. Generator Card */}
      <div className="pet-panel-card" style={{ marginBottom: '24px' }}>
        <div className="pet-panel-header">
          <div>
            <div className="pet-panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconQrCode style={{ color: '#ED1C24' }} />
              <span>A3 Showroom QR Token Generator</span>
            </div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Generate batches of unique printable tokens mapped to the 36-coupon A3 portrait template.
            </span>
          </div>

          <button
            type="button"
            className="pet-btn-action"
            onClick={downloadA3BackSheet}
            title="Download matching A3 Back Side for double-sided print"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPrinter style={{ width: 14, height: 14 }} />
            <span>Download A3 Back Sheet</span>
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              alignItems: 'center',
            }}
          >
            {/* Input Config Box */}
            <div
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '18px 20px',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '8px',
                }}
              >
                Number of A3 Pages to Generate
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={pagesCount}
                  onChange={(e) => setPagesCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  disabled={isGenerating}
                  style={{
                    width: '90px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #CBD5E1',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0F172A',
                    textAlign: 'center',
                  }}
                />

                <div style={{ fontSize: '14px', color: '#334155' }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#ED1C24' }}>
                    = {couponsCount} Total Coupons
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    (36 coupons per A3 page • 4 cols × 9 rows)
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setPagesCount(num)}
                    disabled={isGenerating}
                    style={{
                      background: pagesCount === num ? '#ED1C24' : '#FFFFFF',
                      color: pagesCount === num ? '#FFFFFF' : '#475569',
                      border: '1px solid',
                      borderColor: pagesCount === num ? '#ED1C24' : '#CBD5E1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {num} {num === 1 ? 'Page' : 'Pages'} ({num * 36})
                  </button>
                ))}
              </div>
            </div>

            {/* Action CTA & Specs Box */}
            <div
              style={{
                background: '#FFF1F2',
                border: '1px solid #FFE4E6',
                borderRadius: '10px',
                padding: '18px 20px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#BE123C', textTransform: 'uppercase', marginBottom: '4px' }}>
                Showroom Template Spec
              </div>
              <div style={{ fontSize: '13px', color: '#4C0519', lineHeight: 1.5, marginBottom: '14px' }}>
                Coupons use <b>QR FRONT.png</b> (1530 × 1028 px) with QR codes stamped at (1079, 325), perfectly sized for card cutting.
              </div>

              <button
                type="button"
                onClick={handleGenerateAndDownload}
                disabled={isGenerating}
                style={{
                  width: '100%',
                  background: isGenerating ? '#94A3B8' : '#ED1C24',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 18px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 6px rgba(237, 28, 36, 0.25)',
                }}
              >
                {isGenerating ? (
                  <>
                    <IconRefresh className="pet-spin" style={{ width: 16, height: 16 }} />
                    <span>Processing {progressPercent}%...</span>
                  </>
                ) : (
                  <>
                    <IconDownload style={{ width: 16, height: 16 }} />
                    <span>Generate & Download {couponsCount} Tokens (PDF)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar Display */}
          {isGenerating && (
            <div style={{ marginTop: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>
                <span>{progressMsg}</span>
                <span style={{ fontWeight: 700 }}>{progressPercent}%</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: '#ED1C24',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Token Audit Table */}
      <div className="pet-panel-card">
        <div className="pet-panel-header">
          <div>
            <div className="pet-panel-title">Registered Showroom Tokens</div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Live audit of all tokens generated in the database ({tokensList.length} total tokens)
            </span>
          </div>

          <button
            type="button"
            className="pet-btn-action"
            onClick={fetchTokens}
            title="Refresh Token List"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconRefresh style={{ width: 14, height: 14 }} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="pet-rewards-toolbar">
          <div className="pet-rewards-search-wrap">
            <span className="pet-rewards-search-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSearch style={{ width: 15, height: 15 }} />
            </span>
            <input
              type="text"
              className="pet-rewards-search-input"
              placeholder="Search by token code, customer name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div className="smooth-lb-tabs" style={{ margin: 0, padding: '2px', background: '#F1F5F9' }}>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filterStatus === 'ALL' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
                onClick={() => setFilterStatus('ALL')}
              >
                All
              </button>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
                onClick={() => setFilterStatus('ACTIVE')}
              >
                Active
              </button>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filterStatus === 'USED' ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
                onClick={() => setFilterStatus('USED')}
              >
                Scanned
              </button>
            </div>

            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginLeft: '6px' }}>
              Showing {filteredTokens.length} of {tokensList.length}
            </span>
          </div>
        </div>

        <div className="pet-table-container">
          <table className="pet-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                <th>Token Code</th>
                <th>Status</th>
                <th>Lives Remaining</th>
                <th>Attached Customer</th>
                <th>Customer Phone</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {loadingTokens ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <IconRefresh className="pet-spin" style={{ width: 18, height: 18, color: '#ED1C24' }} />
                      <span>Loading tokens from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '28px', color: '#64748B' }}>
                    {search ? 'No tokens matched your search query.' : 'No tokens found in database.'}
                  </td>
                </tr>
              ) : (
                filteredTokens.map((t, idx) => {
                  const isAttached = !!t.user;
                  const dateStr = t.createdAt
                    ? new Date(t.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '—';

                  return (
                    <tr key={t.id || t.code}>
                      <td style={{ textAlign: 'center', color: '#94A3B8', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ fontWeight: 700, fontFamily: 'monospace', color: '#0F172A', fontSize: '13px' }}>
                        {t.code}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            letterSpacing: '0.4px',
                            background: isAttached ? '#E2E8F0' : '#DCFCE7',
                            color: isAttached ? '#475569' : '#15803D',
                          }}
                        >
                          {isAttached ? 'SCANNED' : 'ACTIVE'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontWeight: 600,
                            color: t.livesRemaining > 0 ? '#0F172A' : '#EF4444',
                          }}
                        >
                          {t.livesRemaining !== undefined ? t.livesRemaining : 3} / {t.initialLives || 3}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: t.user ? '#0F172A' : '#94A3B8' }}>
                        {t.user?.name || 'Unclaimed'}
                      </td>
                      <td style={{ color: '#475569', fontFamily: 'monospace', fontSize: '12px' }}>
                        {t.user?.phone || '—'}
                      </td>
                      <td style={{ color: '#64748B', fontSize: '12px' }}>{dateStr}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
