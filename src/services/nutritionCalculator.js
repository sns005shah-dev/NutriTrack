// Nutrition Calculator & Macro/Micro Health Engine
// BMR, TDEE, BMI, Unit Conversions, Weight Trends, and Comprehensive Micro/Macro Aggregations

import { DEFAULT_FOOD_DATABASE } from '../data/foods';

// --- BMI CALCULATION ---
export function calculateBMI(weightKg, heightCm) {
  const w = parseFloat(weightKg) || 0;
  const h = parseFloat(heightCm) || 0;
  if (w <= 0 || h <= 0) return { bmi: 0, category: 'Unknown', color: '#858585' };

  const heightM = h / 100;
  const bmiVal = Math.round((w / (heightM * heightM)) * 10) / 10;

  let category = 'Normal weight';
  let color = '#16A34A'; // Healthy Green

  if (bmiVal < 18.5) {
    category = 'Underweight';
    color = '#3B82F6'; // Blue
  } else if (bmiVal < 25.0) {
    category = 'Normal weight';
    color = '#16A34A'; // Green
  } else if (bmiVal < 30.0) {
    category = 'Overweight';
    color = '#D97706'; // Amber
  } else {
    category = 'Obese';
    color = '#DC2626'; // Red
  }

  return { bmi: bmiVal, category, color, heightM, weightKg: w };
}

// --- UNIT CONVERSIONS ---
export function kgToLbs(kg) {
  return Math.round((parseFloat(kg) || 0) * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs) {
  return Math.round(((parseFloat(lbs) || 0) / 2.20462) * 10) / 10;
}

export function cmToIn(cm) {
  return Math.round((parseFloat(cm) || 0) * 0.393701 * 10) / 10;
}

export function inToCm(inches) {
  return Math.round(((parseFloat(inches) || 0) / 0.393701) * 10) / 10;
}

export function ftInToCm(feet, inches = 0) {
  const f = parseFloat(feet) || 0;
  const i = parseFloat(inches) || 0;
  return Math.round((f * 30.48 + i * 2.54) * 10) / 10;
}

export function cmToFtIn(cm) {
  const totalInches = Math.round((parseFloat(cm) || 0) / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return { feet, inches };
}

export function formatWeight(weightKg, unit = 'kg') {
  if (unit === 'lbs' || unit === 'lb') {
    return `${kgToLbs(weightKg)} lbs`;
  }
  return `${Math.round(weightKg * 10) / 10} kg`;
}

export function formatHeight(heightCm, unit = 'cm') {
  if (unit === 'ft/in' || unit === 'ft' || unit === 'in') {
    const { feet, inches } = cmToFtIn(heightCm);
    return `${feet}'${inches}"`;
  }
  return `${Math.round(heightCm)} cm`;
}

export function formatMeasurement(valCm, unit = 'cm') {
  if (unit === 'in') {
    return `${cmToIn(valCm)} in`;
  }
  return `${Math.round(valCm * 10) / 10} cm`;
}

// --- BMR & TDEE (Clinical Mifflin-St Jeor) ---
export function calculateBMR(weightKg, heightCm, age, gender) {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightCm) || 170;
  const a = parseInt(age, 10) || 25;

  const g = (gender || '').toLowerCase();
  if (g === 'female') {
    return Math.round(10 * w + 6.25 * h - 5 * a - 161);
  } else if (g === 'male') {
    return Math.round(10 * w + 6.25 * h - 5 * a + 5);
  }
  // Midpoint constant for unselected/other
  return Math.round(10 * w + 6.25 * h - 5 * a - 78);
}

export function calculateTDEE(bmr, activityLevel) {
  const multipliers = {
    sedentary: 1.2,       // Desk job, little/no exercise
    light: 1.375,         // Light exercise 1-3 days/week
    moderate: 1.55,       // Moderate exercise 3-5 days/week
    very: 1.725,          // Hard exercise 6-7 days/week
    extra: 1.9            // Physical labor / elite athlete
  };
  const mult = multipliers[activityLevel] || 1.4;
  return Math.round(bmr * mult);
}

export function calculateRecommendedTargets(weightKg, heightCm, age, gender, activityLevel, goal = 'lose') {
  const w = parseFloat(weightKg) || 70;
  const h = parseFloat(heightCm) || 170;
  const a = parseInt(age, 10) || 28;

  const bmr = calculateBMR(w, h, a, gender);
  const tdee = calculateTDEE(bmr, activityLevel);

  let targetCalories = tdee;
  const g = (goal || '').toLowerCase();

  if (g === 'lose') {
    // 500 kcal deficit (~0.5kg/week fat loss), floored at clinical safe baseline
    const minCals = (gender || '').toLowerCase() === 'female' ? 1200 : 1500;
    targetCalories = Math.max(minCals, Math.round(tdee - 500));
  } else if (g === 'build_muscle') {
    // Lean surplus of 250-300 kcal
    targetCalories = Math.round(tdee + 275);
  } else if (g === 'gain') {
    // Caloric surplus of 400-500 kcal
    targetCalories = Math.round(tdee + 450);
  } else {
    // Maintenance
    targetCalories = tdee;
  }

  // Protein targets based on clinical guidelines
  let proteinPerKg = 1.6;
  if (g === 'lose' || g === 'build_muscle') {
    proteinPerKg = 2.0; // Higher protein to spare lean muscle mass during deficit/hypertrophy
  } else if (g === 'gain') {
    proteinPerKg = 1.8;
  }
  const proteinGrams = Math.round(Math.min(targetCalories * 0.35 / 4, Math.max(50, w * proteinPerKg)));

  // Dietary Fat: 25-28% of total daily energy
  const fatGrams = Math.round((targetCalories * 0.27) / 9);

  // Carbohydrates: remainder of energy
  const carbsGrams = Math.max(50, Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4));

  // Dietary Fibre: 14g per 1,000 kcal (USDA guideline)
  const fiberGrams = Math.round((targetCalories / 1000) * 14);

  // Added Sugar Limit: <= 8% of caloric intake, capped at 50g (WHO guideline)
  const sugarGrams = Math.min(50, Math.max(25, Math.round((targetCalories * 0.08) / 4)));

  // Hydration: 35ml per kg of body weight
  const waterTargetMl = Math.round(w * 35);

  return {
    bmr,
    maintenanceCalories: tdee,
    calorieTarget: targetCalories,
    proteinTarget: proteinGrams,
    carbsTarget: carbsGrams,
    fatTarget: fatGrams,
    fiberTarget: fiberGrams,
    sugarTarget: sugarGrams,
    waterTargetMl: waterTargetMl
  };
}

