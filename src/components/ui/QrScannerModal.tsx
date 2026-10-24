import { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { popularApi } from '../../services/popularApi';

interface QrScannerModalProps {
  onClose: () => void;
  onSuccess: (token: string, lives: number) => void;
}

export function QrScannerModal({ onClose, onSuccess }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationFeedback, setVerificationFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  /** Helper to extract a token string from a URL or raw QR text */
  const parseTokenFromRawText = (raw: string): string => {
    const text = raw.trim();
    try {
      if (text.includes('?')) {
        const query = text.includes('://') ? new URL(text).search : text.slice(text.indexOf('?'));
        const params = new URLSearchParams(query);
        const token = params.get('token') || params.get('t');
        if (token && token.trim()) return token.trim().toUpperCase();
      }
    } catch {
      /* ignore URL parsing */
    }

    const match = text.match(/[?&](?:token|t)=([^&#\s]+)/i);
    if (match && match[1]) {
      return match[1].trim().toUpperCase();
    }

    return text.toUpperCase();
  };

  /** Handles token verification after auto-detection from camera */
  const handleProcessToken = useCallback(
    async (rawCode: string) => {
      const cleanToken = parseTokenFromRawText(rawCode);
      if (!cleanToken) return;

      setIsVerifying(true);
      setVerificationFeedback({
        type: 'info',
        message: `Verifying token "${cleanToken}"...`,
      });

      try {
        const res = await popularApi.verifyToken(cleanToken);
        if (res.valid) {
          // Play subtle haptic feedback if supported on mobile
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(80);
            } catch {
              /* ignore */
            }
          }

          popularApi.setActiveToken(cleanToken);
          setVerificationFeedback({
            type: 'success',
            message: `✅ Token Verified: ${cleanToken} (${res.livesRemaining}/3 Lives Unlocked!)`,
          });

          setTimeout(() => {
            onSuccess(cleanToken, res.livesRemaining);
            onClose();
          }, 700);
        } else {
          setVerificationFeedback({
            type: 'error',
            message: `❌ ${res.message || 'Invalid QR code. Please scan an official showroom QR code.'}`,
          });
          // Allow scanning again after 2 seconds
          setTimeout(() => {
            setIsVerifying(false);
            setVerificationFeedback(null);
          }, 2200);
        }
      } catch {
        setVerificationFeedback({
          type: 'error',
          message: 'Network error checking token. Please point camera at the QR code again.',
        });
        setTimeout(() => {
          setIsVerifying(false);
          setVerificationFeedback(null);
        }, 2200);
      }
    },
    [onSuccess, onClose],
  );

  /** Camera frame scanning loop using jsQR */
  const scanFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || isVerifying) {
      animFrameIdRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        handleProcessToken(code.data);
        return; // Pause scanning while verifying
      }
    }

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  }, [handleProcessToken, isVerifying]);

  /** Start camera stream */
  useEffect(() => {
    let isMounted = true;

    async function initCamera() {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported on this browser or device.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });

        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
          animFrameIdRef.current = requestAnimationFrame(scanFrame);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera permission not granted. Please allow camera access to scan.';
        setCameraError(msg);
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [scanFrame]);

  return (
    <div className="home-modal-backdrop" onClick={onClose}>
      <div className="home-modal-card qr-scanner-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="home-modal-header">
          <div className="home-modal-title-row">
            <span className="home-modal-icon">📷</span>
            <div>
              <h2 className="home-modal-title">QR CODE SCANNER</h2>
              <div className="home-modal-brand-tag">POPULAR ELECTRICALS • AUTO-SCAN</div>
            </div>
          </div>
          <button
            type="button"
            className="home-modal-close-btn"
            onClick={onClose}
            aria-label="Close Scanner"
          >
            ✕
          </button>
        </div>

        {/* Scanner Viewfinder / Camera Container */}
        <div className="qr-scanner-body">
          <div className="qr-scanner-viewfinder-frame">
            {cameraActive && !cameraError ? (
              <>
                <video ref={videoRef} className="qr-camera-video" muted playsInline />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Laser scan animation & Cyber Corners */}
                <div className="qr-viewfinder-target">
                  <div className="qr-corner top-left" />
                  <div className="qr-corner top-right" />
                  <div className="qr-corner bottom-left" />
                  <div className="qr-corner bottom-right" />
                  <div className="qr-laser-line" />
                </div>

                <div className="qr-scan-hud-pill">
                  <span className="qr-hud-pulse" />
                  <span>Align Showroom QR inside frame</span>
                </div>
              </>
            ) : (
              <div className="qr-camera-fallback-panel">
                <div className="qr-fallback-icon">📷</div>
                <h4 className="qr-fallback-title">Camera Access Required</h4>
                <p className="qr-fallback-desc">
                  {cameraError || 'Starting camera stream...'}
                </p>
                <p className="qr-camera-help">
                  Please allow camera permissions in your browser to auto-scan showroom QR tokens.
                </p>
              </div>
            )}
          </div>

          {/* Verification feedback banner */}
          {verificationFeedback && (
            <div className={`qr-feedback-banner ${verificationFeedback.type}`}>
              {verificationFeedback.message}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="home-modal-footer">
          <button type="button" className="home-modal-action-btn" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
