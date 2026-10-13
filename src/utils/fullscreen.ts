/**
 * Requests full screen on the document element with cross-browser vendor support.
 * Safe to call inside user interaction events (e.g. click/tap).
 */
export function requestFullscreen() {
  try {
    if (document.fullscreenElement) return;
    const docEl = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
      mozRequestFullScreen?: () => Promise<void> | void;
      msRequestFullscreen?: () => Promise<void> | void;
    };
    if (typeof docEl.requestFullscreen === 'function') {
      docEl.requestFullscreen().catch(() => {});
    } else if (typeof docEl.webkitRequestFullscreen === 'function') {
      docEl.webkitRequestFullscreen();
    } else if (typeof docEl.mozRequestFullScreen === 'function') {
      docEl.mozRequestFullScreen();
    } else if (typeof docEl.msRequestFullscreen === 'function') {
      docEl.msRequestFullscreen();
    }
  } catch {
    // Ignore if not permitted or supported
  }
}
