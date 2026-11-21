// NutriTrack AI Engine for Mobile (React Native / Expo)
// Dual-mode: Natural Language Text Meal Parsing + Multimodal Camera/Photo Vision Food Scanning
// Powered by Google Gemini 3.5 Flash-Lite with compound meal heuristic fallback and JSON auto-repair.

import { DEFAULT_FOOD_DATABASE } from '../data/foods';

export const DEFAULT_AI_KEY = process.env.EXPO_PUBLIC_AI_KEY;
export const PRIMARY_MODEL = 'gemini-3.5-flash-lite';

export const VERIFIED_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemma-4-26b-a4b-it',
  'gemini-3.8-flash',
  'gemini-3.5-flash'
];

// Clean API key
export function cleanApiKey(key) {
  if (!key) return DEFAULT_AI_KEY;
  return key.trim().replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
}

// Multi-pass JSON sanitizer to prevent malformed syntax errors
export function repairJsonString(raw) {
  if (!raw) return '';
  let str = raw.trim();

  // Strip Markdown code fences ```json ... ```
  str = str.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  // Find outermost JSON object or array
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;
  let isObject = true;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    isObject = true;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isObject = false;
  }

  if (startIdx !== -1) {
    const endChar = isObject ? '}' : ']';
    const lastIdx = str.lastIndexOf(endChar);
    if (lastIdx > startIdx) {
      str = str.substring(startIdx, lastIdx + 1);
    }
  }

  // Remove trailing commas before closing braces/brackets
  str = str.replace(/,\s*([}\]])/g, '$1');

  // Remove units attached to numbers e.g. "calories": 150g -> "calories": 150
  str = str.replace(/:\s*([0-9]+(?:\.[0-9]+)?)\s*(?:g|mg|kcal|cal|ml)\b/gi, ': $1');

  // Fix unquoted property names e.g. { name: "egg" } -> { "name": "egg" }
  str = str.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

  return str;
}

