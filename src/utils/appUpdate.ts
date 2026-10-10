import { db } from '../db/db';

/**
 * Helper to update the PWA / web application:
 * Updates all service worker registrations, purges browser caches,
 * and reloads the application with the latest build.
 */
export async function triggerAppUpdate(): Promise<void> {
  try {
    // 1. Double-protect profile & avatar in localStorage before any cache purge / reload
    try {
      const prof = await db.userProfile.get('current');
      if (prof?.avatarUrl) {
        localStorage.setItem('weniger_fressen_avatar_backup', prof.avatarUrl);
      }
    } catch (e) {
      console.warn('Could not backup avatar before update reload:', e);
    }

    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.update();
      }
    }
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }
  } catch (err) {
    console.warn('App update cache clearing warning:', err);
  } finally {
    // Reload from server
    window.location.reload();
  }
}
