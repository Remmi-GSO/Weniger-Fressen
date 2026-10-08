import { db } from '../db/db';

export interface BackupSummary {
  profileCount: number;
  diaryCount: number;
  waterCount: number;
  weightCount: number;
  fastingCount: number;
  recipeCount: number;
  favoriteCount: number;
  activityCount: number;
  customActivityCount: number;
  earliestDate?: string;
  latestDate?: string;
}

export interface BackupInspectionResult {
  isValid: boolean;
  error?: string;
  exportDate?: string;
  summary: BackupSummary;
  newItemsCount: {
    diary: number;
    water: number;
    weights: number;
    recipes: number;
    activities: number;
    fasts: number;
    favorites: number;
  };
  newRecipeNames: string[];
  latestWeight?: number;
  rawBackupData: any;
}

export interface MergeResult {
  addedDiaryEntries: number;
  addedWaterLogs: number;
  addedWeightLogs: number;
  addedRecipes: number;
  addedActivities: number;
  addedFastingSessions: number;
  mergedFavorites: number;
}

/**
 * Creates a complete JSON backup object of all local tables.
 */
export async function createBackupData(): Promise<{ backupJson: string; fileName: string; summary: BackupSummary }> {
  const profile = await db.userProfile.toArray();
  const diary = await db.diaryEntries.toArray();
  const water = await db.waterLogs.toArray();
  const weights = await db.weightLogs.toArray();
  const fasts = await db.fastingSessions.toArray();
  const recipes = await db.recipes.toArray();
  const favoriteItems = await db.favoriteItems.toArray();
  const activityLogs = await db.activityLogs.toArray();
  const customActivities = await db.customActivities.toArray();

  const dates = diary.map((d) => d.date).filter(Boolean).sort();
  const earliestDate = dates[0];
  const latestDate = dates[dates.length - 1];

  const summary: BackupSummary = {
    profileCount: profile.length,
    diaryCount: diary.length,
    waterCount: water.length,
    weightCount: weights.length,
    fastingCount: fasts.length,
    recipeCount: recipes.length,
    favoriteCount: favoriteItems.length,
    activityCount: activityLogs.length,
    customActivityCount: customActivities.length,
    earliestDate,
    latestDate,
  };

  const backup = {
    version: 3,
    appName: 'Weniger Fressen',
    exportDate: new Date().toISOString(),
    summary,
    data: {
      profile,
      diary,
      water,
      weights,
      fasts,
      recipes,
      favoriteItems,
      activityLogs,
      customActivities,
    },
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const fileName = `weniger-fressen-sicherung-${todayStr}.json`;
  const backupJson = JSON.stringify(backup, null, 2);

  return { backupJson, fileName, summary };
}

/**
 * Exports backup file: uses native share sheet (WhatsApp, Messenger, Drive) if supported,
 * otherwise triggers browser file download.
 */
export async function exportAndShareBackup(): Promise<{ method: 'share' | 'download'; fileName: string }> {
  const { backupJson, fileName } = await createBackupData();
  const blob = new Blob([backupJson], { type: 'application/json' });

  // Try Native Share with File (AirDrop, WhatsApp, Google Drive)
  if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Weniger Fressen Datensicherung',
          text: `Hier ist die Datensicherung von Weniger Fressen (${fileName}).`,
          files: [file],
        });
        return { method: 'share', fileName };
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return { method: 'share', fileName };
      }
      // If native file share failed, fallback to download
    }
  }

  // Fallback: Direct file download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return { method: 'download', fileName };
}

/**
 * Inspects an incoming JSON backup string and calculates exactly what's new vs what already exists.
 */
