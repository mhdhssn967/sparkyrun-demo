import { useState, useEffect } from 'react';
import { SUPPORTED_COUNTRIES } from '../../types/customer';
import type { CustomerProfile } from '../../types/customer';
import { popularApi } from '../../services/popularApi';

interface CustomerRegistrationModalProps {
  onRegistered: (profile: CustomerProfile) => void;
  initialProfile?: CustomerProfile | null;
  canClose?: boolean;
  onClose?: () => void;
}

export function CustomerRegistrationModal({
  onRegistered,
  initialProfile,
  canClose = false,
  onClose,
}: CustomerRegistrationModalProps) {
  const [selectedCountry, setSelectedCountry] = useState(
    SUPPORTED_COUNTRIES.find((c) => c.dialCode === initialProfile?.countryCode) ||
      SUPPORTED_COUNTRIES[0], // Qatar +974 default
  );
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [name, setName] = useState(initialProfile?.name || '');
  const [nameTouched, setNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const saved = popularApi.getCustomerProfile();
    if (saved && !initialProfile) {
      if (saved.phone) setPhone(saved.phone);
      if (saved.name) setName(saved.name);
    }
  }, [initialProfile]);

  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length >= 6;
  const isNameValid = name.trim().length >= 2;

  const nameInlineError =
    nameTouched && name.trim().length > 0 && !isNameValid
      ? 'Please enter at least 2 characters'
      : '';

  const canSubmit = isNameValid && isPhoneValid && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setPhoneTouched(true);
    setErrorMsg('');

    if (!isNameValid) {
      setErrorMsg('Please enter your name.');
      return;
    }

    if (!isPhoneValid) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await popularApi.registerCustomer({
        name: name.trim(),
        countryCode: selectedCountry.dialCode,
        phone: cleanPhone,
        consent: true,
      });
      onRegistered(profile);
    } catch {
      setErrorMsg('Unable to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cyber-start-viewport">
      <div className="cyber-ambient-radial" />

      <svg
        className="cyber-bg-circuits"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 60,0 L 60,240 L 30,270 L 30,550 L 70,590 L 70,1000"
          stroke="rgba(255, 38, 71, 0.2)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M 940,60 L 890,200 L 920,200 L 870,360 L 900,360 L 850,520 L 930,520 L 930,1000"
          stroke="rgba(255, 38, 71, 0.22)"
          strokeWidth="1.8"
          fill="none"
        />
      </svg>

      <div className="cyber-start-content">
        <div className="cyber-brand-header">
          <img
            src="/pet_logo_red.png"
            alt="PET Popular Electricals & Trading Co. W.L.L"
            className="cyber-pet-logo"
            width={329}
            height={263}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/image.png';
            }}
          />
        </div>

        <div className="cyber-chassis-wrapper">
          <div className="cyber-sparky-logo-wrap">
            <div className="sparky-logo-ambient-glow" />
            <img
              src="/sparky_run.webp"
              alt="Sparky Run"
              className="cyber-sparky-run-img"
              width={260}
              height={158}
            />
          </div>

          <div className="cyber-chassis-card">
            {canClose && onClose && (
              <button
                type="button"
                className="cyber-close-btn"
                onClick={onClose}
                aria-label="Close"
              >
                ✕
              </button>
            )}

            <div className="cyber-card-headings">
              <h2 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: '0 0 6px', letterSpacing: '0.5px' }}>
                RUNNER REGISTRATION
              </h2>
              <p className="cyber-main-subtitle">
                Enter your name and mobile number to start playing!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="cyber-form" noValidate>
              {/* Name Field */}
              <div className="cyber-form-group">
                <div className="cyber-label-row">
                  <label htmlFor="cyber-name" className="cyber-label">
                    <span className="cyber-label-icon">👤</span>
                    <span className="cyber-label-text">Your Name</span>
                    <span className="cyber-req-star">*</span>
                  </label>
                  {nameInlineError && (
                    <span className="cyber-inline-error">{nameInlineError}</span>
                  )}
                </div>
                <div className="cyber-input-wrap">
                  <input
                    id="cyber-name"
                    type="text"
                    className={`cyber-text-input ${nameInlineError ? 'input-has-error' : ''}`}
                    placeholder="e.g. Alex Hunter"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!nameTouched) setNameTouched(true);
                    }}
                    onBlur={() => setNameTouched(true)}
                    maxLength={40}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile Number Field */}
              <div className="cyber-form-group">
                <div className="cyber-label-row">
                  <label htmlFor="cyber-phone" className="cyber-label">
                    <span className="cyber-label-icon">📞</span>
                    <span className="cyber-label-text">Mobile Number</span>
                    <span className="cyber-req-star">*</span>
                  </label>
                </div>

                <div className="cyber-phone-row">
                  <div className="cyber-country-dropdown-wrap">
                    <div className="cyber-country-display">
                      <span className="cyber-dial-code">{selectedCountry.dialCode}</span>
                      <span className="cyber-select-chevron">⌵</span>
                    </div>
                    <select
                      className="cyber-country-select-hidden"
                      value={selectedCountry.code}
                      onChange={(e) => {
                        const country = SUPPORTED_COUNTRIES.find((c) => c.code === e.target.value);
                        if (country) setSelectedCountry(country);
                      }}
                      aria-label="Country Dial Code"
                    >
                      {SUPPORTED_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.dialCode} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="cyber-input-wrap cyber-phone-input-wrap">
                    <input
                      id="cyber-phone"
                      type="tel"
                      className="cyber-text-input"
                      placeholder="e.g. 55123456"
                      value={phone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        if (digitsOnly.length <= 15) {
                          setPhone(digitsOnly);
                        }
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
                {phoneTouched && !isPhoneValid && (
                  <span className="cyber-inline-error" style={{ display: 'block', marginTop: 4 }}>
                    Please enter a valid phone number
                  </span>
                )}
              </div>

              {errorMsg && <div className="cyber-error-banner">{errorMsg}</div>}

              <div className="cyber-btn-wrap" style={{ marginTop: '14px' }}>
                <button
                  type="submit"
                  className="cyber-solid-cta-btn"
                  disabled={!canSubmit}
                >
                  <span className="cyber-btn-label">
                    {isSubmitting ? 'STARTING...' : "LET'S PLAY"}
                  </span>
                  <span className="cyber-btn-arrow">➔</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
