// NutriTrack Mobile Storage Service
// Offline-first persistence using AsyncStorage with data export/import capabilities.
// Manages food diary logs, weight history, body measurements, body composition, and profile targets.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocalDateString } from './dateService';

export { getLocalDateString };
export const getTodayDateString = getLocalDateString;

const APP_STATE_KEY = '@nutritrack_app_state_v1';
const AI_CONFIG_KEY = '@nutritrack_ai_config_v1';

// In-memory fallback cache for restricted browser/PWA contexts
const memCache = {};

export const INITIAL_USER_PROFILE = {
  name: '',
  calorieTarget: 2000,
  proteinTarget: 130, // grams
  carbsTarget: 220,   // grams
  fatTarget: 65,      // grams
  fiberTarget: 30,    // grams
  sugarTarget: 50,    // grams (AHA/WHO recommended upper limit)
  waterTargetMl: 2500, // ml
  weightKg: 70.0,     // current weight
  startingWeightKg: 70.0, // starting weight
  targetWeightKg: 65.0,   // goal weight
  targetWeightDate: '',   // optional target date
  heightCm: 170,
  age: 28,
  gender: 'skip',     // 'male' | 'female' | 'skip'
  activityLevel: 'moderate',
  goal: 'lose',       // 'lose' | 'build_muscle' | 'gain' | 'maintain'
  dietaryPreference: 'non_vegetarian', // 'vegetarian' | 'non_vegetarian' | 'vegan' | 'eggetarian' | 'other'
  weightUnit: 'kg',   // 'kg' | 'lbs'
  heightUnit: 'cm',   // 'cm' | 'ft/in'
  measurementUnit: 'cm' // 'cm' | 'in'
};

export const INITIAL_AI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_AI_KEY || '',
  model: 'auto',
  activeModel: 'gemini-3.5-flash-lite'
};

// Clean first-time state for brand-new users (NO fabricated food, weight or measurement entries)
export function createFreshInitialState() {
  const today = getTodayDateString(0);
  return {
    version: '2.0.0',
    onboardingCompleted: false,
    currentDate: today,
    userProfile: { ...INITIAL_USER_PROFILE },
    customFoods: [],
    weightLogs: [],
    measurementLogs: [],
    compositionLogs: [],
    hydrationLogs: [],
    logs: {
      [today]: {
        waterMl: 0,
        meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
      }
    }
  };
}

function createInitialSeedData() {
  const today = getTodayDateString(0);
  const yesterday = getTodayDateString(-1);
  const dayBefore = getTodayDateString(-2);

  // Generate historical weight logs (e.g. over past 30 days) to demonstrate trends
  const weightLogs = [
    { id: 'w_1', date: getTodayDateString(-28), weightKg: 78.0, note: 'Starting weight check-in' },
    { id: 'w_2', date: getTodayDateString(-21), weightKg: 77.2, note: 'Week 1 progress' },
    { id: 'w_3', date: getTodayDateString(-14), weightKg: 76.4, note: 'Feeling lighter' },
    { id: 'w_4', date: getTodayDateString(-7), weightKg: 75.3, note: 'Steady deficit' },
    { id: 'w_5', date: getTodayDateString(-2), weightKg: 74.6, note: 'Morning weigh-in' },
    { id: 'w_6', date: today, weightKg: 74.2, note: 'Current weight' }
  ];

  // Initial body measurements
  const measurementLogs = [
    {
      id: 'm_1',
      date: getTodayDateString(-28),
      chest: 102,
      waist: 88,
      hips: 98,
      leftArm: 34,
      rightArm: 34.5,
      thighs: 58,
      neck: 38,
      calves: 37
    },
    {
      id: 'm_2',
      date: today,
      chest: 100,
      waist: 84,
      hips: 96,
      leftArm: 34,
      rightArm: 34.2,
      thighs: 56.5,
      neck: 37.5,
      calves: 36.8
    }
  ];

  // Initial body composition
  const compositionLogs = [
    {
      id: 'c_1',
      date: getTodayDateString(-28),
      bodyFatPct: 19.5,
      muscleMassKg: 34.2,
      leanMassKg: 62.8
    },
    {
      id: 'c_2',
      date: today,
      bodyFatPct: 17.8,
      muscleMassKg: 34.0,
      leanMassKg: 61.0
    }
  ];

  return {
    currentDate: today,
    userProfile: { ...INITIAL_USER_PROFILE },
    customFoods: [],
    weightLogs,
    measurementLogs,
    compositionLogs,
    logs: {
      [today]: {
        waterMl: 1500,
        meals: {
          breakfast: [
            {
              id: 'log_b1',
              foodId: 'f_eggs',
              name: 'Whole Egg (Large, Boiled)',
              portion: '2 large eggs (100g)',
              grams: 100,
              calories: 143,
              protein: 12.6,
              carbs: 0.7,
              fat: 9.5,
              fiber: 0,
              sugar: 0.7,
              saturatedFat: 3.1,
              icon: '🥚'
            },
            {
              id: 'log_b2',
              foodId: 'f_whole_wheat_bread',
              name: 'Whole Wheat Bread',
              portion: '2 slices (90g)',
              grams: 90,
              calories: 222,
              protein: 11.2,
              carbs: 37.1,
              fat: 3.1,
              fiber: 6.1,
              sugar: 4.2,
              saturatedFat: 0.6,
              icon: '🍞'
            }
          ],
          lunch: [
            {
              id: 'log_l1',
              foodId: 'f_chicken_breast',
              name: 'Chicken Breast (Grilled)',
              portion: '1 medium breast (150g)',
              grams: 150,
              calories: 247,
              protein: 46.5,
              carbs: 0,
              fat: 5.4,
              fiber: 0,
              sugar: 0,
              saturatedFat: 1.5,
              icon: '🍗'
            },
            {
              id: 'log_l2',
              foodId: 'f_brown_rice',
              name: 'Brown Rice (Cooked)',
              portion: '1 cup cooked (150g)',
              grams: 150,
              calories: 184,
              protein: 3.9,
              carbs: 38.4,
              fat: 1.4,
              fiber: 2.7,
              sugar: 0.3,
              saturatedFat: 0.3,
              icon: '🍚'
            }
          ],
          dinner: [],
          snacks: []
        }
      },
      [yesterday]: {
        waterMl: 2200,
        meals: {
          breakfast: [
            {
              id: 'log_yb1',
              foodId: 'f_oats',
              name: 'Rolled Oats (Cooked)',
              portion: '1 cup cooked (234g)',
              grams: 234,
              calories: 166,
              protein: 5.9,
              carbs: 28.1,
              fat: 3.6,
              fiber: 4.0,
              sugar: 1.1,
              saturatedFat: 0.6,
              icon: '🥣'
            }
          ],
          lunch: [],
          dinner: [],
          snacks: []
        }
      }
    }
  };
}

