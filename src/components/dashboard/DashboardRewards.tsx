import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { popularApi } from '../../services/popularApi';
import type { ClaimedVoucher } from '../../types/customer';
import {
  IconGift,
  IconSearch,
  IconRefresh,
  IconTicket,
  IconCoin,
} from './DashboardIcons';

export function DashboardRewards() {
  const [coupons, setCoupons] = useState<ClaimedVoucher[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REDEEMED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await popularApi.getBrandCoupons('popular-electricals-qatar');
      setCoupons(data);
    } catch {
      /* ignore */
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleRedeem = async (coupon: ClaimedVoucher) => {
    const identifier = coupon.id || coupon.voucherCode;
    const name = coupon.customerName || 'Valued Customer';
    const reward = coupon.rewardTitle || 'Reward';
    const code = coupon.voucherCode;
    const phone = coupon.customerPhone || 'N/A';

    const result = await Swal.fire({
      title: 'Confirm Coupon Redemption',
      html: `
        <div style="text-align: left; font-size: 14px; color: #334155; line-height: 1.6; margin-top: 10px;">
          <p style="margin: 0 0 10px 0;">Are you sure you want to mark this coupon as <b>REDEEMED</b> and hand over the item to the customer?</p>
          <div style="background: #FFF1F2; border: 1.5px dashed #FDA4AF; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
            <div style="font-size: 11px; font-weight: 700; color: #BE123C; text-transform: uppercase;">Voucher Code</div>
            <div style="font-family: monospace; font-size: 18px; font-weight: 800; color: #9F1239; letter-spacing: 1px;">${code}</div>
          </div>
          <div style="background: #F8FAFC; border-radius: 8px; padding: 10px 12px; font-size: 13px;">
            <div><b>Item:</b> ${reward}</div>
            <div><b>Customer:</b> ${name}</div>
            <div><b>Phone:</b> ${phone}</div>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ED1C24',
      cancelButtonColor: '#64748B',
      confirmButtonText: '✓ Yes, Mark Redeemed',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setRedeemingId(identifier);
    try {
      await popularApi.redeemCoupon(identifier, 'popular-electricals-qatar');
      await fetchCoupons();

      Swal.fire({
        title: 'Redeemed Successfully!',
        text: `Coupon ${code} for "${reward}" has been marked as redeemed.`,
        icon: 'success',
        confirmButtonColor: '#ED1C24',
        timer: 3000,
        timerProgressBar: true,
      });
    } catch {
      Swal.fire({
        title: 'Redemption Failed',
        text: 'Could not update coupon status. Please check your connection and try again.',
        icon: 'error',
        confirmButtonColor: '#ED1C24',
      });
    } finally {
      setRedeemingId(null);
    }
  };

  // Filter by status tab AND search query (name, phone number, reward ID / coupon code)
  const filteredCoupons = coupons.filter((c) => {
    const isPending = c.status === 'PENDING' || c.status === 'active';
    if (filter === 'PENDING' && !isPending) return false;
    if (filter === 'REDEEMED' && isPending) return false;

    if (!searchQuery.trim()) return true;

    const query = searchQuery.trim().toLowerCase();
    const name = (c.customerName || '').toLowerCase();
    const phone = (c.customerPhone || '').toLowerCase().replace(/\s+/g, '');
    const cleanQuery = query.replace(/\s+/g, '');
    const rewardId = (c.rewardId || '').toLowerCase();
    const rewardTitle = (c.rewardTitle || '').toLowerCase();
    const voucherCode = (c.voucherCode || '').toLowerCase().replace(/\s+/g, '');

    return (
      name.includes(query) ||
      phone.includes(cleanQuery) ||
      rewardId.includes(query) ||
      rewardTitle.includes(query) ||
      voucherCode.includes(cleanQuery)
    );
  });

  const pendingCount = coupons.filter((c) => c.status === 'PENDING' || c.status === 'active').length;
  const redeemedCount = coupons.filter((c) => c.status !== 'PENDING' && c.status !== 'active').length;

  return (
    <div className="pet-dashboard-rewards">
      {/* Customer Store Coupons & Redemption Section */}
      <div className="pet-panel-card" style={{ marginBottom: '28px' }}>
        <div className="pet-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="pet-panel-title">Customer Store Coupons & Redemption</div>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Verify player identity, check coupon code, and mark as redeemed at checkout
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Segmented Filter Capsule */}
            <div className="smooth-lb-tabs-capsule" style={{ margin: 0, padding: '3px' }}>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filter === 'PENDING' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilter('PENDING')}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filter === 'REDEEMED' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilter('REDEEMED')}
              >
                Redeemed ({redeemedCount})
              </button>
              <button
                type="button"
                className={`smooth-lb-tab-pill ${filter === 'ALL' ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px' }}
                onClick={() => setFilter('ALL')}
              >
                All ({coupons.length})
              </button>
            </div>

            <button
              type="button"
              className="pet-btn-action"
              onClick={fetchCoupons}
              title="Refresh coupons"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconRefresh style={{ width: 14, height: 14 }} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="pet-rewards-toolbar">
          <div className="pet-rewards-search-wrap">
            <span className="pet-rewards-search-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconSearch style={{ width: 15, height: 15 }} />
            </span>
            <input
              type="text"
              className="pet-rewards-search-input"
              placeholder="Search by customer name, phone number, reward ID, or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 600 }}>
            Showing {filteredCoupons.length} of {coupons.length} coupons
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ED1C24',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        </div>

        {/* Coupons Display: Visual Interactive Cards Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748B' }}>
            <span style={{ display: 'inline-flex', marginBottom: '10px' }}>
              <IconRefresh className="pet-spin" style={{ width: 28, height: 28, color: '#ED1C24' }} />
            </span>
            <div style={{ fontWeight: 600 }}>Loading customer coupons...</div>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              color: '#64748B',
              background: '#F8FAFC',
              borderRadius: '8px',
              marginTop: '20px',
              border: '1px dashed #CBD5E1',
            }}
          >
            <span style={{ display: 'inline-flex', marginBottom: '10px', color: '#94A3B8' }}>
              <IconTicket style={{ width: 32, height: 32 }} />
            </span>
            <div style={{ fontWeight: 700, color: '#334155', fontSize: '14px', marginBottom: '4px' }}>
              {searchQuery ? 'No coupons matched your search.' : 'No coupons found.'}
            </div>
            <div style={{ fontSize: '12.5px' }}>
              {searchQuery
                ? `Try checking the spelling for "${searchQuery}" or switch the status filter tab.`
                : filter === 'PENDING'
                ? 'No pending customer coupons awaiting redemption.'
                : 'No redeemed coupons recorded yet.'}
            </div>
          </div>
        ) : (
          <div className="pet-coupon-cards-grid">
            {filteredCoupons.map((c) => {
              const isPending = c.status === 'PENDING' || c.status === 'active';
              const dateStr = c.claimedAt
                ? new Date(c.claimedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '—';
              const redeemedDateStr = c.redeemedAt
                ? new Date(c.redeemedAt).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null;

              return (
                <div
                  key={c.id || c.voucherCode}
                  className={`pet-coupon-card ${isPending ? 'pending' : 'redeemed'}`}
                >
                  {/* Top Bar: Title, ID & Status Badge */}
                  <div>
                    <div className="pet-coupon-card-header">
                      <div>
                        <div className="pet-coupon-item-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconGift style={{ width: 16, height: 16, color: '#ED1C24' }} />
                          <span>{c.rewardTitle || 'Store Reward'}</span>
                        </div>
                        {c.rewardId && (
                          <span className="pet-coupon-reward-id-tag" title="Reward ID">
                            ID: {c.rewardId}
                          </span>
                        )}
                      </div>

                      <span className={`pet-coupon-status-badge ${isPending ? 'pending' : 'redeemed'}`}>
                        {isPending ? 'PENDING' : '✓ REDEEMED'}
                      </span>
                    </div>

                    {/* Voucher Code & Coins Banner */}
                    <div className="pet-coupon-code-banner" style={{ marginTop: '12px' }}>
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#9F1239', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Voucher Code
                        </div>
                        <div className="pet-coupon-code-val">{c.voucherCode}</div>
                      </div>

                      <span className="pet-coupon-coins-chip" title="Coins redeemed" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <IconCoin style={{ width: 13, height: 13 }} />
                        <span>{(c.redeemedCoins || 0).toLocaleString()} pts</span>
                      </span>
                    </div>
                  </div>

                  {/* Customer Information Panel */}
                  <div className="pet-coupon-details-grid">
                    <div className="pet-coupon-detail-row">
                      <span className="pet-coupon-detail-label">Customer</span>
                      <span className="pet-coupon-detail-value">
                        {c.customerName || 'Valued Customer'}
                      </span>
                    </div>

                    <div className="pet-coupon-detail-row">
                      <span className="pet-coupon-detail-label">Phone</span>
                      <span className="pet-coupon-detail-value" style={{ fontFamily: 'monospace' }}>
                        {c.customerPhone || '—'}
                      </span>
                    </div>

                    <div className="pet-coupon-detail-row">
                      <span className="pet-coupon-detail-label">Claimed</span>
                      <span className="pet-coupon-detail-value" style={{ fontSize: '12px' }}>
                        {dateStr}
                      </span>
                    </div>

                    {redeemedDateStr && (
                      <div className="pet-coupon-detail-row">
                        <span className="pet-coupon-detail-label">Redeemed</span>
                        <span className="pet-coupon-detail-value" style={{ fontSize: '12px', color: '#15803D' }}>
                          {redeemedDateStr}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer Cashier Action */}
                  <div className="pet-coupon-card-footer">
                    {isPending ? (
                      <button
                        type="button"
                        className="pet-btn-redeem-cashier"
                        disabled={redeemingId === (c.id || c.voucherCode)}
                        onClick={() => handleRedeem(c)}
                      >
                        {redeemingId === (c.id || c.voucherCode) ? (
                          'Redeeming...'
                        ) : (
                          <>
                            <span>✓</span>
                            <span>Mark as Redeemed</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '8px 10px',
                          background: '#F1F5F9',
                          borderRadius: '6px',
                          fontSize: '12px',
                          color: '#64748B',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Completed & Given to Customer
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