// --- STREAK CALCULATION ---
export function calculateStreak(logs = {}, todayStr = '') {
  if (!logs) return 0;
  const d = todayStr ? new Date(todayStr) : new Date();
  let streak = 0;

  // Check today
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  const todayTotals = computeDailyTotals(logs[todayKey]);
  const loggedToday = todayTotals.calories > 0;
  if (loggedToday) streak = 1;

  // Check consecutive previous days
  for (let offset = 1; offset <= 365; offset++) {
    const prev = new Date(d);
    prev.setDate(d.getDate() - offset);
    const pY = prev.getFullYear();
    const pM = String(prev.getMonth() + 1).padStart(2, '0');
    const pD = String(prev.getDate()).padStart(2, '0');
    const key = `${pY}-${pM}-${pD}`;

    const prevTotals = computeDailyTotals(logs[key]);
    if (prevTotals.calories > 0) {
      streak += 1;
    } else {
      // If user hasn't logged yet today, allow yesterday to count as current active streak
      if (offset === 1 && !loggedToday) {
        continue;
      }
      break;
    }
  }

  return streak;
}

// --- WEIGHT PROGRESS & GOAL TRACKING ---
export function calculateWeightGoalProgress(startingKg, currentKg, targetKg, goal = 'lose') {
  const s = parseFloat(startingKg) || currentKg;
  const c = parseFloat(currentKg) || 0;
  const t = parseFloat(targetKg) || c;

  const totalChange = Math.round((c - s) * 10) / 10;
  const remainingChange = Math.round(Math.abs(t - c) * 10) / 10;

  let progressPercent = 0;
  if (goal === 'lose') {
    const totalToLose = s - t;
    if (totalToLose > 0) {
      const lostSoFar = s - c;
      progressPercent = Math.min(100, Math.max(0, Math.round((lostSoFar / totalToLose) * 100)));
    }
  } else if (goal === 'gain') {
    const totalToGain = t - s;
    if (totalToGain > 0) {
      const gainedSoFar = c - s;
      progressPercent = Math.min(100, Math.max(0, Math.round((gainedSoFar / totalToGain) * 100)));
    }
  } else {
    // Maintain: close to target is 100%
    const diff = Math.abs(c - t);
    progressPercent = diff <= 1.0 ? 100 : Math.max(0, Math.round((1 - diff / 5) * 100));
  }

  return {
    startingKg: s,
    currentKg: c,
    targetKg: t,
    totalChangeKg: totalChange,
    remainingKg: remainingChange,
    progressPercent
  };
}

