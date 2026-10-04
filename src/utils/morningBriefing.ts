import { db, type UserProfile, type DiaryEntry, type ActivityLog, type WaterLog } from '../db/db';
import { getTodayDateString } from './nutrition';

export interface MorningBriefingData {
  yesterdayDate: string;
  userName: string;
  hasYesterdayEntries: boolean;
  totalKcal: number;
  effectiveBudget: number;
  maintenanceKcal: number;
  burnedKcal: number;
  penanceKcal: number;
  stepsCount: number;
  waterMl: number;
  status: 'deficit' | 'maintenance' | 'surplus' | 'empty';
  headline: string;
  motivationalMessage: string;
  movementMessage?: string;
  todayTargetKcal: number;
  todayTip: string;
}

export function getYesterdayDateString(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date();
  base.setDate(base.getDate() - 1);
  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, '0');
  const day = String(base.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const MORNING_TIPS = [
  'Starte gleich mit einem großen Glas lauwarmem Wasser oder deiner Owala-Flasche – das kurbelt deinen Stoffwechsel sofort an! 💧',
  'Plane heute eine sättigende Proteinquelle zu jeder Mahlzeit ein – das schützt Muskeln und verhindert Heißhunger. 🥚',
  'Kleine Schritte zählen: Ein 15-Minuten-Spaziergang in der Mittagspause schenkt dir frische Energie und Extra-Kalorien. 🚶',
  'Genieße deine Mahlzeiten heute ganz bewusst und ohne Smartphone – dein Sättigungsgefühl setzt nach ca. 15 Minuten ein. 🥗',
  'Heute steht dein Wohlbefinden an erster Stelle. Vertraue deinem Hunger- und Sättigungsgefühl! 🌟',
  'Ballaststoffe sind deine besten Freunde: Vollkorn, Hülsenfrüchte oder Gemüse halten deinen Blutzuckerspiegel stabil. 🥦',
];

/**
 * Generates the motivational morning briefing based on yesterday's recorded data.
 */
export async function generateMorningBriefing(userProfile: UserProfile): Promise<MorningBriefingData> {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString(today);

  // Fetch yesterday's data from Dexie
  const diaryEntries: DiaryEntry[] = await db.diaryEntries.where({ date: yesterday }).toArray();
  const activityLogs: ActivityLog[] = await db.activityLogs.where({ date: yesterday }).toArray();
  const waterLogs: WaterLog[] = await db.waterLogs.where({ date: yesterday }).toArray();

  const totalKcal = diaryEntries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const budgetCreditedBurnedKcal = activityLogs.reduce((sum, a) => sum + (a.isPenance ? 0 : (a.caloriesBurned || 0)), 0);
  const totalBurnedKcal = activityLogs.reduce((sum, a) => sum + (a.caloriesBurned || 0), 0);
  const penanceKcal = totalBurnedKcal - budgetCreditedBurnedKcal;
  const stepsCount = activityLogs.reduce((max, a) => Math.max(max, a.stepsCount || 0), 0);
  const waterMl = waterLogs.reduce((sum, w) => sum + (w.amount || 0), 0);

  const baseTarget = userProfile.targetCalories || 1800;
  const effectiveBudget = baseTarget + budgetCreditedBurnedKcal;
  const isMaintainGoal = userProfile.goalType === 'maintain_weight' || userProfile.goalDeficit === 0;
  const maintenanceBase = userProfile.maintenanceCalories || (baseTarget + (userProfile.goalDeficit || (isMaintainGoal ? 0 : 500)));
  const effectiveMaintenance = maintenanceBase + budgetCreditedBurnedKcal;

  const hasYesterdayEntries = diaryEntries.length > 0;
  let status: MorningBriefingData['status'] = 'empty';
  let headline = 'Guten Morgen!';
  let motivationalMessage = '';

  if (!hasYesterdayEntries) {
    status = 'empty';
    headline = 'Ein neuer Tag voller Möglichkeiten! 🌅';
    motivationalMessage = 'Gestern wurden keine Mahlzeiten erfasst – aber jeder Tag ist ein frischer Start. Schnapp dir dein Tagesziel und starte heute mit voller Energie!';
  } else if (totalKcal <= effectiveBudget) {
    status = 'deficit';
    const saved = effectiveBudget - totalKcal;
    headline = 'Fantastische Disziplin gestern! 🌟';
    motivationalMessage = `Du hast gestern dein Kalorienziel perfekt gemeistert und liegst ca. ${saved.toLocaleString('de-DE')} kcal im Defizit. Dein Körper greift zuverlässig auf Energiereserven zurück – genau so geht nachhaltiger Erfolg!`;
  } else if (totalKcal <= effectiveMaintenance) {
    status = 'maintenance';
    headline = 'Perfekter Stoffwechsel-Tag gestern! ⚖️';
    motivationalMessage = 'Du lagst gestern genau im gesunden Erhaltungsbereich. Solche Tage sind extrem wertvoll: Sie signalisieren deinem Körper Sicherheit, schützen Muskelmasse und kurbeln den Stoffwechsel an. Heute geht es wieder mit frischem Fokus weiter!';
  } else {
    status = 'surplus';
    headline = 'Neue Energie getankt! 🔋';
    motivationalMessage = 'Gestern hat sich dein Körper reichlich Energie geholt. Hake den Tag mit einem Lächeln ab: Fitness und Abnehmen sind ein Marathon, kein Sprint. Heute starten wir wieder frisch und motiviert durch!';
  }

  // Activity note
  let movementMessage: string | undefined;
  if (totalBurnedKcal > 0 || stepsCount > 0) {
    const parts: string[] = [];
    if (stepsCount > 0) {
      parts.push(`${stepsCount.toLocaleString('de-DE')} Schritte`);
    }
    if (totalBurnedKcal > 0) {
      parts.push(`${totalBurnedKcal.toLocaleString('de-DE')} kcal durch Bewegung`);
    }
    if (penanceKcal > 0) {
      parts.push(`inkl. ${penanceKcal} kcal Defizit-Puffer 🙏`);
    }
    movementMessage = `Starke Leistung gestern: ${parts.join(' & ')}! Dein Kreislauf war richtig aktiv.`;
  }

  // Randomized motivating tip of the day
  const tipIndex = Math.abs(
    today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % MORNING_TIPS.length;
  const todayTip = MORNING_TIPS[tipIndex];

  return {
    yesterdayDate: yesterday,
    userName: userProfile.name ? userProfile.name.trim() : '',
    hasYesterdayEntries,
    totalKcal,
    effectiveBudget,
    maintenanceKcal: effectiveMaintenance,
    burnedKcal: totalBurnedKcal,
    penanceKcal,
    stepsCount,
    waterMl,
    status,
    headline,
    motivationalMessage,
    movementMessage,
    todayTargetKcal: baseTarget,
    todayTip,
  };
}
