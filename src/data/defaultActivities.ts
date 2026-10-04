export interface ActivityDefinition {
  id: string;
  name: string;
  category: 'daily' | 'fitness' | 'household' | 'sports';
  icon: string;
  met: number; // Gross MET (Metabolic Equivalent of Task) nach Ainsworth Compendium
  defaultDurationMinutes: number;
  unitStepMinutes: number; // e.g. 30 for dog walk, 15 for workout
  unitLabel?: string; // e.g. "Halbe Stunde (1 Einheit)"
  description: string;
  allowManualCalories?: boolean;
}

export const DEFAULT_ACTIVITIES: ActivityDefinition[] = [
  {
    id: 'dog_walk',
    name: 'Gassi gehen mit Snoopy',
    category: 'daily',
    icon: '🐕',
    met: 3.0, // Ainsworth Compendium Code 17151 (Walking the dog): 3.0 Brutto-MET -> Netto-MET = 2.0 (ca. 75 kcal / 30 Min bei 75 kg)
    defaultDurationMinutes: 30,
    unitStepMinutes: 30,
    unitLabel: 'Halbstündige Einheiten (je 30 Min)',
    description: 'Spaziergang mit Snoopy in 30-Min-Einheiten (Schnüffeln, Stehenbleiben & Gehen)',
  },
  {
    id: 'jumping_fit',
    name: 'Jumping Fit (Trampolin)',
    category: 'fitness',
    icon: '🦘',
    met: 8.9, // 45m HIIT (9.5 MET) + 20m Tabata (10.5 MET) + 10m Dehnen (2.5 MET) gewichtet = 8.9 Gross MET
    defaultDurationMinutes: 75,
    unitStepMinutes: 15,
    unitLabel: 'Session (45m HIIT + 20m Tabata + 10m Dehnen)',
    description: 'Sehr anstrengendes Trampolin-Workout: 45 Min HIIT + 20 Min Tabata + 10 Min Dehnen',
  },
  {
    id: 'crosstrainer',
    name: 'Crosstrainer',
    category: 'fitness',
    icon: '🎿',
    met: 7.0, // Ainsworth Code 02048 (Elliptical trainer, moderate to vigorous): ~7.0 MET
    defaultDurationMinutes: 30,
    unitStepMinutes: 5,
    unitLabel: 'Minuten',
    description: 'Ganzkörper-Cardio. Verbrauchte Kalorien können direkt vom Display eingegeben werden.',
    allowManualCalories: true,
  },
  {
    id: 'quest3_sport',
    name: 'Meta Quest 3 Sport (VR)',
    category: 'fitness',
    icon: '🥽',
    met: 6.5, // VR Health Institute (VR Racketsport Tennis/Badminton): ~6.5 Brutto-MET / Netto 5.5
    defaultDurationMinutes: 45,
    unitStepMinutes: 15,
    unitLabel: 'Minuten',
    description: 'VR Racketsport (Badminton/Tennis) oder Kalorien vom Quest 3 Move Tracker eingeben.',
    allowManualCalories: true,
  },
  {
    id: 'back_yoga',
    name: 'Rückenfit / Yoga / Pilates',
    category: 'fitness',
    icon: '🧘',
    met: 2.8, // Ainsworth Code 02150 (Hatha Yoga / sanfte Rückengymnastik): Netto-MET = 1.8
    defaultDurationMinutes: 60,
    unitStepMinutes: 15,
    unitLabel: 'Individuelle Dauer (15–90 Min)',
    description: 'Rückengymnastik, Mobilisation, Hatha Yoga oder sanftes Pilates',
  },
  {
    id: 'gardening',
    name: 'Gartenarbeit',
    category: 'household',
    icon: '🪴',
    met: 3.5, // Ainsworth Code 08095 (Unkraut jäten, Pflanzen, Beete pflegen): Netto-MET = 2.5
    defaultDurationMinutes: 60,
    unitStepMinutes: 30,
    unitLabel: 'Halbe Stunden / Stunden',
    description: 'Umgraben, Unkraut jäten, Rasenmähen, Hecken stutzen',
  },
  {
    id: 'housework',
    name: 'Hausputz & Wohnungsputz',
    category: 'household',
    icon: '🧹',
    met: 2.8, // Ainsworth Code 05040 (Staubsaugen, Putzen, Aufräumen): Netto-MET = 1.8
    defaultDurationMinutes: 60,
    unitStepMinutes: 15,
    unitLabel: 'Minuten / Stunden',
    description: 'Staubsaugen, Wischen, Fenster putzen, Betten beziehen, Aufräumen',
  },
  {
    id: 'gym',
    name: 'Krafttraining / Gym',
    category: 'fitness',
    icon: '🏋️',
    met: 4.0, // Ainsworth Code 02054 (Krafttraining mit Pausen): Netto-MET = 3.0
    defaultDurationMinutes: 60,
    unitStepMinutes: 15,
    unitLabel: 'Minuten',
    description: 'Gerätetraining, Freihanteln oder Bodyweight-Übungen',
  },
  {
    id: 'running',
    name: 'Joggen / Laufen',
    category: 'sports',
    icon: '🏃',
    met: 8.0, // Ainsworth Code 12020 (Laufen 8 km/h): Netto-MET = 7.0
    defaultDurationMinutes: 30,
    unitStepMinutes: 10,
    unitLabel: 'Minuten',
    description: 'Ausdauerlauf bei moderatem Wohlfühltempo (ca. 8 km/h)',
  },
  {
    id: 'swimming',
    name: 'Schwimmen',
    category: 'sports',
    icon: '🏊',
    met: 5.5, // Ainsworth Code 18310 (Brustschwimmen moderat): Netto-MET = 4.5
    defaultDurationMinutes: 45,
    unitStepMinutes: 15,
    unitLabel: 'Minuten',
    description: 'Brust- oder Kraulschwimmen im Hallen- oder Freibad',
  },
];

