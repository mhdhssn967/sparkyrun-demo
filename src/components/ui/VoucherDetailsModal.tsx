import type { ClaimedVoucher } from '../../types/customer';

interface VoucherDetailsModalProps {
  voucher: ClaimedVoucher;
  allVouchers?: ClaimedVoucher[];
  onSelectVoucher?: (v: ClaimedVoucher) => void;
  onClose: () => void;
}

export function VoucherDetailsModal({
  voucher,
  allVouchers = [],
  onSelectVoucher,
  onClose,
}: VoucherDetailsModalProps) {
  return (
    <div className="voucher-overlay-backdrop" onClick={onClose}>
      <div className="voucher-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="voucher-modal-header">
          <div className="voucher-dialog-badge">OFFICIAL STORE REWARD VOUCHER</div>
          <button
            type="button"
            className="home-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* If multiple vouchers exist, show a switcher pill row */}
        {allVouchers.length > 1 && (
          <div className="voucher-multi-tabs">
            {allVouchers.map((v, idx) => {
              const isSelected = (v.id || v.voucherCode) === (voucher.id || voucher.voucherCode);
              return (
                <button
                  key={v.id || v.voucherCode || idx}
                  type="button"
                  className={`voucher-tab-chip ${isSelected ? 'active' : ''}`}
                  onClick={() => onSelectVoucher?.(v)}
                >
                  {v.rewardTitle} #{idx + 1}
                </button>
              );
            })}
          </div>
        )}

        <div className="voucher-dialog-body">
          <div className="voucher-dialog-title">{voucher.rewardTitle}</div>

          {/* Clean Big Voucher Code Display - No Barcode */}
          <div className="voucher-code-box">
            <div className="voucher-code-label">OFFICIAL REWARD CODE</div>
            <div className="voucher-code-text">{voucher.voucherCode}</div>
          </div>

          {/* Verification Card with Name, Phone, and Coins Used */}
          <div className="voucher-verification-card">
            <div className="verification-row">
              <span className="verif-label">Customer Name:</span>
              <span className="verif-val">{voucher.customerName || 'Popular Customer'}</span>
            </div>
            <div className="verification-row">
              <span className="verif-label">Phone Number:</span>
              <span className="verif-val highlight">{voucher.customerPhone}</span>
            </div>
            <div className="verification-row">
              <span className="verif-label">Score / Coins Used:</span>
              <span className="verif-val coins-highlight">
                🪙 {(voucher.redeemedCoins || 0).toLocaleString()} Coins
              </span>
            </div>
            <div className="verification-row">
              <span className="verif-label">Status:</span>
              <span className="verif-val active-status">
                {voucher.status === 'REDEEMED' ? 'REDEEMED' : 'PENDING '}
              </span>
            </div>
          </div>

          <p className="voucher-instructions">
            📍 Show this voucher code at any Popular Electricals showroom counter in Qatar to collect your reward.
          </p>
        </div>

        <button type="button" className="voucher-close-action-btn" onClick={onClose}>
          DONE
        </button>
      </div>
    </div>
  );
}
