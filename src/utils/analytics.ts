/**
 * Analytics & Active User Tracking Utility
 *
 * Transmits the registered user name, daily calories target, and approximate
 * location (city/region) as a GoatCounter Custom Event so the app owner can view
 * active users at https://weniger-fressen.goatcounter.com/ under "Events".
 */

/**
 * Silently retrieves approximate city and region via lightweight IP lookup (no browser popup).
 * Cached in sessionStorage for the duration of the session so it only requests once.
 */
async function getApproximateLocation(): Promise<string | null> {
  if (typeof window === 'undefined') return null;

  const cacheKey = 'weniger_fressen_approx_location';
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // sessionStorage blocked or unavailable
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const parts: string[] = [];
        if (data.city) parts.push(data.city);
        if (data.region && data.region !== data.city) parts.push(data.region);
        if (data.country_code) parts.push(data.country_code);

        const locStr = parts.join(', ');
        if (locStr) {
          try {
            sessionStorage.setItem(cacheKey, locStr);
          } catch {
            // ignore
          }
          return locStr;
        }
      }
    }
  } catch {
    // Network offline, timeout or blocked: silently return null
  }

  return null;
}

/**
 * Sends a custom event with user name, target calories, and approximate location
 * to GoatCounter once per session.
 */
export function trackUserActivity(userName?: string, targetCalories?: number): void {
  if (typeof window === 'undefined') return;

  const rawName = userName ? userName.trim() : '';
  const cleanName = rawName && rawName !== 'Du' ? rawName : 'Standard-Du';

  const cleanSlug = cleanName
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const kcalNum = targetCalories && targetCalories > 0 ? Math.round(targetCalories) : null;
  const kcalSlug = kcalNum ? `-${kcalNum}kcal` : '';

  // GoatCounter event path: URL-safe identifier (e.g. "nutzer-remmi-1800kcal")
  const pathSafe = `nutzer-${cleanSlug}${kcalSlug}`;

  const sessionKey = 'weniger_fressen_gc_user_session';
  try {
    const alreadyTracked = sessionStorage.getItem(sessionKey);
    if (alreadyTracked === pathSafe) {
      // Already tracked this session for this user + calories combination
      return;
    }
  } catch {
    // sessionStorage not available (strict private mode)
  }

  // Fetch location in background and then send GoatCounter event
  getApproximateLocation().then((location) => {
    const kcalDisplay = kcalNum ? ` (${kcalNum.toLocaleString('de-DE')} kcal/Tag)` : '';
    const locDisplay = location ? ` • Ort: ${location}` : '';
    const title = `Nutzer: ${cleanName}${kcalDisplay}${locDisplay}`;

    const sendEvent = (): boolean => {
      const gc = (window as unknown as { goatcounter?: { count?: (opts: unknown) => void } }).goatcounter;
      if (gc && typeof gc.count === 'function') {
        try {
          gc.count({
            path: pathSafe,
            title,
            event: true,
          });

          try {
            sessionStorage.setItem(sessionKey, pathSafe);
          } catch {
            // ignore
          }
          return true;
        } catch (err) {
          console.warn('[Analytics] GoatCounter count error:', err);
        }
      }
      return false;
    };

    // Try immediately
    if (!sendEvent()) {
      // count.js is loaded asynchronously with <script async>, retry periodically
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (sendEvent() || attempts >= 20) {
          clearInterval(interval);
        }
      }, 500);
    }
  });
}