// Compound meal heuristic database for instant offline fallback
export const HEURISTIC_DATABASE = {
  'egg': { name: 'Boiled Egg', portion: '1 large egg (50g)', grams: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, icon: '🥚' },
  'boiled egg': { name: 'Boiled Egg', portion: '1 large egg (50g)', grams: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8, fiber: 0, icon: '🥚' },
  'scrambled egg': { name: 'Scrambled Egg', portion: '1 egg (50g)', grams: 50, calories: 91, protein: 6.3, carbs: 0.8, fat: 6.7, fiber: 0, icon: '🍳' },
  'bread': { name: 'Bread Slice', portion: '1 slice (45g)', grams: 45, calories: 115, protein: 4.0, carbs: 22.0, fat: 1.2, fiber: 1.5, icon: '🍞' },
  'toast': { name: 'Toast Slice', portion: '1 slice (45g)', grams: 45, calories: 115, protein: 4.0, carbs: 22.0, fat: 1.2, fiber: 1.5, icon: '🍞' },
  'roti': { name: 'Whole Wheat Roti', portion: '1 roti (40g)', grams: 40, calories: 109, protein: 3.0, carbs: 21.0, fat: 1.2, fiber: 2.8, icon: '🫓' },
  'chapati': { name: 'Chapati', portion: '1 chapati (40g)', grams: 40, calories: 109, protein: 3.0, carbs: 21.0, fat: 1.2, fiber: 2.8, icon: '🫓' },
  'chicken biryani': { name: 'Chicken Biryani', portion: '100g portion', grams: 100, calories: 180, protein: 9.5, carbs: 22.0, fat: 6.0, fiber: 1.0, icon: '🍛' },
  'biryani': { name: 'Biryani', portion: '100g portion', grams: 100, calories: 180, protein: 8.5, carbs: 24.0, fat: 5.5, fiber: 1.0, icon: '🍛' },
  'besan chilla': { name: 'Besan Chilla', portion: '1 chilla (70g)', grams: 70, calories: 140, protein: 6.5, carbs: 18.0, fat: 4.5, fiber: 3.0, icon: '🥞' },
  'chilla': { name: 'Besan Chilla', portion: '1 chilla (70g)', grams: 70, calories: 140, protein: 6.5, carbs: 18.0, fat: 4.5, fiber: 3.0, icon: '🥞' },
  'rice': { name: 'Steamed Rice', portion: '1 cup cooked (150g)', grams: 150, calories: 195, protein: 4.0, carbs: 43.0, fat: 0.4, fiber: 0.6, icon: '🍚' },
  'chicken breast': { name: 'Grilled Chicken Breast', portion: '150g fillet', grams: 150, calories: 247, protein: 46.5, carbs: 0, fat: 5.4, fiber: 0, icon: '🍗' },
  'chicken': { name: 'Chicken', portion: '100g cooked', grams: 100, calories: 180, protein: 25.0, carbs: 0, fat: 8.0, fiber: 0, icon: '🍗' },
  'salmon': { name: 'Baked Salmon', portion: '150g fillet', grams: 150, calories: 309, protein: 33.0, carbs: 0, fat: 18.5, fiber: 0, icon: '🐟' },
  'apple': { name: 'Fresh Apple', portion: '1 medium (182g)', grams: 182, calories: 95, protein: 0.5, carbs: 25.0, fat: 0.3, fiber: 4.4, icon: '🍎' },
  'banana': { name: 'Banana', portion: '1 medium (118g)', grams: 118, calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, fiber: 3.1, icon: '🍌' },
  'oats': { name: 'Rolled Oats (Cooked)', portion: '1 cup (234g)', grams: 234, calories: 166, protein: 5.9, carbs: 28.1, fat: 3.6, fiber: 4.0, icon: '🥣' },
  'magaz': { name: 'Magaz (Brain Curry)', portion: 'half bowl (100g)', grams: 100, calories: 135, protein: 10.0, carbs: 2.0, fat: 9.5, fiber: 0, icon: '🍲' }
};

// Offline heuristic fallback parser
export function parseMealOffline(text) {
  const query = text.toLowerCase().trim();
  const foundItems = [];

  // Split query on 'and', '+', ',', '&'
  const phrases = query.split(/\band\b|\+|\band\/or\b|,|&/i).map(s => s.trim()).filter(Boolean);

  for (const phrase of phrases) {
    // Check quantity prefix e.g. "2 boiled eggs", "100g chicken biryani", "half bowl magaz"
    let multiplier = 1;
    let cleanPhrase = phrase;

    const countMatch = phrase.match(/^(\d+(?:\.\d+)?)\s*(?:slices?|pieces?|large|cups?|bowls?)?\s+(.*)/i);
    const weightMatch = phrase.match(/^(\d+(?:\.\d+)?)\s*(?:g|grams)\s+(.*)/i);
    const halfMatch = phrase.match(/^half\s+(?:bowl|cup|plate)?\s*(.*)/i);

    if (weightMatch) {
      multiplier = parseFloat(weightMatch[1]) / 100;
      cleanPhrase = weightMatch[2].trim();
    } else if (countMatch) {
      multiplier = parseFloat(countMatch[1]);
      cleanPhrase = countMatch[2].trim();
    } else if (halfMatch) {
      multiplier = 0.5;
      cleanPhrase = halfMatch[1].trim();
    }

    // Match against heuristic keys
    let matchedKey = null;
    for (const key of Object.keys(HEURISTIC_DATABASE)) {
      if (cleanPhrase.includes(key) || key.includes(cleanPhrase)) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      const base = HEURISTIC_DATABASE[matchedKey];
      foundItems.push({
        id: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: base.name,
        portion: multiplier !== 1 ? `${multiplier}x ${base.portion}` : base.portion,
        grams: Math.round(base.grams * multiplier),
        calories: Math.round(base.calories * multiplier),
        protein: Math.round(base.protein * multiplier * 10) / 10,
        carbs: Math.round(base.carbs * multiplier * 10) / 10,
        fat: Math.round(base.fat * multiplier * 10) / 10,
        fiber: Math.round(base.fiber * multiplier * 10) / 10,
        icon: base.icon
      });
    }
  }

  if (foundItems.length > 0) {
    let totCal = 0, totProt = 0, totCarb = 0, totFat = 0, totFib = 0;
    foundItems.forEach(i => {
      totCal += i.calories;
      totProt += i.protein;
      totCarb += i.carbs;
      totFat += i.fat;
      totFib += i.fiber;
    });
    return {
      meal_name: text.length > 30 ? text.substring(0, 30) + '...' : text,
      items: foundItems,
      total_calories: Math.round(totCal),
      total_protein: Math.round(totProt * 10) / 10,
      total_carbs: Math.round(totCarb * 10) / 10,
      total_fat: Math.round(totFat * 10) / 10,
      total_fiber: Math.round(totFib * 10) / 10,
      source: 'offline_heuristic'
    };
  }

  // Generic estimation if completely uncatalogued
  return {
    meal_name: text,
    items: [
      {
        id: 'off_gen_' + Date.now(),
        name: text,
        portion: '1 serving (150g)',
        grams: 150,
        calories: 250,
        protein: 12.0,
        carbs: 30.0,
        fat: 8.0,
        fiber: 2.0,
        icon: '🍽️'
      }
    ],
    total_calories: 250,
    total_protein: 12.0,
    total_carbs: 30.0,
    total_fat: 8.0,
    total_fiber: 2.0,
    source: 'offline_heuristic_generic'
  };
}

