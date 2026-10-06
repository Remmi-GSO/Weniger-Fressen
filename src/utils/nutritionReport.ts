import { type DiaryEntry, type UserProfile } from '../db/db';
import { estimateFiber, estimateSugar } from './nutrientEstimator';

export interface DayNutritionSummary {
  date: string;
  entriesCount: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  totalSugar: number;
}

export interface FoodOccurrence {
  name: string;
  count: number;
  totalGrams: number;
  totalCalories: number;
  isUpf?: boolean;
}

export interface DailyNutritionPoint {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  hasEntries: boolean;
}

export interface NutritionReportData {
  daysCount: number; // 3, 5, 10, or 20
  trackedDaysCount: number;
  startDate: string;
  endDate: string;
  dailyPoints: DailyNutritionPoint[];

  // Averages per tracked day
  avgCalories: number;
  targetCalories: number;
  calorieStatus: 'deficit' | 'maintenance' | 'surplus';
  calorieDifference: number;

  avgProtein: number;
  targetProtein: number;
  proteinStatus: 'low' | 'good' | 'high';
  proteinPercent: number;

  avgCarbs: number;
  targetCarbs: number;

  avgFat: number;
  targetFat: number;
  fatStatus: 'low' | 'good' | 'high';

  avgFiber: number;
  targetFiber: number;
  fiberStatus: 'low' | 'good' | 'optimal';
  fiberPercent: number;

  avgSugar: number;
  targetSugar: number;
  sugarStatus: 'good' | 'elevated' | 'high';

  // Food analysis
  topFoods: FoodOccurrence[];
  uniqueFoodCount: number;

  // Ultra-processed foods (UPF)
  upfFoods: FoodOccurrence[];
  upfCaloriesPercent: number; // % of total calories
  upfStatus: 'excellent' | 'moderate' | 'high';

  // Bad fats vs Good fats
  unhealthyFatFoods: string[];
  healthyFatFoods: string[];

  // Arterial health & Modern lipidology
  transFatMatches: string[];
  eggAndSeafoodFoods: string[];
  eggAndSeafoodCount: number;

  // Executive summary & Top 3 Levers
  strengths: string[];
  improvementLevers: string[];
  overallSummary: string;
}

// Ultra-Processed Foods (NOVA Category 4) Keywords
const UPF_KEYWORDS = [
  'salami', 'wiener', 'würstchen', 'leberkäse', 'mortadella', 'bratwurst', 'cabanossi',
  'pommes', 'chips', 'burger', 'nuggets', 'currywurst', 'döner', 'kroketten',
  'schokolade', 'keks', 'kuchen', 'muffin', 'donut', 'croissant', 'nutella', 'gummibärchen',
  'haribo', 'bonbon', 'milchschnitte', 'kinderriegel', 'hanuta', 'duplo', 'brownie', 'cookies',
  'cola', 'fanta', 'sprite', 'limonade', 'limo', 'eistee', 'energy', 'red bull',
  'schmelzkäse', 'fertiggericht', 'fertigsuppe', 'ramen', 'instant', 'blätterteig'
];

// Unhealthy / Trans Fat Keywords
const UNHEALTHY_FAT_KEYWORDS = [
  'pommes', 'frittiert', 'fritteuse', 'schmalz', 'palmöl', 'palmfett', 'transfett',
  'gehärtet', 'mayo', 'mayonnaise', 'remoulade', 'bacon', 'speck'
];

// Healthy Unsaturated & Omega-3 Fat Keywords
const HEALTHY_FAT_KEYWORDS = [
  'olivenöl', 'rapsöl', 'leinöl', 'walnussöl', 'avocado', 'walnuss', 'walnüsse',
  'mandel', 'mandeln', 'chiasamen', 'leinsamen', 'kürbiskerne', 'lachs', 'makrele', 'thunfisch'
];

// Egg & Seafood (nutrient-dense, choline, astaxanthin, LDL-safe)
const EGG_SEAFOOD_KEYWORDS = [
  'ei ', 'eier', 'spiegelei', 'rührei', 'omelett', 'garnele', 'garnelen',
  'shrimp', 'shrimps', 'prawn', 'prawns', 'lachs', 'meeresfrüchte'
];

/**
 * Calculates date range strings [startDate ... endDate]
 */