export const StorageService = {
  async loadAppState() {
    let raw = null;
    try {
      raw = await AsyncStorage.getItem(APP_STATE_KEY);
      if (raw) {
        memCache[APP_STATE_KEY] = raw;
      }
    } catch (e) {
      console.warn('StorageService.loadAppState AsyncStorage error, falling back to memory:', e);
      raw = memCache[APP_STATE_KEY] || null;
    }

    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure core collections exist
        if (!parsed.logs) parsed.logs = {};
        if (!parsed.weightLogs) parsed.weightLogs = [];
        if (!parsed.measurementLogs) parsed.measurementLogs = [];
        if (!parsed.compositionLogs) parsed.compositionLogs = [];
        if (!Array.isArray(parsed.hydrationLogs)) {
          const migrated = [];
          Object.entries(parsed.logs || {}).forEach(([dateKey, dayObj]) => {
            const legacyWater = Math.round(Number(dayObj?.waterMl) || 0);
            if (legacyWater > 0) {
              migrated.push({
                id: `hyd_migrated_${dateKey}`,
                date: dateKey.slice(0, 10),
                timestamp: `${dateKey.slice(0, 10)}T12:00:00.000Z`,
                amountMl: legacyWater
              });
            }
          });
          parsed.hydrationLogs = migrated;
        }
        if (!parsed.userProfile) parsed.userProfile = { ...INITIAL_USER_PROFILE };

        // For returning users who already had data, ensure onboardingCompleted is true
        if (parsed.onboardingCompleted === undefined) {
          const hasExistingActivity =
            (parsed.weightLogs && parsed.weightLogs.length > 0) ||
            Object.values(parsed.logs || {}).some(
              (day) =>
                day?.meals &&
                Object.values(day.meals).some((m) => Array.isArray(m) && m.length > 0)
            );
          parsed.onboardingCompleted = hasExistingActivity;
        }

        // Ensure userProfile has unit fields & defaults
        parsed.userProfile = {
          ...INITIAL_USER_PROFILE,
          ...parsed.userProfile
        };

        // Ensure today's log exists
        const today = getTodayDateString(0);
        if (!parsed.logs[today]) {
          parsed.logs[today] = {
            waterMl: 0,
            meals: { breakfast: [], lunch: [], dinner: [], snacks: [] }
          };
        }
        return parsed;
      } catch (err) {
        console.warn('Failed to parse app state JSON:', err);
      }
    }

    // Brand new user: return clean initial state without fake data
    const fresh = createFreshInitialState();
    await this.saveAppState(fresh);
    return fresh;
  },

  async resetToFreshState() {
    const fresh = createFreshInitialState();
    await this.saveAppState(fresh);
    return fresh;
  },

  async saveAppState(state) {
    const serialized = JSON.stringify(state);
    memCache[APP_STATE_KEY] = serialized;
    try {
      await AsyncStorage.setItem(APP_STATE_KEY, serialized);
    } catch (e) {
      console.error('StorageService.saveAppState error (saved to memory cache):', e);
    }
  },

  async loadAiConfig() {
    let raw = null;
    try {
      raw = await AsyncStorage.getItem(AI_CONFIG_KEY);
      if (raw) {
        memCache[AI_CONFIG_KEY] = raw;
      }
    } catch (e) {
      console.warn('StorageService.loadAiConfig error, falling back to memory:', e);
      raw = memCache[AI_CONFIG_KEY] || null;
    }

    if (raw) {
      try {
        return { ...INITIAL_AI_CONFIG, ...JSON.parse(raw) };
      } catch (err) {
        console.warn('Failed to parse AI config JSON:', err);
      }
    }
    return { ...INITIAL_AI_CONFIG };
  },

  async saveAiConfig(cfg) {
    const serialized = JSON.stringify(cfg);
    memCache[AI_CONFIG_KEY] = serialized;
    try {
      await AsyncStorage.setItem(AI_CONFIG_KEY, serialized);
    } catch (e) {
      console.error('StorageService.saveAiConfig error (saved to memory cache):', e);
    }
  },

  async exportAllData() {
    const state = await this.loadAppState();
    const aiConfig = await this.loadAiConfig();
    return JSON.stringify({
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
      state,
      aiConfig
    }, null, 2);
  },

  async importAllData(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data.state) {
        await this.saveAppState(data.state);
      }
      if (data.aiConfig) {
        await this.saveAiConfig(data.aiConfig);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

export default StorageService;