export async function inspectBackupFile(fileContent: string): Promise<BackupInspectionResult> {
  try {
    const parsed = JSON.parse(fileContent);
    const data = parsed.data || parsed;

    if (!data || typeof data !== 'object') {
      return {
        isValid: false,
        error: 'Ungültiges Dateiformat. Keine Anwendungsdaten gefunden.',
        summary: getEmptySummary(),
        newItemsCount: getEmptyNewCounts(),
        newRecipeNames: [],
        rawBackupData: null,
      };
    }

    const diaryList: any[] = Array.isArray(data.diary) ? data.diary : [];
    const waterList: any[] = Array.isArray(data.water) ? data.water : [];
    const weightList: any[] = Array.isArray(data.weights) ? data.weights : [];
    const recipeList: any[] = Array.isArray(data.recipes) ? data.recipes : [];
    const activityList: any[] = Array.isArray(data.activityLogs) ? data.activityLogs : [];
    const fastList: any[] = Array.isArray(data.fasts) ? data.fasts : [];
    const favoriteList: any[] = Array.isArray(data.favoriteItems) ? data.favoriteItems : [];

    const existingDiary = await db.diaryEntries.toArray();
    const existingWater = await db.waterLogs.toArray();
    const existingWeights = await db.weightLogs.toArray();
    const existingRecipes = await db.recipes.toArray();
    const existingActivities = await db.activityLogs.toArray();
    const existingFasts = await db.fastingSessions.toArray();

    // Check new diary entries (deduplicate by date, mealType, name, timestamp)
    const newDiary = diaryList.filter(
      (inItem) =>
        !existingDiary.some(
          (ex) =>
            ex.date === inItem.date &&
            ex.mealType === inItem.mealType &&
            ex.name === inItem.name &&
            Math.abs((ex.timestamp || 0) - (inItem.timestamp || 0)) < 5000
        )
    );

    // Check new water logs
    const newWater = waterList.filter(
      (inItem) =>
        !existingWater.some(
          (ex) =>
            ex.date === inItem.date &&
            Math.abs((ex.timestamp || 0) - (inItem.timestamp || 0)) < 3000
        )
    );

    // Check new weights
    const newWeights = weightList.filter(
      (inItem) =>
        !existingWeights.some(
          (ex) =>
            ex.date === inItem.date &&
            Math.abs((ex.timestamp || 0) - (inItem.timestamp || 0)) < 5000
        )
    );

    // Check new recipes
    const newRecipes = recipeList.filter(
      (inItem) =>
        !existingRecipes.some(
          (ex) => ex.name.trim().toLowerCase() === String(inItem.name || '').trim().toLowerCase()
        )
    );

    // Check new activities
    const newActivities = activityList.filter(
      (inItem) =>
        !existingActivities.some(
          (ex) =>
            ex.date === inItem.date &&
            ex.activityId === inItem.activityId &&
            Math.abs((ex.timestamp || 0) - (inItem.timestamp || 0)) < 5000
        )
    );

    // Check new fasts
    const newFasts = fastList.filter(
      (inItem) =>
        !existingFasts.some(
          (ex) => Math.abs((ex.startTime || 0) - (inItem.startTime || 0)) < 5000
        )
    );

    const dates = diaryList.map((d) => d.date).filter(Boolean).sort();
    const sortedWeights = [...weightList].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const summary: BackupSummary = {
      profileCount: Array.isArray(data.profile) ? data.profile.length : 0,
      diaryCount: diaryList.length,
      waterCount: waterList.length,
      weightCount: weightList.length,
      fastingCount: fastList.length,
      recipeCount: recipeList.length,
      favoriteCount: favoriteList.length,
      activityCount: activityList.length,
      customActivityCount: Array.isArray(data.customActivities) ? data.customActivities.length : 0,
      earliestDate: dates[0],
      latestDate: dates[dates.length - 1],
    };

    return {
      isValid: true,
      exportDate: parsed.exportDate,
      summary,
      newItemsCount: {
        diary: newDiary.length,
        water: newWater.length,
        weights: newWeights.length,
        recipes: newRecipes.length,
        activities: newActivities.length,
        fasts: newFasts.length,
        favorites: favoriteList.length,
      },
      newRecipeNames: newRecipes.map((r) => r.name),
      latestWeight: sortedWeights[0]?.weight,
      rawBackupData: data,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: 'Die Datei konnte nicht als JSON gelesen werden.',
      summary: getEmptySummary(),
      newItemsCount: getEmptyNewCounts(),
      newRecipeNames: [],
      rawBackupData: null,
    };
  }
}

/**
 * Intelligent Non-Destructive Smart Merge:
 * Preserves all existing data on this phone, strips conflicting IDs,
 * prevents duplicates, and adds all missing records into the timeline.
 */
