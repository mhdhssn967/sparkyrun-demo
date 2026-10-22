import { useState, useCallback } from 'react';
import {
  useCrystalConfig,
  setCrystalConfig,
  resetCrystalConfig,
} from '../../game/crystalConfig';
import { togglePause, ensureInspectCrystals } from '../../game/state';

export function GameInspector() {
  const config = useCrystalConfig();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const payload = JSON.stringify(config, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(payload);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [config]);

  const handleSpawnAhead = useCallback(() => {
    ensureInspectCrystals();
  }, []);

  return (
    <aside
      className="inspector-panel"
      role="region"
      aria-label="Game Inspector"
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.code === 'KeyF' || e.key === 'f' || e.key === 'F' || e.code === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          togglePause();
        }
      }}
    >
      {/* Header Bar */}
      <div className="inspector-header">
        <div className="inspector-title-row">
          <div className="inspector-icon-badge coin-badge">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
              <circle cx="12" cy="12" r="10" fill="#f59e0b" stroke="#fef08a" strokeWidth="1.2" />
              <circle cx="12" cy="12" r="8" fill="#eab308" stroke="#92400e" strokeWidth="0.8" />
              <path
                d="M12 7 L13.4 10.2 L17 10.6 L14.4 13.1 L15.1 16.6 L12 14.8 L8.9 16.6 L9.6 13.1 L7 10.6 L10.6 10.2 Z"
                fill="#fffbeb"
                stroke="#d97706"
                strokeWidth="0.5"
              />
              <path
                d="M6 8 A8 8 0 0 1 16 4.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </svg>
          </div>
          <div className="inspector-title-text">
            <span className="inspector-title">Gold Coin Inspector</span>
            <span className="inspector-badge">PAUSED • COIN TWEAKER</span>
          </div>
        </div>
        <button
          className="inspector-close-btn"
          onClick={togglePause}
          title="Resume game (Press F or Esc)"
          aria-label="Close Inspector"
        >
          ✕
        </button>
      </div>

      <div className="inspector-scroll-body">
        <p className="inspector-tip">
          Inspect gold coins in real-time. Drag sliders to adjust coin size and 3D rotation. Press{' '}
          <kbd className="inspector-kbd">F</kbd> or <kbd className="inspector-kbd">Esc</kbd> anytime to resume.
        </p>

        {/* 1. Size / Scale Slider */}
        <div className="inspector-control-group">
          <div className="inspector-label-row">
            <span className="inspector-label">
              <span className="inspector-axis-tag scale-tag">SIZE</span> Scale Multiplier
            </span>
            <span className="inspector-value-badge">{config.scale.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="3.0"
            step="0.05"
            value={config.scale}
            onChange={(e) => setCrystalConfig({ scale: parseFloat(e.target.value) })}
            className="inspector-slider"
          />
          <div className="inspector-presets-row">
            {[0.5, 0.75, 1.0, 1.35, 1.75, 2.2].map((val) => (
              <button
                key={val}
                type="button"
                className={`inspector-preset-btn ${Math.abs(config.scale - val) < 0.02 ? 'active' : ''}`}
                onClick={() => setCrystalConfig({ scale: val })}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* 2. Rotation X Slider */}
        <div className="inspector-control-group">
          <div className="inspector-label-row">
            <span className="inspector-label">
              <span className="inspector-axis-tag x-tag">X</span> Pitch / Tilt
            </span>
            <span className="inspector-value-badge">{config.rotX}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={config.rotX}
            onChange={(e) => setCrystalConfig({ rotX: parseInt(e.target.value, 10) })}
            className="inspector-slider x-slider"
          />
          <div className="inspector-presets-row">
            {[-90, -45, 0, 7, 45, 90].map((val) => (
              <button
                key={val}
                type="button"
                className={`inspector-preset-btn ${config.rotX === val ? 'active' : ''}`}
                onClick={() => setCrystalConfig({ rotX: val })}
              >
                {val}°
              </button>
            ))}
          </div>
        </div>

        {/* 3. Rotation Y Slider */}
        <div className="inspector-control-group">
          <div className="inspector-label-row">
            <span className="inspector-label">
              <span className="inspector-axis-tag y-tag">Y</span> Yaw / Turn
            </span>
            <span className="inspector-value-badge">{config.rotY}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={config.rotY}
            onChange={(e) => setCrystalConfig({ rotY: parseInt(e.target.value, 10) })}
            className="inspector-slider y-slider"
          />
          <div className="inspector-presets-row">
            {[-90, -45, 0, 45, 90, 180].map((val) => (
              <button
                key={val}
                type="button"
                className={`inspector-preset-btn ${config.rotY === val ? 'active' : ''}`}
                onClick={() => setCrystalConfig({ rotY: val })}
              >
                {val}°
              </button>
            ))}
          </div>
        </div>

        {/* 4. Rotation Z Slider */}
        <div className="inspector-control-group">
          <div className="inspector-label-row">
            <span className="inspector-label">
              <span className="inspector-axis-tag z-tag">Z</span> Roll / Lean
            </span>
            <span className="inspector-value-badge">{config.rotZ}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={config.rotZ}
            onChange={(e) => setCrystalConfig({ rotZ: parseInt(e.target.value, 10) })}
            className="inspector-slider z-slider"
          />
          <div className="inspector-presets-row">
            {[-90, -45, 0, 45, 90, 180].map((val) => (
              <button
                key={val}
                type="button"
                className={`inspector-preset-btn ${config.rotZ === val ? 'active' : ''}`}
                onClick={() => setCrystalConfig({ rotZ: val })}
              >
                {val}°
              </button>
            ))}
          </div>
        </div>

        {/* 5. Elevation / Height Offset */}
        <div className="inspector-control-group">
          <div className="inspector-label-row">
            <span className="inspector-label">
              <span className="inspector-axis-tag h-tag">H</span> Height Offset
            </span>
            <span className="inspector-value-badge">
              {config.heightOffset >= 0 ? `+${config.heightOffset.toFixed(2)}` : config.heightOffset.toFixed(2)}m
            </span>
          </div>
          <input
            type="range"
            min="-1.0"
            max="1.5"
            step="0.05"
            value={config.heightOffset}
            onChange={(e) => setCrystalConfig({ heightOffset: parseFloat(e.target.value) })}
            className="inspector-slider"
          />
          <div className="inspector-presets-row">
            {[-0.3, 0.0, 0.25, 0.5, 0.8].map((val) => (
              <button
                key={val}
                type="button"
                className={`inspector-preset-btn ${Math.abs(config.heightOffset - val) < 0.02 ? 'active' : ''}`}
                onClick={() => setCrystalConfig({ heightOffset: val })}
              >
                {val >= 0 ? `+${val}` : val}m
              </button>
            ))}
          </div>
        </div>

        {/* 6. Auto-Spin Switch */}
        <label className="inspector-switch-row">
          <input
            type="checkbox"
            checked={config.autoSpin}
            onChange={(e) => setCrystalConfig({ autoSpin: e.target.checked })}
            className="inspector-checkbox"
          />
          <div className="inspector-switch-text">
            <span className="inspector-switch-title">Auto-Spin Idle Animation</span>
            <span className="inspector-switch-desc">Spin gold coin smoothly while running</span>
          </div>
        </label>

        {/* Actions Bar */}
        <div className="inspector-actions-grid">
          <button
            type="button"
            className="inspector-action-btn secondary"
            onClick={handleSpawnAhead}
            title="Place gold coins 5m ahead on the track for inspection"
          >
            ✦ Spawn Ahead
          </button>
          <button
            type="button"
            className="inspector-action-btn secondary"
            onClick={resetCrystalConfig}
            title="Restore original default transform"
          >
            ↺ Defaults
          </button>
          <button
            type="button"
            className="inspector-action-btn secondary copy-btn"
            onClick={handleCopy}
            title="Copy current transform values to clipboard"
          >
            {copied ? '✓ Copied!' : '📋 Copy JSON'}
          </button>
        </div>
      </div>

      {/* Footer Resume Button */}
      <div className="inspector-footer">
        <button
          type="button"
          className="inspector-resume-btn"
          onClick={togglePause}
          title="Resume game (Press F)"
        >
          <span className="resume-icon">▶</span>
          <span className="resume-text">Resume Game</span>
          <kbd className="resume-kbd">[F]</kbd>
        </button>
      </div>
    </aside>
  );
}