export function getDateRangeStrings(daysCount: number, endDateStr?: string): string[] {
  const dates: string[] = [];
  const base = endDateStr ? new Date(endDateStr) : new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

/**
 * Builds a structured, comprehensive nutrition report over N days.
 */
export function buildNutritionReport({
  daysCount,
  endDateStr,
  profile,
  entries,
}: {
  daysCount: number;
  endDateStr?: string;
  profile: UserProfile;
  entries: DiaryEntry[];
}): NutritionReportData {
  const dates = getDateRangeStrings(daysCount, endDateStr);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  // Group entries by date
  const entriesByDate: Record<string, DiaryEntry[]> = {};
  for (const d of dates) {
    entriesByDate[d] = [];
  }

  for (const entry of entries) {
    if (entriesByDate[entry.date]) {
      entriesByDate[entry.date].push(entry);
    }
  }

  // Days that actually contain diary entries
  const trackedDates = dates.filter((d) => entriesByDate[d].length > 0);
  const trackedDaysCount = Math.max(1, trackedDates.length);

  // Totals across all entries in range
  let totalKcal = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;
  let totalSugar = 0;

  // Occurrences of individual foods
  const foodOccurrencesMap: Record<string, { count: number; grams: number; calories: number; isUpf: boolean }> = {};
  const unhealthyFatFoodsSet = new Set<string>();
  const healthyFatFoodsSet = new Set<string>();
  const transFatMatchesSet = new Set<string>();
  const eggAndSeafoodSet = new Set<string>();

  for (const entry of entries) {
    if (!dates.includes(entry.date)) continue;

    const kcal = entry.calories || 0;
    const protein = entry.protein || 0;
    const carbs = entry.carbs || 0;
    const fat = entry.fat || 0;
    const fiber = entry.fiber !== undefined ? entry.fiber : estimateFiber(entry.name, entry.amount || 100, kcal);
    const sugar = entry.sugar !== undefined ? entry.sugar : estimateSugar(entry.name, entry.amount || 100, carbs);

    totalKcal += kcal;
    totalProtein += protein;
    totalCarbs += carbs;
    totalFat += fat;
    totalFiber += fiber;
    totalSugar += sugar;

    // Food Occurrences & UPF categorization
    const cleanName = entry.name.replace(/\s*\([^)]*\)/g, '').trim() || entry.name;
    const lower = entry.name.toLowerCase();

    // Check if UPF (Ultra-processed)
    const isUpf = UPF_KEYWORDS.some((kw) => {
      if (kw === 'cola') {
        return /\b(cola|coca[- ]?cola|pepsi|coke|kola)\b/i.test(lower) && !lower.includes('rucola');
      }
      return lower.includes(kw);
    });

    if (!foodOccurrencesMap[cleanName]) {
      foodOccurrencesMap[cleanName] = { count: 0, grams: 0, calories: 0, isUpf };
    }
    foodOccurrencesMap[cleanName].count += 1;
    foodOccurrencesMap[cleanName].grams += entry.amount || 100;
    foodOccurrencesMap[cleanName].calories += kcal;

    // Fat classifications
    if (UNHEALTHY_FAT_KEYWORDS.some((kw) => lower.includes(kw))) {
      unhealthyFatFoodsSet.add(cleanName);
    }
    if (HEALTHY_FAT_KEYWORDS.some((kw) => lower.includes(kw))) {
      healthyFatFoodsSet.add(cleanName);
    }
    if (['transfett', 'gehärtet', 'palmfett', 'frittieröl', 'blätterteig'].some((kw) => lower.includes(kw))) {
      transFatMatchesSet.add(cleanName);
    }

    // Eggs & Seafood
    if (EGG_SEAFOOD_KEYWORDS.some((kw) => lower.includes(kw))) {
      eggAndSeafoodSet.add(cleanName);
    }
  }

  // Averages per tracked day
  const avgCalories = Math.round(totalKcal / trackedDaysCount);
  const avgProtein = Math.round((totalProtein / trackedDaysCount) * 10) / 10;
  const avgCarbs = Math.round((totalCarbs / trackedDaysCount) * 10) / 10;
  const avgFat = Math.round((totalFat / trackedDaysCount) * 10) / 10;
  const avgFiber = Math.round((totalFiber / trackedDaysCount) * 10) / 10;
  const avgSugar = Math.round((totalSugar / trackedDaysCount) * 10) / 10;

  const targetCalories = profile.targetCalories || 1800;
  const targetProtein = profile.targetProtein || 100;
  const targetCarbs = profile.targetCarbs || 200;
  const targetFat = profile.targetFat || 60;
  const targetFiber = profile.targetFiber || 30;
  const targetSugar = profile.targetSugar || 35;

  // Status evaluations
  const isMaintainGoal = profile.goalType === 'maintain_weight' || profile.goalDeficit === 0;
  const maintenanceCalories = profile.maintenanceCalories || (targetCalories + (profile.goalDeficit || (isMaintainGoal ? 0 : 500)));
  const deficitBelowMaintenance = maintenanceCalories - avgCalories;

  const calorieDifference = avgCalories - targetCalories;
  const calorieStatus: 'deficit' | 'maintenance' | 'surplus' =
    calorieDifference <= 0 || deficitBelowMaintenance >= 75
      ? 'deficit'
      : Math.abs(deficitBelowMaintenance) < 75 || avgCalories <= maintenanceCalories + 40
      ? 'maintenance'
      : 'surplus';

  const proteinPercent = Math.round((avgProtein / targetProtein) * 100);
  const proteinStatus: 'low' | 'good' | 'high' =
    proteinPercent < 80 ? 'low' : proteinPercent <= 130 ? 'good' : 'high';

  const fatStatus: 'low' | 'good' | 'high' =
    avgFat < targetFat * 0.75 ? 'low' : avgFat <= targetFat * 1.15 ? 'good' : 'high';

  const fiberPercent = Math.round((avgFiber / targetFiber) * 100);
  const fiberStatus: 'low' | 'good' | 'optimal' =
    avgFiber < 22 ? 'low' : avgFiber < 32 ? 'good' : 'optimal';

  const sugarStatus: 'good' | 'elevated' | 'high' =
    avgSugar <= targetSugar ? 'good' : avgSugar <= targetSugar * 1.3 ? 'elevated' : 'high';

  // Sorted food list
  const sortedFoods: FoodOccurrence[] = Object.entries(foodOccurrencesMap).map(([name, data]) => ({
    name,
    count: data.count,
    totalGrams: Math.round(data.grams),
    totalCalories: data.calories,
    isUpf: data.isUpf,
  })).sort((a, b) => b.count - a.count || b.totalCalories - a.totalCalories);

  const topFoods = sortedFoods.slice(0, 8);
  const uniqueFoodCount = sortedFoods.length;

  // UPF metrics
  const upfFoods = sortedFoods.filter((f) => f.isUpf);
  const upfCalories = upfFoods.reduce((sum, f) => sum + f.totalCalories, 0);
  const upfCaloriesPercent = totalKcal > 0 ? Math.round((upfCalories / totalKcal) * 100) : 0;
  const upfStatus: 'excellent' | 'moderate' | 'high' =
    upfCaloriesPercent <= 15 ? 'excellent' : upfCaloriesPercent <= 30 ? 'moderate' : 'high';

  // Strengths & Improvement Levers
  const strengths: string[] = [];
  const improvementLevers: string[] = [];

  // Evaluate strengths
  if (proteinStatus === 'good' || proteinStatus === 'high') {
    strengths.push(`Starke Eiweiß-Zufuhr (${avgProtein}g/Tag, ${proteinPercent}% des Ziels): Optimal für Muskelschutz & langanhaltende Sättigung.`);
  }
  if (sugarStatus === 'good') {
    strengths.push(`Vorbildliche Zuckerkontrolle: Mit ${avgSugar}g/Tag klar unter dem WHO-Limit (${targetSugar}g). Blutzucker bleibt stabil.`);
  }
  if (upfStatus === 'excellent') {
    strengths.push(`Sehr hoher Anteil an echten, unverarbeiteten Lebensmitteln (nur ${upfCaloriesPercent}% hochverarbeitet). Großartige Basis!`);
  } else if (upfStatus === 'moderate') {
    strengths.push(`Ausgewogenes Verhältnis: Der Großteil (${100 - upfCaloriesPercent}%) besteht aus frischen Lebensmitteln & Selbstgekochtem.`);
  }
  if (fiberStatus === 'good' || fiberStatus === 'optimal') {
    strengths.push(`Klasse Ballaststoff-Bilanz (${avgFiber}g/Tag): Perfekt für Mikrobiom, Darmflora und Verdauung.`);
  }
  if (eggAndSeafoodSet.size > 0) {
    strengths.push(`Nährstoff-Plus: ${Array.from(eggAndSeafoodSet).slice(0, 2).join(', ')} liefern bioverfügbares Cholin & Protein ohne schädliches LDL.`);
  }
  if (healthyFatFoodsSet.size > 0) {
    strengths.push(`Gesunde Fette integriert: ${Array.from(healthyFatFoodsSet).slice(0, 3).join(', ')} schützen Gefäße und Herz.`);
  }

  // Fallback strength if needed
  if (strengths.length === 0) {
    strengths.push(`Konsequentes Tracking: ${trackedDaysCount} Tage ehrlich festgehalten – der wichtigste Schritt zu nachhaltigen Ernährungsgewohnheiten!`);
  }

  // Evaluate levers
  if (fiberStatus === 'low') {
    improvementLevers.push(`🌾 Ballaststoffe erhöhen: Aktuell ${avgFiber}g/Tag (Ziel: ${targetFiber}g). Hebel: Eine Handvoll Beeren ins Müsli, Gemüse zum Mittag oder Vollkornbrot wählen.`);
  }
  if (proteinStatus === 'low') {
    improvementLevers.push(`🥩 Protein steigern: Aktuell ${avgProtein}g/Tag (Ziel: ${targetProtein}g). Hebel: Eine Extra-Portion Magerquark, Eier, Fisch, Tofu oder Hülsenfrüchte einbauen.`);
  }
  if (fatStatus === 'high') {
    improvementLevers.push(`🧈 Fette im Blick behalten: Mit ${avgFat}g/Tag über dem Ziel (${targetFat}g). Hebel: Überbackenen Käse, Frittiertes oder fette Wurst durch magere Alternativen ersetzen.`);
  }
  if (sugarStatus === 'elevated' || sugarStatus === 'high') {
    improvementLevers.push(`🍬 Zucker bremsen: Mit ${avgSugar}g/Tag über dem empfohlenen Limit (${targetSugar}g). Hebel: Süße Getränke und Riegel durch zuckerfreie Alternativen ersetzen.`);
  }
  if (upfStatus === 'high') {
    improvementLevers.push(`🏭 Hochverarbeitetes reduzieren: ${upfCaloriesPercent}% der Kalorien stammen aus Fertigprodukten (${upfFoods.slice(0, 2).map(f => f.name).join(', ')}). 1–2 Mahlzeiten mehr frisch kochen.`);
  }
  if (transFatMatchesSet.size > 0) {
    improvementLevers.push(`🫀 Gehärtete Fette meiden: Gefunden bei ${Array.from(transFatMatchesSet).slice(0, 2).join(', ')}. Auf natives Oliven- oder Rapsöl umsteigen.`);
  }

  if (improvementLevers.length === 0) {
    improvementLevers.push(`✨ Perfekter Kurs! Behalte diesen Rhythmus bei und genieße deine ausgewogene Ernährung.`);
  }

  // Overall one-sentence summary
  let overallSummary = '';
  if (strengths.length >= 2 && improvementLevers.length <= 1) {
    overallSummary = `Hervorragende ${daysCount}-Tage-Bilanz! Dein Speiseplan ist ausgewogen, nährstoffreich und unterstützt deine Ziele bestens.`;
  } else if (improvementLevers.length >= 2) {
    overallSummary = `Gute Grundlage mit klarem Potenzial: Konzentriere dich vor allem auf ${improvementLevers[0].split(':')[0].toLowerCase()}, um sofort mehr Energie & Sättigung zu spüren.`;
  } else {
    overallSummary = `Solide ${daysCount}-Tage-Auswertung mit starker Tendenz: Du bist auf einem sehr guten Weg!`;
  }

  // Daily breakdown for visual graphs and trend analysis
  const dailyPoints: DailyNutritionPoint[] = dates.map((d) => {
    const dayEntries = entriesByDate[d] || [];
    let dayKcal = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let dayFiber = 0;
    let daySugar = 0;

    for (const e of dayEntries) {
      const kcal = e.calories || 0;
      const carbs = e.carbs || 0;
      dayKcal += kcal;
      dayProtein += e.protein || 0;
      dayCarbs += carbs;
      dayFat += e.fat || 0;
      dayFiber += e.fiber !== undefined ? e.fiber : estimateFiber(e.name, e.amount || 100, kcal);
      daySugar += e.sugar !== undefined ? e.sugar : estimateSugar(e.name, e.amount || 100, carbs);
    }

    return {
      date: d,
      calories: Math.round(dayKcal),
      protein: Math.round(dayProtein * 10) / 10,
      carbs: Math.round(dayCarbs * 10) / 10,
      fat: Math.round(dayFat * 10) / 10,
      fiber: Math.round(dayFiber * 10) / 10,
      sugar: Math.round(daySugar * 10) / 10,
      hasEntries: dayEntries.length > 0,
    };
  });

  return {
    daysCount,
    trackedDaysCount,
    startDate,
    endDate,
    dailyPoints,
    avgCalories,
    targetCalories,
    calorieStatus,
    calorieDifference,
    avgProtein,
    targetProtein,
    proteinStatus,
    proteinPercent,
    avgCarbs,
    targetCarbs,
    avgFat,
    targetFat,
    fatStatus,
    avgFiber,
    targetFiber,
    fiberStatus,
    fiberPercent,
    avgSugar,
    targetSugar,
    sugarStatus,
    topFoods,
    uniqueFoodCount,
    upfFoods,
    upfCaloriesPercent,
    upfStatus,
    unhealthyFatFoods: Array.from(unhealthyFatFoodsSet),
    healthyFatFoods: Array.from(healthyFatFoodsSet),
    transFatMatches: Array.from(transFatMatchesSet),
    eggAndSeafoodFoods: Array.from(eggAndSeafoodSet),
    eggAndSeafoodCount: eggAndSeafoodSet.size,
    strengths,
    improvementLevers,
    overallSummary,
  };
}