// Moving average smoothing for weight trend
export function computeMovingAverage(dataPoints, windowSize = 3) {
  if (!dataPoints || dataPoints.length === 0) return [];
  return dataPoints.map((pt, idx) => {
    const start = Math.max(0, idx - windowSize + 1);
    const subset = dataPoints.slice(start, idx + 1);
    const avg = subset.reduce((acc, curr) => acc + curr.weightKg, 0) / subset.length;
    return {
      ...pt,
      movingAvgKg: Math.round(avg * 10) / 10
    };
  });
}

// --- NUTRITION TOTALS ---
export function computeDailyTotals(dayLog) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
    waterMl: (dayLog && dayLog.waterMl) || 0,
    // Micronutrient accumulators
    vitA: 0, vitC: 0, vitD: 0, vitE: 0, vitK: 0,
    vitB1: 0, vitB2: 0, vitB3: 0, vitB5: 0, vitB6: 0, vitB7: 0, vitB9: 0, vitB12: 0,
    calcium: 0, iron: 0, magnesium: 0, zinc: 0, potassium: 0, sodium: 0,
    phosphorus: 0, selenium: 0, copper: 0, manganese: 0, iodine: 0
  };

  if (!dayLog || !dayLog.meals) return totals;

  const mealCategories = ['breakfast', 'lunch', 'dinner', 'snacks'];
  mealCategories.forEach(cat => {
    const list = dayLog.meals[cat] || [];
    list.forEach(item => {
      totals.calories += Number(item.calories) || 0;
      totals.protein += Number(item.protein) || 0;
      totals.carbs += Number(item.carbs) || 0;
      totals.fat += Number(item.fat) || 0;
      totals.saturatedFat += Number(item.saturatedFat) || 0;

      const hasDirectFiber = item.fiber !== undefined && item.fiber !== null;
      const hasDirectSugar = item.sugar !== undefined && item.sugar !== null;
      if (hasDirectFiber) totals.fiber += Number(item.fiber) || 0;
      if (hasDirectSugar) totals.sugar += Number(item.sugar) || 0;

      // Lookup food micros from database if item has foodId
      if (item.foodId) {
        const dbFood = DEFAULT_FOOD_DATABASE.find(f => f.id === item.foodId);
        if (dbFood && dbFood.per100g) {
          const mult = (Number(item.grams) || 100) / 100;
          const p = dbFood.per100g;
          if (!hasDirectFiber) totals.fiber += (p.fiber || 0) * mult;
          if (!hasDirectSugar) totals.sugar += (p.sugar || 0) * mult;
          totals.vitA += (p.vitA || 0) * mult;
          totals.vitC += (p.vitC || 0) * mult;
          totals.vitD += (p.vitD || 0) * mult;
          totals.vitE += (p.vitE || 0) * mult;
          totals.vitK += (p.vitK || 0) * mult;
          totals.vitB1 += (p.vitB1 || 0) * mult;
          totals.vitB2 += (p.vitB2 || 0) * mult;
          totals.vitB3 += (p.vitB3 || 0) * mult;
          totals.vitB6 += (p.vitB6 || 0) * mult;
          totals.vitB9 += (p.vitB9 || 0) * mult;
          totals.vitB12 += (p.vitB12 || 0) * mult;
          totals.calcium += (p.calcium || 0) * mult;
          totals.iron += (p.iron || 0) * mult;
          totals.magnesium += (p.magnesium || 0) * mult;
          totals.zinc += (p.zinc || 0) * mult;
          totals.potassium += (p.potassium || 0) * mult;
          totals.sodium += (p.sodium || 0) * mult;
          totals.phosphorus += (p.phosphorus || 0) * mult;
        }
      }
    });
  });

  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round(totals.fiber * 10) / 10;
  totals.sugar = Math.round(totals.sugar * 10) / 10;
  totals.saturatedFat = Math.round(totals.saturatedFat * 10) / 10;

  // Round micros
  totals.vitA = Math.round(totals.vitA);
  totals.vitC = Math.round(totals.vitC * 10) / 10;
  totals.vitD = Math.round(totals.vitD * 10) / 10;
  totals.calcium = Math.round(totals.calcium);
  totals.iron = Math.round(totals.iron * 10) / 10;
  totals.potassium = Math.round(totals.potassium);
  totals.sodium = Math.round(totals.sodium);
  totals.magnesium = Math.round(totals.magnesium);

  return totals;
}

