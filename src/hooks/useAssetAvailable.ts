import { useEffect, useState } from 'react';

/**
 * Checks that a .glb really exists and returns a valid file.
 * Handles production CDNs and hosting environments that might not support Range requests (returning 200, 206, or failing Range).
 */
export function useAssetAvailable(url: string): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAsset() {
      try {
        // First try HEAD or partial Range request
        const res = await fetch(url, { headers: { Range: 'bytes=0-3' } });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf.byteLength >= 4) {
            const magic = new TextDecoder().decode(new Uint8Array(buf).slice(0, 4));
            if (magic === 'glTF') {
              if (!cancelled) setAvailable(true);
              return;
            }
          }
          // If range wasn't respected and server gave 200 with full file or something else, check first 4 bytes
          const magic = new TextDecoder().decode(new Uint8Array(buf).slice(0, 4));
          if (magic === 'glTF') {
            if (!cancelled) setAvailable(true);
            return;
          }
        }

        // Fallback: standard fetch if range failed or gave unexpected response
        const fallbackRes = await fetch(url);
        if (fallbackRes.ok) {
          const reader = fallbackRes.body?.getReader();
          if (reader) {
            const { value } = await reader.read();
            if (value && value.length >= 4) {
              const magic = new TextDecoder().decode(value.slice(0, 4));
              if (magic === 'glTF') {
                reader.cancel();
                if (!cancelled) setAvailable(true);
                return;
              }
            }
            reader.cancel();
          }
        }
        if (!cancelled) setAvailable(false);
      } catch (err) {
        console.warn(`[useAssetAvailable] Check failed for ${url}:`, err);
        // On network check error, allow Suspense / ErrorBoundary to attempt loading directly
        if (!cancelled) setAvailable(true);
      }
    }

    checkAsset();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return available;
}

