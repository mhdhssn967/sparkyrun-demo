import { useState, useEffect } from 'react';
import { SUPPORTED_COUNTRIES } from '../../types/customer';
import type { CustomerProfile } from '../../types/customer';
import { popularApi } from '../../services/popularApi';
import { getSavedPlayer } from '../../services/authService';

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
  // Two-step login/registration: 'phone' -> check DB -> if exists login, else 'name'
  const [step, setStep] = useState<'phone' | 'name'>('phone');

  const [selectedCountry, setSelectedCountry] = useState(
    SUPPORTED_COUNTRIES.find((c) => c.dialCode === initialProfile?.countryCode) ||
      SUPPORTED_COUNTRIES[0], // Qatar +974 default
  );
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [name, setName] = useState(initialProfile?.name || '');
  const [companyName, setCompanyName] = useState(initialProfile?.companyName || '');
  const [nameTouched, setNameTouched] = useState(false);
  const [consent, setConsent] = useState(initialProfile?.consent ?? false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check saved player session on mount
  useEffect(() => {
    const saved = getSavedPlayer();
    if (saved && !initialProfile) {
      if (saved.phone) setPhone(saved.phone);
      if (saved.name) setName(saved.name);
      if (saved.companyName) setCompanyName(saved.companyName);
      setConsent(true);
    }
  }, [initialProfile]);

  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === selectedCountry.digits;
  const isNameValid = name.trim().length >= 2;

  const nameInlineError =
    nameTouched && name.trim().length > 0 && !isNameValid
      ? 'Please enter at least 2 characters'
      : '';

  const canSubmitStep1 = isPhoneValid && consent && !isSubmitting;
  const canSubmitStep2 = isNameValid && !isSubmitting;

  // Step 1: Check phone in DB/storage -> login if exists, otherwise proceed to Step 2
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPhoneValid) {
      setErrorMsg('Please enter a valid mobile number.');
      return;
    }

    if (!consent) {
      setErrorMsg('Please accept the verification terms to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const existingUser = await popularApi.checkCustomerByPhone(
        selectedCountry.dialCode,
        cleanPhone,
      );

      if (existingUser) {
        // User exists in DB! Log them in immediately
        onRegistered(existingUser);
        return;
      }

      // User does not exist yet; move to Step 2 to enter Name
      setStep('name');
    } catch {
      setErrorMsg('Unable to verify phone number. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Register new user with entered Name & Company
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setErrorMsg('');

    const trimmedName = name.trim();
    const trimmedCompany = companyName.trim();
    if (!isNameValid) {
      setErrorMsg('Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const profile = await popularApi.registerCustomer({
        name: trimmedName,
        companyName: trimmedCompany || undefined,
        countryCode: selectedCountry.dialCode,
        phone: cleanPhone,
        consent,
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
      {/* Ambient background glows */}
      <div className="cyber-ambient-radial" />

      {/* Subtle background lightning motif */}
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

      {/* Main Start Page Layout Container */}
      <div className="cyber-start-content">
        {/* Top PET Popular Electricals Logo */}
        <div className="cyber-brand-header">
          <img
            src="/pet_logo_red.png"
            alt="PET Popular Electricals & Trading Co. W.L.L"
            className="cyber-pet-logo"
            width={329}
            height={263}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/bannerimages/image.png';
            }}
          />
        </div>

        {/* Showrooms Addresses Below PET Logo */}
        {/* <div className="cyber-showrooms-wrap">
          <div className="cyber-showroom-card">
            <div className="cyber-showroom-title">NAJMA SHOWROOM</div>
            <div className="cyber-showroom-addr">
              Opposite Souq Harraj Gate 1&2 Lavilla Appartments Building Najma-Doha
            </div>
            <div className="cyber-showroom-contacts">
              <span className="contact-chunk">
                <span className="contact-lbl">Ph:</span>{' '}
                <a href="tel:44271794" className="contact-link">44271794</a>
              </span>
              <span className="contact-chunk">
                <span className="contact-lbl">Fax:</span>{' '}
                <span className="contact-val">44419758</span>
              </span>
              <span className="contact-chunk">
                <span className="contact-lbl">Email:</span>{' '}
                <a href="mailto:shop1@popularqatar.com" className="contact-link">shop1@popularqatar.com</a>
              </span>
            </div>
          </div>

          <div className="cyber-showroom-card">
            <div className="cyber-showroom-title">BARWA VILLAGE SHOWROOM</div>
            <div className="cyber-showroom-addr">
              Shop No 11, Building No. 4, Wakrah Road, Barwa Village
            </div>
            <div className="cyber-showroom-contacts">
              <span className="contact-chunk">
                <span className="contact-lbl">Ph:</span>{' '}
                <a href="tel:44153195" className="contact-link">44153195</a>
              </span>
              <span className="contact-chunk">
                <span className="contact-lbl">Fax:</span>{' '}
                <span className="contact-val">44153195</span>
              </span>
              <span className="contact-chunk">
                <span className="contact-lbl">Email:</span>{' '}
                <a href="mailto:shop4@popularqatar.com" className="contact-link">shop4@popularqatar.com</a>
              </span>
            </div>
          </div>
        </div> */}

        {/* Center Sci-Fi Cyber Card */}
        <div className="cyber-chassis-wrapper">
          {/* Sparky Run Logo: Main visual emphasis with subtle red glow */}
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
            {/* Optional Close Button for edit-profile mode */}
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

            {/* Sub-Header & Instructions */}
            <div className="cyber-card-headings">
              <p className="cyber-main-subtitle">
                {step === 'phone'
                  ? 'Enter your mobile number to qualify for live leaderboards and redeem in-store rewards!'
                  : 'Welcome! Enter your name to complete your registration.'}
              </p>
            </div>

            {/* Step 1: Mobile Number Entry */}
            {step === 'phone' && (
              <form onSubmit={handlePhoneSubmit} className="cyber-form" noValidate>
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
                    {/* Country Code Trigger: shows ONLY code (e.g. +974), options inside dropdown */}
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

                    {/* Near-Black Phone Input Field - Fixed to 8 digits for Qatar */}
                    <div className="cyber-input-wrap cyber-phone-input-wrap">
                      <input
                        id="cyber-phone"
                        type="tel"
                        className="cyber-text-input"
                        placeholder={`e.g. ${selectedCountry.digits === 8 ? '51234567' : '50123456'}`}
                        value={phone}
                        onChange={(e) => {
                          const digitsOnly = e.target.value.replace(/\D/g, '');
                          if (digitsOnly.length <= selectedCountry.digits) {
                            setPhone(digitsOnly);
                          }
                        }}
                        maxLength={selectedCountry.digits}
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* Simplified & Clean Consent Section */}
                <div className="cyber-consent-container">
                  {/* Primary Required Consent */}
                  <label className="cyber-consent-row required-consent">
                    <input
                      type="checkbox"
                      className="cyber-checkbox-hidden"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                    />
                    <span className="cyber-checkbox-custom">
                      {consent && <span className="cyber-checkmark">✓</span>}
                    </span>
                    <span className="cyber-consent-label-text">
                      I consent to Popular Electricals saving my number to verify and redeem rewards in-store.
                    </span>
                  </label>
                </div>

                {/* Global Error Banner */}
                {errorMsg && <div className="cyber-error-banner">{errorMsg}</div>}

                {/* Solid Red CTA Button with Disabled State */}
                <div className="cyber-btn-wrap">
                  <button
                    type="submit"
                    className="cyber-solid-cta-btn"
                    disabled={!canSubmitStep1}
                  >
                    <span className="cyber-btn-label">
                      {isSubmitting ? 'CHECKING...' : 'CONTINUE'}
                    </span>
                    <span className="cyber-btn-arrow">➔</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Name Entry for New Users */}
            {step === 'name' && (
              <form onSubmit={handleNameSubmit} className="cyber-form" noValidate>
                {/* Verified Phone Badge with Change Option */}
                <div className="cyber-phone-confirmed-pill">
                  <div className="cyber-confirmed-phone-info">
                    <span className="cyber-check-dot">✓</span>
                    <span className="cyber-confirmed-number">{selectedCountry.dialCode} {cleanPhone}</span>
                  </div>
                  <button
                    type="button"
                    className="cyber-change-phone-btn"
                    onClick={() => {
                      setStep('phone');
                      setErrorMsg('');
                    }}
                  >
                    Change Phone
                  </button>
                </div>

                {/* Full Name Field */}
                <div className="cyber-form-group">
                  <div className="cyber-label-row">
                    <label htmlFor="cyber-name" className="cyber-label">
                      <span className="cyber-label-icon">👤</span>
                      <span className="cyber-label-text">Full Name</span>
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
                      placeholder="e.g. Salem Al-Kuwari"
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

                {/* Company Name Field (Popular B2B Clients) */}
                <div className="cyber-form-group">
                  <div className="cyber-label-row">
                    <label htmlFor="cyber-company" className="cyber-label">
                      <span className="cyber-label-icon">🏢</span>
                      <span className="cyber-label-text">Company / Business Name</span>
                    </label>
                  </div>
                  <div className="cyber-input-wrap">
                    <input
                      id="cyber-company"
                      type="text"
                      className="cyber-text-input"
                      placeholder="e.g. Al-Mansoor Electricals or Trading Co."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      maxLength={60}
                    />
                  </div>
                </div>

                {/* Global Error Banner */}
                {errorMsg && <div className="cyber-error-banner">{errorMsg}</div>}

                {/* Solid Red CTA Button */}
                <div className="cyber-btn-wrap">
                  <button
                    type="submit"
                    className="cyber-solid-cta-btn"
                    disabled={!canSubmitStep2}
                  >
                    <span className="cyber-btn-label">
                      {isSubmitting ? 'SAVING...' : 'START PLAYING'}
                    </span>
                    <span className="cyber-btn-arrow">➔</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
