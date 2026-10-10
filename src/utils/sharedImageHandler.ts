/**
 * Utility for retrieving images received via Web Share Target API.
 */
export async function checkAndRetrieveSharedImage(): Promise<string | null> {
  if (typeof window === 'undefined' || !('caches' in window)) return null;

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const hasParam = urlParams.has('received-share');

    // Clean up URL query param so a page refresh doesn't re-trigger
    if (hasParam) {
      urlParams.delete('received-share');
      const newSearch = urlParams.toString();
      const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }

    const cache = await caches.open('weniger-fressen-shared-v1');
    const response = await cache.match('shared-image');
    if (!response) return null;

    const blob = await response.blob();
    // Delete from cache so it's only processed once
    await cache.delete('shared-image');

    if (blob.size === 0) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        resolve(null);
      };
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('Could not retrieve shared image from cache', err);
    return null;
  }
}
