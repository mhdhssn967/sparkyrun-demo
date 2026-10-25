import { useState, type FormEvent } from 'react';
import { IconLock, IconAlert } from './DashboardIcons';
import { popularApi } from '../../services/popularApi';

interface AdminLoginModalProps {
  onLoginSuccess: (user: any) => void;
  onBackToGame?: () => void;
}

export function AdminLoginModal({ onLoginSuccess, onBackToGame }: AdminLoginModalProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter your email or username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await popularApi.adminLogin(
        identifier.trim(),
        password,
        'popular-electricals-qatar'
      );

      // Save session in sessionStorage (expires on browser close for security)
      sessionStorage.setItem('gf_admin_token', data.token);
      sessionStorage.setItem('gf_admin_user', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials or unauthorized brand');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pet-admin-auth-overlay">
      <div className="pet-admin-auth-card">
        {/* Brand Header */}
        <div className="pet-admin-auth-header">
          <div className="pet-admin-auth-logo-wrap">
            <img
              src="/pet_logo_red.png"
              alt="Popular Electricals Qatar"
              className="pet-admin-auth-logo"
            />
          </div>
          <h2 className="pet-admin-auth-title">Popular Electricals Qatar</h2>
          <p className="pet-admin-auth-sub">
            Admin Auth Gate • Analytics & Player Portal
          </p>
          <div className="pet-admin-brand-pill">
            <span className="pet-admin-brand-dot" />
            <span>Scope: popular-electricals-qatar</span>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div className="pet-admin-auth-alert" role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconAlert style={{ width: 16, height: 16, flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="pet-admin-auth-form">
          <div className="pet-admin-field-group">
            <label className="pet-admin-label" htmlFor="admin-identifier">
              Email or Username
            </label>
            <input
              id="admin-identifier"
              type="text"
              autoComplete="username"
              className="pet-admin-input"
              placeholder="e.g. admin@sparkyrun.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="pet-admin-field-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="pet-admin-label" htmlFor="admin-password">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="pet-admin-toggle-pwd"
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="pet-admin-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="pet-admin-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="pet-admin-spinner" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <IconLock />
                <span>Login to Popular Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info & Exit */}
        <div className="pet-admin-auth-footer">
          {onBackToGame && (
            <button
              type="button"
              className="pet-admin-back-btn"
              onClick={onBackToGame}
            >
              ← Return to Sparky Run Game
            </button>
          )}
          <span className="pet-admin-auth-footnote">
            Protected by GameFaktory Multi-Tenant RBAC Security
          </span>
        </div>
      </div>
    </div>
  );
}
