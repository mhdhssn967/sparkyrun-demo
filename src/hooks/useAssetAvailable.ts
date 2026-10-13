import { useEffect, useState } from 'react';
/**
 * Checks that a .glb really exists (dev servers happily answer 200 + index.html for missing files).
 * Returns null while checking, then true/false.
 */
export function useAssetAvailable(url: string): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch(url, { headers: { Range: 'bytes=0-3' } })
      .then(async (res) => {
        if (!res.ok) return false;
        const magic = new TextDecoder().decode(new Uint8Array(await res.arrayBuffer()).slice(0, 4));
        return magic === 'glTF';
      })
      .catch(() => false)
      .then((ok) => {
        if (!cancelled) setAvailable(ok);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);
  return available;
}