export function computeMealTotals(mealItems = []) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, saturatedFat: 0 };
  mealItems.forEach(item => {
    totals.calories += Number(item.calories) || 0;
    totals.protein += Number(item.protein) || 0;
    totals.carbs += Number(item.carbs) || 0;
    totals.fat += Number(item.fat) || 0;
    totals.fiber += Number(item.fiber) || 0;
    totals.sugar += Number(item.sugar) || 0;
    totals.saturatedFat += Number(item.saturatedFat) || 0;
  });
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round(totals.fiber * 10) / 10;
  return totals;
}

// Recommended Daily Allowance (RDA) reference standards for adults
export const RDA_STANDARDS = {
  // Vitamins
  vitA: { name: 'Vitamin A', rda: 900, unit: 'mcg' },
  vitC: { name: 'Vitamin C', rda: 90, unit: 'mg' },
  vitD: { name: 'Vitamin D', rda: 20, unit: 'mcg' },
  vitE: { name: 'Vitamin E', rda: 15, unit: 'mg' },
  vitK: { name: 'Vitamin K', rda: 120, unit: 'mcg' },
  vitB1: { name: 'Thiamin (B1)', rda: 1.2, unit: 'mg' },
  vitB2: { name: 'Riboflavin (B2)', rda: 1.3, unit: 'mg' },
  vitB3: { name: 'Niacin (B3)', rda: 16, unit: 'mg' },
  vitB5: { name: 'Pantothenic Acid (B5)', rda: 5, unit: 'mg' },
  vitB6: { name: 'Vitamin B6', rda: 1.7, unit: 'mg' },
  vitB7: { name: 'Biotin (B7)', rda: 30, unit: 'mcg' },
  vitB9: { name: 'Folate (B9)', rda: 400, unit: 'mcg' },
  vitB12: { name: 'Vitamin B12', rda: 2.4, unit: 'mcg' },
  // Minerals
  calcium: { name: 'Calcium', rda: 1000, unit: 'mg' },
  iron: { name: 'Iron', rda: 18, unit: 'mg' },
  magnesium: { name: 'Magnesium', rda: 400, unit: 'mg' },
  zinc: { name: 'Zinc', rda: 11, unit: 'mg' },
  potassium: { name: 'Potassium', rda: 3400, unit: 'mg' },
  sodium: { name: 'Sodium (Limit)', rda: 2300, unit: 'mg', isLimit: true },
  phosphorus: { name: 'Phosphorus', rda: 700, unit: 'mg' },
  selenium: { name: 'Selenium', rda: 55, unit: 'mcg' },
  copper: { name: 'Copper', rda: 0.9, unit: 'mg' },
  manganese: { name: 'Manganese', rda: 2.3, unit: 'mg' },
  iodine: { name: 'Iodine', rda: 150, unit: 'mcg' }
};

export default {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
  calculateRecommendedTargets,
  calculateWeightGoalProgress,
  computeMovingAverage,
  computeDailyTotals,
  computeMealTotals,
  kgToLbs,
  lbsToKg,
  cmToIn,
  inToCm,
  formatWeight,
  formatHeight,
  formatMeasurement,
  ftInToCm,
  cmToFtIn,
  calculateStreak,
  RDA_STANDARDS
};