// 1. Natural Language Text Meal Parsing
export async function analyzeMealText(queryText, userApiKey = '', model = PRIMARY_MODEL) {
  if (!queryText || !queryText.trim()) {
    throw new Error('Please enter a meal description.');
  }

  const apiKey = cleanApiKey(userApiKey);
  const prompt = `You are a clinical dietitian and precise nutrition database AI.
Analyze the following food/meal input: "${queryText.trim()}".

Break down every individual food item and estimate portion size, weight in grams, calories, protein (g), carbs (g), fat (g), and fiber (g). Calibrate using USDA FoodData Central.

You MUST respond strictly with a valid JSON object matching this schema without any markdown commentary:
{
  "meal_name": "string (concise title of the meal)",
  "items": [
    {
      "name": "string (food name)",
      "portion": "string (e.g. 2 large eggs, 100g, 1 slice)",
      "weight_g": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "total_fiber": number
}`;

  const targetModel = model === 'auto' || !model ? PRIMARY_MODEL : model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json'
        }
      })
    });

    if (!response.ok) {
      console.warn(`Gemini text API responded with HTTP ${response.status}. Using offline heuristic fallback.`);
      return parseMealOffline(queryText);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return parseMealOffline(queryText);
    }

    const cleanJson = repairJsonString(rawText);
    const parsed = JSON.parse(cleanJson);

    // Normalize items with icons and IDs
    if (parsed.items && Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map((item, idx) => ({
        id: `ai_${Date.now()}_${idx}`,
        name: item.name || 'Food item',
        portion: item.portion || `${item.weight_g || 100}g`,
        grams: Number(item.weight_g) || 100,
        calories: Math.round(Number(item.calories) || 0),
        protein: Math.round((Number(item.protein) || 0) * 10) / 10,
        carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
        fat: Math.round((Number(item.fat) || 0) * 10) / 10,
        fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
        sugar: Math.round((Number(item.sugar) || 0) * 10) / 10,
        saturatedFat: Math.round((Number(item.saturatedFat) || 0) * 10) / 10,
        icon: getFoodIcon(item.name)
      }));
    }

    parsed.source = 'gemini_text';
    parsed.modelUsed = targetModel;
    return parsed;
  } catch (err) {
    console.warn('analyzeMealText error, using heuristic fallback:', err.message);
    return parseMealOffline(queryText);
  }
}