export async function executeSmartMerge(backupData: any): Promise<MergeResult> {
  const result: MergeResult = {
    addedDiaryEntries: 0,
    addedWaterLogs: 0,
    addedWeightLogs: 0,
    addedRecipes: 0,
    addedActivities: 0,
    addedFastingSessions: 0,
    mergedFavorites: 0,
  };

  await db.transaction(
    'rw',
    [
      db.diaryEntries,
      db.waterLogs,
      db.weightLogs,
      db.fastingSessions,
      db.recipes,
      db.favoriteItems,
      db.activityLogs,
      db.customActivities,
      db.userProfile,
    ],
    async () => {
      // 1. DIARY ENTRIES
      if (Array.isArray(backupData.diary)) {
        const existing = await db.diaryEntries.toArray();
        const toAdd: any[] = [];
        for (const entry of backupData.diary) {
          const isDupe = existing.some(
            (e) =>
              e.date === entry.date &&
              e.mealType === entry.mealType &&
              e.name === entry.name &&
              Math.abs((e.timestamp || 0) - (entry.timestamp || 0)) < 5000
          );
          if (!isDupe) {
            const { id, ...entryWithoutId } = entry;
            toAdd.push(entryWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.diaryEntries.bulkAdd(toAdd);
          result.addedDiaryEntries = toAdd.length;
        }
      }

      // 2. WATER LOGS
      if (Array.isArray(backupData.water)) {
        const existing = await db.waterLogs.toArray();
        const toAdd: any[] = [];
        for (const log of backupData.water) {
          const isDupe = existing.some(
            (e) =>
              e.date === log.date &&
              Math.abs((e.timestamp || 0) - (log.timestamp || 0)) < 3000
          );
          if (!isDupe) {
            const { id, ...logWithoutId } = log;
            toAdd.push(logWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.waterLogs.bulkAdd(toAdd);
          result.addedWaterLogs = toAdd.length;
        }
      }

      // 3. WEIGHT LOGS
      if (Array.isArray(backupData.weights)) {
        const existing = await db.weightLogs.toArray();
        const toAdd: any[] = [];
        for (const w of backupData.weights) {
          const isDupe = existing.some(
            (e) =>
              e.date === w.date &&
              Math.abs((e.timestamp || 0) - (w.timestamp || 0)) < 5000
          );
          if (!isDupe) {
            const { id, ...wWithoutId } = w;
            toAdd.push(wWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.weightLogs.bulkAdd(toAdd);
          result.addedWeightLogs = toAdd.length;
        }
      }

      // 4. RECIPES
      if (Array.isArray(backupData.recipes)) {
        const existing = await db.recipes.toArray();
        const toAdd: any[] = [];
        for (const r of backupData.recipes) {
          const isDupe = existing.some(
            (e) => e.name.trim().toLowerCase() === String(r.name || '').trim().toLowerCase()
          );
          if (!isDupe) {
            const { id, ...rWithoutId } = r;
            toAdd.push(rWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.recipes.bulkAdd(toAdd);
          result.addedRecipes = toAdd.length;
        }
      }

      // 5. ACTIVITY LOGS
      if (Array.isArray(backupData.activityLogs)) {
        const existing = await db.activityLogs.toArray();
        const toAdd: any[] = [];
        for (const a of backupData.activityLogs) {
          const isDupe = existing.some(
            (e) =>
              e.date === a.date &&
              e.activityId === a.activityId &&
              Math.abs((e.timestamp || 0) - (a.timestamp || 0)) < 5000
          );
          if (!isDupe) {
            const { id, ...aWithoutId } = a;
            toAdd.push(aWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.activityLogs.bulkAdd(toAdd);
          result.addedActivities = toAdd.length;
        }
      }

      // 6. CUSTOM ACTIVITIES
      if (Array.isArray(backupData.customActivities)) {
        const existing = await db.customActivities.toArray();
        const toAdd: any[] = [];
        for (const ca of backupData.customActivities) {
          const isDupe = existing.some(
            (e) => e.name.trim().toLowerCase() === String(ca.name || '').trim().toLowerCase()
          );
          if (!isDupe) {
            const { id, ...caWithoutId } = ca;
            toAdd.push(caWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.customActivities.bulkAdd(toAdd);
        }
      }

      // 7. FASTING SESSIONS
      if (Array.isArray(backupData.fasts)) {
        const existing = await db.fastingSessions.toArray();
        const toAdd: any[] = [];
        for (const f of backupData.fasts) {
          const isDupe = existing.some(
            (e) => Math.abs((e.startTime || 0) - (f.startTime || 0)) < 5000
          );
          if (!isDupe) {
            const { id, ...fWithoutId } = f;
            toAdd.push(fWithoutId);
          }
        }
        if (toAdd.length > 0) {
          await db.fastingSessions.bulkAdd(toAdd);
          result.addedFastingSessions = toAdd.length;
        }
      }

      // 8. FAVORITE ITEMS
      if (Array.isArray(backupData.favoriteItems)) {
        for (const fav of backupData.favoriteItems) {
          const existing = await db.favoriteItems.where({ name: fav.name }).first();
          if (existing && existing.id !== undefined) {
            await db.favoriteItems.update(existing.id, {
              useCount: (existing.useCount || 0) + (fav.useCount || 1),
            });
          } else {
            const { id, ...favWithoutId } = fav;
            await db.favoriteItems.add(favWithoutId);
            result.mergedFavorites++;
          }
        }
      }

      // 9. PROFILE SYNC (keep current profile settings, but update weight if newer)
      const allWeightLogs = await db.weightLogs.orderBy('timestamp').reverse().toArray();
      if (allWeightLogs.length > 0) {
        const latestWeight = allWeightLogs[0].weight;
        const currentProfile = await db.userProfile.get('current');
        if (currentProfile) {
          await db.userProfile.update('current', { weight: latestWeight });
        }
      }
    }
  );

  return result;
}

/**
 * Complete destructive overwrite (replaces everything with backup).
 */
export async function executeFullOverwrite(backupData: any): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.diaryEntries,
      db.waterLogs,
      db.weightLogs,
      db.fastingSessions,
      db.recipes,
      db.favoriteItems,
      db.activityLogs,
      db.customActivities,
      db.userProfile,
    ],
    async () => {
      await db.diaryEntries.clear();
      await db.waterLogs.clear();
      await db.weightLogs.clear();
      await db.fastingSessions.clear();
      await db.recipes.clear();
      await db.favoriteItems.clear();
      await db.activityLogs.clear();
      await db.customActivities.clear();

      if (backupData.profile?.length) await db.userProfile.bulkPut(backupData.profile);
      if (backupData.diary?.length) await db.diaryEntries.bulkAdd(backupData.diary.map(({ id, ...rest }: any) => rest));
      if (backupData.water?.length) await db.waterLogs.bulkAdd(backupData.water.map(({ id, ...rest }: any) => rest));
      if (backupData.weights?.length) await db.weightLogs.bulkAdd(backupData.weights.map(({ id, ...rest }: any) => rest));
      if (backupData.fasts?.length) await db.fastingSessions.bulkAdd(backupData.fasts.map(({ id, ...rest }: any) => rest));
      if (backupData.recipes?.length) await db.recipes.bulkAdd(backupData.recipes.map(({ id, ...rest }: any) => rest));
      if (backupData.favoriteItems?.length) await db.favoriteItems.bulkAdd(backupData.favoriteItems.map(({ id, ...rest }: any) => rest));
      if (backupData.activityLogs?.length) await db.activityLogs.bulkAdd(backupData.activityLogs.map(({ id, ...rest }: any) => rest));
      if (backupData.customActivities?.length) await db.customActivities.bulkAdd(backupData.customActivities.map(({ id, ...rest }: any) => rest));
    }
  );
}

function getEmptySummary(): BackupSummary {
  return {
    profileCount: 0,
    diaryCount: 0,
    waterCount: 0,
    weightCount: 0,
    fastingCount: 0,
    recipeCount: 0,
    favoriteCount: 0,
    activityCount: 0,
    customActivityCount: 0,
  };
}

function getEmptyNewCounts() {
  return {
    diary: 0,
    water: 0,
    weights: 0,
    recipes: 0,
    activities: 0,
    fasts: 0,
    favorites: 0,
  };
}
