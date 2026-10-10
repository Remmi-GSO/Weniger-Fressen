import type { RecipeCategory } from '../db/db';

export interface CommunityRecipe {
  id: string;
  name: string;
  author: string;
  authorRole?: string;
  authorAvatarUrl?: string; // Profilbild oder Avatar des Autors
  category: RecipeCategory;
  imageUrl?: string;
  prepTimeMinutes?: number;
  totalRawWeight: number;
  cookedWeight: number;
  servingName: string;
  servingWeightGrams: number;
  calories100g: number;
  protein100g: number;
  carbs100g: number;
  fat100g: number;
  totalCalories: number;
  tags?: string[];
  description?: string;
  ingredients: Array<{
    name: string;
    amountGrams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  instructions: string[];
}

const SEEN_RECIPES_KEY = 'weniger_fressen_seen_community_recipes_v2';
const HIDDEN_COMMUNITY_RECIPES_KEY = 'weniger_fressen_hidden_community_recipes_v1';
const NOTIFICATIONS_ENABLED_KEY = 'weniger_fressen_community_notifications_enabled';

/**
 * Loads the set of community recipe IDs that this device has already acknowledged/seen.
 */
export function getSeenCommunityRecipeIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_RECIPES_KEY);
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Saves a community recipe ID as seen/acknowledged.
 */
export function markCommunityRecipeAsSeen(recipeId: string): void {
  try {
    const seen = getSeenCommunityRecipeIds();
    seen.add(recipeId);
    localStorage.setItem(SEEN_RECIPES_KEY, JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.warn('Could not save seen community recipe', err);
  }
}

/**
 * Marks all given community recipe IDs as seen.
 */
export function markAllCommunityRecipesAsSeen(recipeIds: string[]): void {
  try {
    const seen = getSeenCommunityRecipeIds();
    recipeIds.forEach((id) => seen.add(id));
    localStorage.setItem(SEEN_RECIPES_KEY, JSON.stringify(Array.from(seen)));
  } catch (err) {
    console.warn('Could not save seen community recipes', err);
  }
}

/**
 * Loads the set of community recipe IDs that this user/device has chosen to hide.
 */
export function getHiddenCommunityRecipeIds(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_COMMUNITY_RECIPES_KEY);
    if (!raw) return new Set();
    const parsed: string[] = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

/**
 * Hides a community recipe for this user.
 */
export function hideCommunityRecipe(recipeId: string): void {
  try {
    const hidden = getHiddenCommunityRecipeIds();
    hidden.add(recipeId);
    localStorage.setItem(HIDDEN_COMMUNITY_RECIPES_KEY, JSON.stringify(Array.from(hidden)));
  } catch (err) {
    console.warn('Could not save hidden community recipe', err);
  }
}

/**
 * Restores / unhides a specific community recipe.
 */
export function unhideCommunityRecipe(recipeId: string): void {
  try {
    const hidden = getHiddenCommunityRecipeIds();
    hidden.delete(recipeId);
    localStorage.setItem(HIDDEN_COMMUNITY_RECIPES_KEY, JSON.stringify(Array.from(hidden)));
  } catch (err) {
    console.warn('Could not unhide community recipe', err);
  }
}

/**
 * Resets all hidden community recipes.
 */
export function resetHiddenCommunityRecipes(): void {
  try {
    localStorage.removeItem(HIDDEN_COMMUNITY_RECIPES_KEY);
  } catch (err) {
    console.warn('Could not reset hidden community recipes', err);
  }
}

/**
 * Checks if browser push / web notifications are permitted and enabled by user.
 */
export function isBrowserNotificationEnabled(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  return Notification.permission === 'granted' && localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false';
}

/**
 * Requests browser permission for notifications.
 */
export async function requestCommunityNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;
  try {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');
      return true;
    }
  } catch (e) {
    console.warn('Permission request error:', e);
  }
  return false;
}

/**
 * Sends an OS / browser notification for a newly detected recipe.
 */
export function sendCommunityRecipeNotification(recipe: CommunityRecipe): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    const options: NotificationOptions = {
      body: `„${recipe.name}“ von ${recipe.author} (${recipe.calories100g} kcal/100g) steht jetzt zum Importieren bereit!`,
      icon: recipe.authorAvatarUrl || '/icon-192.png',
      badge: '/icon-192.png',
      tag: `community-recipe-${recipe.id}`,
    };
    new Notification('Neues Community-Rezept! 🎉', options);
  } catch (err) {
    console.warn('Could not send system notification', err);
  }
}

/**
 * Fetches the latest community recipes from public/data/community-recipes.json,
 * adding cache-busting to bypass stale browser cache immediately.
 */
export async function fetchCommunityRecipes(): Promise<CommunityRecipe[]> {
  try {
    const res = await fetch(`./data/community-recipes.json?t=${Date.now()}`);
    if (!res.ok) return [];
    const data: CommunityRecipe[] = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Could not fetch community recipes:', err);
    return [];
  }
}