export interface CalorieBurnCalculation {
  netCalories: number;      // Reiner Mehrverbrauch über Grundumsatz (wird dem Tagesbudget gutgeschrieben)
  grossCalories: number;    // Bruttoumsatz während der Aktivität
  restingCalories: number;  // Grundumsatz während derselben Zeitspanne (bereits im Tagesziel enthalten)
  netMet: number;           // Berechneter Netto-MET (Brutto-MET - 1.0)
}

/**
 * Berechnet den wissenschaftlich fundierten NETTO-Mehrverbrauch an Kalorien über dem Grundumsatz.
 * 
 * Warum Netto statt Brutto?
 * 1.0 MET entspricht dem Grundumsatz (Liegen/Sitzen = 1 kcal/kg/h).
 * Da der Grundumsatz (BMR) bereits vollständig im täglichen Kalorienbudget (Mifflin-St. Jeor) 
 * enthalten ist, darf für Sport/Bewegung nur der Netto-Zusatzverbrauch (MET - 1.0) gutgeschrieben werden.
 * Andernfalls werden Ruhekalorien doppelt gezählt und das Kaloriendefizit wird sabotiert.
 */
export function calculateNetCaloriesBurned(
  grossMet: number,
  weightKg: number,
  durationMinutes: number,
  intensityMultiplier: number = 1.0
): CalorieBurnCalculation {
  if (!weightKg || weightKg <= 0 || !durationMinutes || durationMinutes <= 0) {
    return { netCalories: 0, grossCalories: 0, restingCalories: 0, netMet: 0 };
  }

  const hours = durationMinutes / 60;
  const effectiveGrossMet = grossMet * intensityMultiplier;
  
  // Grundumsatz während der Zeitdauer (1.0 MET)
  const restingCalories = Math.round(1.0 * weightKg * hours);
  
  // Bruttoumsatz während der Aktivität
  const grossCalories = Math.round(effectiveGrossMet * weightKg * hours);
  
  // Netto-MET: Tatsächlicher Mehrverbrauch durch Bewegung
  const netMet = Math.max(0.5, effectiveGrossMet - 1.0);
  const netCalories = Math.max(1, Math.round(netMet * weightKg * hours));

  return {
    netCalories,
    grossCalories,
    restingCalories,
    netMet: Math.round(netMet * 10) / 10,
  };
}

/**
 * Kompatible Standard-Hilfsfunktion (gibt Netto-Kalorien zurück)
 */
export function calculateCaloriesBurned(
  met: number,
  weightKg: number,
  durationMinutes: number,
  intensityMultiplier: number = 1.0
): number {
  return calculateNetCaloriesBurned(met, weightKg, durationMinutes, intensityMultiplier).netCalories;
}