/**
 * Formats report as a clear, crisp WhatsApp message.
 */
export function formatReportForWhatsApp(report: NutritionReportData, userName?: string): string {
  const nameGreeting = userName && userName.trim() !== 'Du' ? ` für ${userName.trim()}` : '';
  const lines: string[] = [];

  lines.push(`📊 *Ernährungs-Bericht (${report.daysCount} Tage)${nameGreeting}* 🥗`);
  lines.push(`📅 Zeitraum: ${report.trackedDaysCount} erfasste Tage (${report.startDate} bis ${report.endDate})`);
  lines.push('');

  lines.push(`🎯 *DURCHSCHNITT PRO TAG:*`);
  lines.push(`• Kalorien: ${report.avgCalories} kcal (Ziel: ${report.targetCalories} kcal) ${report.calorieStatus === 'deficit' ? '🟢 Defizit' : report.calorieStatus === 'maintenance' ? '🟡 Erhalt' : '🔴 Überschuss'}`);
  lines.push(`• Eiweiß: ${report.avgProtein}g (Ziel: ${report.targetProtein}g, ${report.proteinPercent}%) ${report.proteinStatus === 'good' ? '🟢 Optimal' : report.proteinStatus === 'low' ? '⚠️ Zu wenig' : '🔵 Hoch'}`);
  lines.push(`• Ballaststoffe: ${report.avgFiber}g (Ziel: ${report.targetFiber}g) ${report.fiberStatus === 'good' || report.fiberStatus === 'optimal' ? '🟢 Top' : '⚠️ Zu wenig'}`);
  lines.push(`• Zucker: ${report.avgSugar}g (Limit: ${report.targetSugar}g) ${report.sugarStatus === 'good' ? '🟢 Im Limit' : '⚠️ Erhöht'}`);
  lines.push(`• Fett: ${report.avgFat}g (Ziel: ${report.targetFat}g)`);
  lines.push('');

  lines.push(`🏭 *VERARBEITUNGS-GRAD (UPF):*`);
  lines.push(`• ${report.upfCaloriesPercent}% hochverarbeitete Lebensmittel ${report.upfStatus === 'excellent' ? '✨ (Sehr frisch & naturnah!)' : report.upfStatus === 'moderate' ? '👍 (Ausgewogen)' : '⚠️ (Erhöht)'}`);
  if (report.upfFoods.length > 0) {
    lines.push(`• Produkte: ${report.upfFoods.slice(0, 3).map((f) => `${f.name} (${f.count}x)`).join(', ')}`);
  }
  lines.push('');

  if (report.eggAndSeafoodFoods.length > 0) {
    lines.push(`🥚 *NÄHRSTOFF-PLUS (Eier & Meeresfrüchte):*`);
    lines.push(`• ${report.eggAndSeafoodFoods.slice(0, 3).join(', ')} gegessen: Wertvolles Cholin & Omega-3, nach moderner Wissenschaft komplett unbedenklich fürs LDL-Cholesterin!`);
    lines.push('');
  }

  if (report.topFoods.length > 0) {
    lines.push(`🥗 *TOP-LEBENSMITTEL:*`);
    report.topFoods.slice(0, 5).forEach((f, idx) => {
      lines.push(`${idx + 1}. ${f.name} (${f.count}x)`);
    });
    lines.push('');
  }

  lines.push(`👍 *WAS SUPER LIEF:*`);
  report.strengths.slice(0, 2).forEach((s) => lines.push(`✓ ${s}`));
  lines.push('');

  lines.push(`⚡ *DIE WICHTIGSTEN HEBEL:*`);
  report.improvementLevers.slice(0, 2).forEach((l) => lines.push(`• ${l}`));
  lines.push('');

  lines.push(`✨ *Fazit:* ${report.overallSummary}`);

  return lines.join('\n');
}
