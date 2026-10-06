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

  const realDeficitBelowMaintenance = effectiveMaintenance - totalKcal;
  const overTarget = totalKcal - effectiveBudget;

  if (!hasYesterdayEntries) {
    status = 'empty';
    headline = 'Ein neuer Tag voller Möglichkeiten! 🌅';
    motivationalMessage = 'Gestern wurden keine Mahlzeiten erfasst – aber jeder Tag ist ein frischer Start. Schnapp dir dein Tagesziel und starte heute mit voller Energie!';
  } else if (totalKcal <= effectiveBudget) {
    status = 'deficit';
    const saved = effectiveBudget - totalKcal;
    headline = 'Fantastische Disziplin gestern! 🌟';
    motivationalMessage = `Du hast gestern dein Kalorienziel von ${effectiveBudget.toLocaleString('de-DE')} kcal vorbildlich gemeistert (${totalKcal.toLocaleString('de-DE')} kcal gegessen, ${saved.toLocaleString('de-DE')} kcal Puffer) und lagst ganze ${realDeficitBelowMaintenance.toLocaleString('de-DE')} kcal unter deinem Erhaltungsbedarf (${effectiveMaintenance.toLocaleString('de-DE')} kcal). Dein Körper hat verlässlich Fettreserven verbrannt!`;
  } else if (realDeficitBelowMaintenance >= 75) {
    // Over the strict deficit target, but STILL in a real deficit below maintenance
    status = 'deficit';
    if (overTarget <= 60) {
      headline = 'Voll im Fettabbau trotz minimaler Abweichung! 🔥';
      motivationalMessage = `Du lagst gestern mit ${totalKcal.toLocaleString('de-DE')} kcal lediglich winzige ${overTarget.toLocaleString('de-DE')} kcal über deinem strengen Tagesziel (${effectiveBudget.toLocaleString('de-DE')} kcal), warst aber immer noch rund ${realDeficitBelowMaintenance.toLocaleString('de-DE')} kcal unter deinem Erhaltungsbedarf (${effectiveMaintenance.toLocaleString('de-DE')} kcal)! Das bedeutet: Du warst voll im echten Fettverbrennungs-Defizit und hast effektiv abgenommen. Eine minimale Schwankung ändert nichts an deinem starken Ergebnis!`;
    } else {
      headline = 'Erfolgreicher Tag mit echtem Kaloriendefizit! 🔥';
      motivationalMessage = `Du hast dein strenges Abnehmziel gestern zwar um ${overTarget.toLocaleString('de-DE')} kcal überschritten (${totalKcal.toLocaleString('de-DE')} von ${effectiveBudget.toLocaleString('de-DE')} kcal), lagst aber mit ${realDeficitBelowMaintenance.toLocaleString('de-DE')} kcal immer noch spürbar unter deinem Erhaltungsbedarf (${effectiveMaintenance.toLocaleString('de-DE')} kcal). Das bedeutet: Auch gestern war dein Körper aktiv im Fettabbau-Modus. Solche flexiblen Tage machen eine Ernährungsumstellung langfristig durchhaltbar!`;
    }
  } else if (Math.abs(realDeficitBelowMaintenance) < 75 || totalKcal <= effectiveMaintenance + 40) {
    status = 'maintenance';
    headline = 'Wertvoller Stoffwechsel- & Erhaltungstag! ⚖️';
    motivationalMessage = `Du bist gestern mit ${totalKcal.toLocaleString('de-DE')} kcal punktgenau in deinem Erhaltungsbereich gelandet (Bedarf: ca. ${effectiveMaintenance.toLocaleString('de-DE')} kcal). Solche Tage sind für deinen Körper extrem wertvoll: Sie signalisieren Sicherheit, schützen deine Muskeln und kurbeln den Stoffwechsel an, ohne zuzunehmen. Heute geht es wieder mit frischem Fokus weiter!`;
  } else {
    status = 'surplus';
    const surplus = totalKcal - effectiveMaintenance;
    if (surplus <= 200) {
      headline = 'Gestern etwas Extra-Energie getankt! 🔋';
      motivationalMessage = `Gestern lagst du ca. ${surplus.toLocaleString('de-DE')} kcal über deinem Erhaltungsbedarf (${effectiveMaintenance.toLocaleString('de-DE')} kcal). Das ist völlig normal und wirft dich nicht aus der Bahn. Mit einer kleinen Runde Spazierengehen oder dem heutigen frischen Tagesziel ist das im Handumdrehen wieder ausgeglichen!`;
    } else {
      headline = 'Neuer Tag, neuer Fokus! 🌅';
      motivationalMessage = `Gestern hat sich dein Körper reichlich Energie geholt (${totalKcal.toLocaleString('de-DE')} kcal gegessen). Hake den Tag mit einem Lächeln ab: Fitness und Abnehmen sind ein Marathon, kein Sprint. Heute starten wir wieder frisch und motiviert durch!`;
    }
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