// 2. Multimodal Camera / Photo Food Scanning
export async function analyzeFoodImage(base64Data, mimeType = 'image/jpeg', userApiKey = '', model = PRIMARY_MODEL) {
  if (!base64Data) {
    throw new Error('No image data provided for scanning.');
  }

  const apiKey = cleanApiKey(userApiKey);
  // Clean base64 string if it contains data URI prefix
  const pureBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '').trim();

  const prompt = `You are an elite AI nutritionist and computer vision food expert.
Carefully examine the foods and beverages visible in this image.
Identify every item on the plate, estimate standard portion sizes, approximate weight in grams, and calculate USDA-calibrated nutritional values (calories, protein, carbs, fat, fiber).

You MUST respond strictly with a valid JSON object matching this schema without any extra markdown:
{
  "meal_name": "string (concise descriptive name of the meal/dish)",
  "items": [
    {
      "name": "string (specific food item name)",
      "portion": "string (e.g. 1 medium fillet, 1 cup, 100g)",
      "weight_g": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "total_fiber": number
}`;

  const targetModel = model === 'auto' || !model ? PRIMARY_MODEL : model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: mimeType,
              data: pureBase64
            }
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.15,
      response_mime_type: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Photo AI Scan failed with HTTP ${response.status}: ${errorText.substring(0, 150)}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini vision model returned an empty analysis.');
  }

  const cleanJson = repairJsonString(rawText);
  const parsed = JSON.parse(cleanJson);

  if (parsed.items && Array.isArray(parsed.items)) {
    parsed.items = parsed.items.map((item, idx) => ({
      id: `scan_${Date.now()}_${idx}`,
      name: item.name || 'Recognized Item',
      portion: item.portion || `${item.weight_g || 100}g`,
      grams: Number(item.weight_g) || 100,
      calories: Math.round(Number(item.calories) || 0),
      protein: Math.round((Number(item.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(item.carbs) || 0) * 10) / 10,
      fat: Math.round((Number(item.fat) || 0) * 10) / 10,
      fiber: Math.round((Number(item.fiber) || 0) * 10) / 10,
      sugar: Math.round((Number(item.sugar) || 0) * 10) / 10,
      saturatedFat: Math.round((Number(item.saturatedFat) || 0) * 10) / 10,
      icon: getFoodIcon(item.name)
    }));
  }

  parsed.source = 'gemini_vision';
  parsed.modelUsed = targetModel;
  return parsed;
}

// Icon helper
export function getFoodIcon(name = '') {
  const n = name.toLowerCase();
  if (n.includes('egg')) return '🥚';
  if (n.includes('bread') || n.includes('toast')) return '🍞';
  if (n.includes('roti') || n.includes('chapati') || n.includes('naan')) return '🫓';
  if (n.includes('chicken') || n.includes('poultry')) return '🍗';
  if (n.includes('beef') || n.includes('steak')) return '🥩';
  if (n.includes('salmon') || n.includes('fish') || n.includes('tuna')) return '🐟';
  if (n.includes('rice') || n.includes('biryani')) return '🍚';
  if (n.includes('salad') || n.includes('spinach') || n.includes('lettuce')) return '🥗';
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('berry') || n.includes('blueberry')) return '🫐';
  if (n.includes('milk') || n.includes('yogurt')) return '🥛';
  if (n.includes('cheese')) return '🧀';
  if (n.includes('coffee')) return '☕';
  if (n.includes('chilla') || n.includes('pancake')) return '🥞';
  if (n.includes('magaz') || n.includes('curry')) return '🍲';
  return '🍽️';
}

export default {
  analyzeMealText,
  analyzeFoodImage,
  parseMealOffline,
  repairJsonString,
  cleanApiKey
};
