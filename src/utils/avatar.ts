import { compressImage } from './imageCompress';

export const AVATAR_PRESETS = [
  { emoji: '👨‍🍳', label: 'Chefkoch' },
  { emoji: '👩‍🍳', label: 'Bäckerin' },
  { emoji: '🧑‍🍳', label: 'Hobbykoch' },
  { emoji: '💪', label: 'Fitness' },
  { emoji: '👵', label: 'Oma-Küche' },
  { emoji: '🧙‍♀️', label: 'Magie' },
  { emoji: '🥑', label: 'Avocado' },
  { emoji: '🥗', label: 'Salat' },
  { emoji: '🍰', label: 'Kuchen' },
  { emoji: '🥖', label: 'Brot' },
  { emoji: '🥨', label: 'Brezel' },
  { emoji: '🍕', label: 'Pizza' },
  { emoji: '☕', label: 'Kaffee' },
  { emoji: '🦊', label: 'Fuchs' },
  { emoji: '🐻', label: 'Bär' },
  { emoji: '🦁', label: 'Löwe' },
];

/**
 * Creates an inline SVG Data URL representing a circular avatar
 * with an emoji or initial in the center on a pastel/gradient background.
 */
export function generateAvatarSvg(textOrEmoji: string, bgHue?: number): string {
  // If no hue provided, derive one deterministically from the string
  let hue = bgHue;
  if (hue === undefined) {
    let hash = 0;
    for (let i = 0; i < textOrEmoji.length; i++) {
      hash = textOrEmoji.charCodeAt(i) + ((hash << 5) - hash);
    }
    hue = Math.abs(hash) % 360;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue}, 85%, 65%)" />
        <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 80%, 45%)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="50" fill="url(#grad)" />
    <text x="50" y="58" font-size="48" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">
      ${textOrEmoji}
    </text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Helper to compress an uploaded image specifically for profile pictures (max 240x240, high quality).
 */
export async function compressProfilePhoto(file: File): Promise<string> {
  const result = await compressImage(file, 240, 0.85);
  return result.previewUrl;
}

/**
 * Resolves an author avatar URL.
 * If author has an avatarUrl (photo or svg), returns it.
 * Otherwise, generates a deterministic SVG avatar with author initials.
 */
export function getAuthorAvatar(authorName: string, avatarUrl?: string): string {
  if (avatarUrl && avatarUrl.trim().length > 0) {
    return avatarUrl;
  }
  const cleanName = (authorName || 'Du').trim();
  const initial = cleanName.charAt(0).toUpperCase() || '👤';
  return generateAvatarSvg(initial);
}
