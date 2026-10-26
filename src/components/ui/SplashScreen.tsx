import { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import { LoadingManager } from 'three';

interface SplashScreenProps {
  onLoaded?: () => void;
}

export function SplashScreen({ onLoaded }: SplashScreenProps) {
  // Track drei assets (GLTF models, loaders, etc.)
  const { progress: dreiProgress, active: dreiActive } = useProgress();

  // Internal smooth progress value from 0 to 100
  const [visualProgress, setVisualProgress] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);

  // Monitor Three.js DefaultLoadingManager as well
  const [threeProgress, setThreeProgress] = useState(0);

  useEffect(() => {
    // Intercept DefaultLoadingManager progress
    const prevOnProgress = LoadingManager.prototype.onProgress;
    const prevOnLoad = LoadingManager.prototype.onLoad;

    const manager = (window as unknown as { THREE?: { DefaultLoadingManager: LoadingManager } }).THREE?.DefaultLoadingManager;

    if (manager) {
      manager.onProgress = (_url, loaded, total) => {
        if (total > 0) {
          setThreeProgress(Math.min(100, Math.round((loaded / total) * 100)));
        }
      };
      manager.onLoad = () => {
        setThreeProgress(100);
      };
    }

    return () => {
      if (manager) {
        manager.onProgress = prevOnProgress;
        manager.onLoad = prevOnLoad;
      }
    };
  }, []);

  useEffect(() => {
    // Progress calculation combining Drei loader, Three manager, and safety ramp-up
    const interval = setInterval(() => {
      setVisualProgress((prev) => {
        const rawTarget = Math.max(dreiProgress, threeProgress);

        let next = prev;
        if (rawTarget > prev) {
          // Accelerate towards actual loaded percentage
          next = prev + Math.max(1, (rawTarget - prev) * 0.25);
        } else if (prev < 90) {
          // Gradual realistic increment while initializing shaders / buffers
          next = prev + (prev < 50 ? 1.5 : 0.6);
        }

        // When Drei finishes loading (dreiActive is false or progress is 100)
        if ((dreiProgress >= 100 || !dreiActive) && next >= 90) {
          next = 100;
        }

        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsFinished(true);
            onLoaded?.();
            setTimeout(() => {
              setShouldRender(false);
            }, 600); // Wait for fade-out transition
          }, 350);
          return 100;
        }

        return Math.min(99.5, next);
      });
    }, 35);

    // Hard ceiling fallback in case assets resolve instantaneously or offline
    const fallbackTimer = setTimeout(() => {
      setVisualProgress(100);
      setTimeout(() => {
        setIsFinished(true);
        onLoaded?.();
        setTimeout(() => setShouldRender(false), 600);
      }, 300);
    }, 7000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimer);
    };
  }, [dreiProgress, dreiActive, threeProgress, onLoaded]);

  if (!shouldRender) return null;

  const displayPercent = Math.min(100, Math.floor(visualProgress));

  return (
    <div
      className={`popular-splash-screen ${isFinished ? 'splash-fade-out' : ''}`}
      aria-label="Loading"
      role="progressbar"
      aria-valuenow={displayPercent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Center Brand Content */}
      <div className="splash-center-content">
        {/* White PET Logo */}
        <div className="splash-logo-container">
          <img
            src="/pet_logo_white.png"
            alt="Popular Electricals"
            className="splash-pet-logo"
            width={329}
            height={263}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/pet_logo_red.png';
            }}
          />
        </div>

        {/* Minimal Clean Progress Bar without text or % */}
        <div className="splash-progress-wrapper">
          <div className="splash-progress-track">
            <div
              className="splash-progress-bar"
              style={{ width: `${displayPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
