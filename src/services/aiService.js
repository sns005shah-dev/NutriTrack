// NutriTrack AI Engine for Mobile (React Native / Expo) & PWA
// Dual-mode: Natural Language Text Meal Parsing + Multimodal Camera/Photo Vision Food Scanning
// Connects through Cloudflare Pages serverless proxy (/api/analyze-meal, /api/analyze-image)
// with direct client-side Gemini fallback.
// High-precision Indian food intelligence & packaged snack price recognition.

import { DEFAULT_FOOD_DATABASE } from '../data/foods.js';

export const DEFAULT_AI_KEY = process.env.EXPO_PUBLIC_AI_KEY || '';
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

// High-precision prompt template with Indian Food & Packaged Pricing Intelligence
export function buildTextMealPrompt(queryText) {
  return `You are a clinical nutrition specialist, Indian food expert, and food packaging database AI.
Analyze the user's meal input: "${queryText}".

CRITICAL PARSING RULES:
1. PACKAGED FOODS & PRICING:
   - When prices like ₹5, ₹10, ₹20, ₹30, Rs 10, or 10 rs appear (e.g. "Bingo Nachos ₹10 packet", "Lays ₹10 packet", "Kurkure ₹20"), interpret the number as an Indian rupee price point, NEVER as food weight in grams.
   - Do NOT assume a generic 150g portion for small packaged snacks! Standard Indian ₹5 packets are ~16g–20g (approx 80–110 kcal). Standard ₹10 packets are ~25g–35g (approx 130–180 kcal). Standard ₹20 packets are ~50g–70g (approx 260–360 kcal). For "Bingo Nachos ₹10 packet", standard net weight is approximately 30g–35g.
   - If the user provides packet weight, strictly use that weight.

2. INDIAN STREET & RESTAURANT FOODS:
   - "Beef roll" / "Chicken roll" (Kolkata/Kathi roll style): typically 1 paratha flatbread rolled with ~70-90g spiced cooked meat, sliced red onions, green chillies, and chutney/sauce. Typical net weight 180g–220g; 380–480 kcal; 22–28g protein; 35–45g carbs; 16–22g fat.
   - "Chicken biryani" / "Mutton biryani": 1 standard plate/portion (300g–350g) is ~500–650 kcal; 25–35g protein; 60–75g carbs; 15–22g fat.
   - "Roti" / "Chapati": 1 standard whole wheat roti (35g–40g) is ~100–115 kcal; 3g protein; 22g carbs; 1.2g fat.
   - "Besan chilla": 1 medium gram-flour savoury pancake (~70g) is ~135–150 kcal; 6–7g protein; 18–20g carbs; 4–5g fat.
   - "Samosa": 1 medium potato-filled samosa (~80g–90g) is ~220–260 kcal; 3.5g protein; 25–28g carbs; 12–15g fat.

3. MACRONUTRIENT CONSISTENCY:
   - Keep macro totals mathematically consistent: Calories ≈ (4 × Protein) + (4 × Carbs) + (9 × Fat) ± 5%.
   - Estimate fiber and sugar realistically.

4. ACCURACY GUARANTEE:
   - Every input MUST be individually evaluated. Never return identical generic values for distinct foods.
   - If portion is ambiguous, state standard assumption in the portion field (e.g. "1 standard packet (35g)").

You MUST respond strictly with a valid JSON object matching this schema without any markdown commentary:
{
  "meal_name": "string (concise descriptive name)",
  "items": [
    {
      "name": "string (food item name)",
      "portion": "string (e.g. 1 packet (35g), 1 roll (200g))",
      "weight_g": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "total_fiber": number,
  "total_sugar": number
}`;
}

// Normalizes and sanitizes AI response items
function normalizeAiResponse(parsed, targetModel, source) {
  if (parsed.items && Array.isArray(parsed.items)) {
    parsed.items = parsed.items.map((item, idx) => ({
      id: `ai_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 4)}`,
      name: item.name || 'Food item',
      portion: item.portion || `${item.weight_g || item.grams || 100}g`,
      grams: Number(item.weight_g || item.grams) || 100,
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

  // Recalculate totals from items for internal consistency
  const items = parsed.items || [];
  parsed.total_calories = items.reduce((acc, i) => acc + (i.calories || 0), 0);
  parsed.total_protein = Math.round(items.reduce((acc, i) => acc + (i.protein || 0), 0) * 10) / 10;
  parsed.total_carbs = Math.round(items.reduce((acc, i) => acc + (i.carbs || 0), 0) * 10) / 10;
  parsed.total_fat = Math.round(items.reduce((acc, i) => acc + (i.fat || 0), 0) * 10) / 10;
  parsed.total_fiber = Math.round(items.reduce((acc, i) => acc + (i.fiber || 0), 0) * 10) / 10;
  parsed.total_sugar = Math.round(items.reduce((acc, i) => acc + (i.sugar || 0), 0) * 10) / 10;

  parsed.source = source || 'gemini_text';
  parsed.modelUsed = targetModel;
  return parsed;
}

// 1. Natural Language Text Meal Parsing
export async function analyzeMealText(queryText, userApiKey = '', model = PRIMARY_MODEL) {
  if (!queryText || !queryText.trim()) {
    throw new Error('Please enter a meal description.');
  }

  const cleanQuery = queryText.trim();
  const apiKey = cleanApiKey(userApiKey);
  const targetModel = model === 'auto' || !model ? PRIMARY_MODEL : model;

  // STEP 1: Attempt Cloudflare Pages Serverless Proxy (/api/analyze-meal)
  try {
    const proxyRes = await fetch('/api/analyze-meal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
      },
      body: JSON.stringify({ queryText: cleanQuery, model: targetModel })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.items && data.items.length > 0) {
        return normalizeAiResponse(data, targetModel, 'gemini_server_proxy');
      }
    } else if (proxyRes.status !== 404) {
      // 404 indicates the Cloudflare Function is not running (e.g. local Metro or pure static hosting).
      // Any other status (400, 401, 403, 500) represents an explicit error from the server.
      const errJson = await proxyRes.json().catch(() => ({}));
      // If 401 and user has provided a client-side key, fallback to direct Gemini endpoint below
      if (proxyRes.status === 401 && apiKey) {
        console.info('Proxy returned 401 without server key; falling back to client-provided key.');
      } else if (errJson.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err) {
    // If error is an explicit rejection from the server, propagate it to inform the user
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('404')) {
      throw err;
    }
  }

  // STEP 2: Direct Google Gemini API Call (Fallback for local dev or static hosting)
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please enter your API key in Settings > Google Gemini AI Engine.'
    );
  }

  const prompt = buildTextMealPrompt(cleanQuery);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        response_mime_type: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = `Gemini API error (HTTP ${response.status})`;
    try {
      const parsedErr = JSON.parse(errorText);
      if (parsedErr.error && parsedErr.error.message) {
        errMsg = parsedErr.error.message;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    throw new Error('AI returned an empty response. Please describe the meal in more detail.');
  }

  const cleanJson = repairJsonString(rawText);
  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (parseErr) {
    throw new Error('AI returned an unparseable response format. Please try again.');
  }

  return normalizeAiResponse(parsed, targetModel, 'gemini_direct_client');
}

// 2. Multimodal Camera / Photo Food Scanning
export async function analyzeFoodImage(base64Data, mimeType = 'image/jpeg', userApiKey = '', model = PRIMARY_MODEL) {
  if (!base64Data) {
    throw new Error('No image data provided for scanning.');
  }

  const apiKey = cleanApiKey(userApiKey);
  const pureBase64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '').trim();
  const targetModel = model === 'auto' || !model ? PRIMARY_MODEL : model;

  // STEP 1: Attempt Cloudflare Pages Serverless Proxy (/api/analyze-image)
  try {
    const proxyRes = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'x-gemini-api-key': apiKey } : {})
      },
      body: JSON.stringify({ imageBase64: pureBase64, mimeType, model: targetModel })
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      if (data && data.items && data.items.length > 0) {
        return normalizeAiResponse(data, targetModel, 'gemini_vision_proxy');
      }
    } else if (proxyRes.status !== 404) {
      const errJson = await proxyRes.json().catch(() => ({}));
      if (proxyRes.status === 401 && apiKey) {
        console.info('Proxy returned 401; falling back to direct client key.');
      } else if (errJson.error) {
        throw new Error(errJson.error);
      }
    }
  } catch (err) {
    if (err.message && !err.message.includes('fetch') && !err.message.includes('NetworkError') && !err.message.includes('404')) {
      throw err;
    }
  }

  // STEP 2: Direct Google Gemini API Call
  if (!apiKey) {
    throw new Error(
      'Gemini API key is not configured. Please enter your API key in Settings > Google Gemini AI Engine.'
    );
  }

  const prompt = `You are an elite AI clinical nutritionist and food computer vision specialist.
Carefully examine the foods and beverages visible on this plate or in this photo.
Identify every distinct item, estimate realistic portion sizes, approximate weight in grams, and calculate USDA-calibrated nutritional values (calories, protein, carbs, fat, fiber, sugar).

You MUST respond strictly with a valid JSON object matching this schema without any extra markdown:
{
  "meal_name": "string (concise descriptive name of the meal/dish)",
  "items": [
    {
      "name": "string (specific food item name)",
      "portion": "string (e.g. 1 medium piece, 1 cup, 150g)",
      "weight_g": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number
    }
  ],
  "total_calories": number,
  "total_protein": number,
  "total_carbs": number,
  "total_fat": number,
  "total_fiber": number,
  "total_sugar": number
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errMsg = `Photo AI Scan failed (HTTP ${response.status})`;
    try {
      const parsedErr = JSON.parse(errorText);
      if (parsedErr.error && parsedErr.error.message) {
        errMsg = parsedErr.error.message;
      }
    } catch (e) {}
    throw new Error(errMsg);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini Vision returned an empty analysis. Please take a clearer photo under good lighting.');
  }

  const cleanJson = repairJsonString(rawText);
  let parsed;
  try {
    parsed = JSON.parse(cleanJson);
  } catch (e) {
    throw new Error('Failed to parse image recognition output. Please try again.');
  }

  return normalizeAiResponse(parsed, targetModel, 'gemini_vision_direct');
}

// Offline heuristic fallback parser ONLY for verified catalogued items
export function parseMealOffline(text) {
  const query = text.toLowerCase().trim();
  const foundItems = [];
  const phrases = query.split(/\band\b|\+|\band\/or\b|,|&/i).map(s => s.trim()).filter(Boolean);

  for (const phrase of phrases) {
    let multiplier = 1;
    let cleanPhrase = phrase;

    const countMatch = phrase.match(/^(\d+(?:\.\d+)?)\s*(?:slices?|pieces?|large|cups?|bowls?)?\s+(.*)/i);
    const weightMatch = phrase.match(/^(\d+(?:\.\d+)?)\s*(?:g|grams)\s+(.*)/i);

    if (weightMatch) {
      multiplier = parseFloat(weightMatch[1]) / 100;
      cleanPhrase = weightMatch[2].trim();
    } else if (countMatch) {
      multiplier = parseFloat(countMatch[1]);
      cleanPhrase = countMatch[2].trim();
    }

    // Match against verified USDA database
    const dbMatch = DEFAULT_FOOD_DATABASE.find(f =>
      f.name.toLowerCase() === cleanPhrase ||
      cleanPhrase.includes(f.name.toLowerCase()) ||
      f.name.toLowerCase().includes(cleanPhrase)
    );

    if (dbMatch) {
      const p100 = dbMatch.per100g || {};
      const baseGrams = dbMatch.servingSize || 100;
      const actualGrams = Math.round(baseGrams * multiplier);
      const mult = actualGrams / 100;

      foundItems.push({
        id: 'off_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
        name: dbMatch.name,
        portion: `${actualGrams}g (${dbMatch.servingDesc || 'standard serving'})`,
        grams: actualGrams,
        calories: Math.round((p100.calories || 0) * mult),
        protein: Math.round((p100.protein || 0) * mult * 10) / 10,
        carbs: Math.round((p100.carbs || 0) * mult * 10) / 10,
        fat: Math.round((p100.fat || 0) * mult * 10) / 10,
        fiber: Math.round((p100.fiber || 0) * mult * 10) / 10,
        sugar: Math.round((p100.sugar || 0) * mult * 10) / 10,
        icon: dbMatch.icon || getFoodIcon(dbMatch.name)
      });
    }
  }

  if (foundItems.length > 0) {
    let totCal = 0, totProt = 0, totCarb = 0, totFat = 0, totFib = 0, totSug = 0;
    foundItems.forEach(i => {
      totCal += i.calories;
      totProt += i.protein;
      totCarb += i.carbs;
      totFat += i.fat;
      totFib += i.fiber;
      totSug += (i.sugar || 0);
    });
    return {
      meal_name: text.length > 30 ? text.substring(0, 30) + '...' : text,
      items: foundItems,
      total_calories: Math.round(totCal),
      total_protein: Math.round(totProt * 10) / 10,
      total_carbs: Math.round(totCarb * 10) / 10,
      total_fat: Math.round(totFat * 10) / 10,
      total_fiber: Math.round(totFib * 10) / 10,
      total_sugar: Math.round(totSug * 10) / 10,
      source: 'offline_database_match'
    };
  }

  return null;
}

// Icon helper
export function getFoodIcon(name = '') {
  const n = (name || '').toLowerCase();
  if (n.includes('biryani') || n.includes('pulao')) return '🍛';
  if (n.includes('egg')) return '🥚';
  if (n.includes('bread') || n.includes('toast')) return '🍞';
  if (n.includes('roti') || n.includes('chapati') || n.includes('naan')) return '🫓';
  if (n.includes('roll') || n.includes('wrap') || n.includes('kathi')) return '🌯';
  if (n.includes('nacho') || n.includes('chips') || n.includes('crisps') || n.includes('bingo')) return '🥨';
  if (n.includes('chicken') || n.includes('poultry')) return '🍗';
  if (n.includes('beef') || n.includes('steak') || n.includes('meat')) return '🥩';
  if (n.includes('salmon') || n.includes('fish') || n.includes('tuna') || n.includes('prawn')) return '🐟';
  if (n.includes('rice')) return '🍚';
  if (n.includes('salad') || n.includes('spinach') || n.includes('lettuce')) return '🥗';
  if (n.includes('apple')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('berry') || n.includes('blueberry')) return '🫐';
  if (n.includes('milk') || n.includes('yogurt') || n.includes('curd') || n.includes('dahi')) return '🥛';
  if (n.includes('cheese') || n.includes('paneer')) return '🧀';
  if (n.includes('coffee') || n.includes('tea') || n.includes('chai')) return '☕';
  if (n.includes('chilla') || n.includes('dosa') || n.includes('pancake')) return '🥞';
  if (n.includes('samosa') || n.includes('pakora') || n.includes('snack')) return '🥟';
  if (n.includes('dal') || n.includes('curry') || n.includes('sabzi')) return '🍲';
  return '🍽️';
}

export default {
  analyzeMealText,
  analyzeFoodImage,
  parseMealOffline,
  repairJsonString,
  cleanApiKey,
  buildTextMealPrompt,
  getFoodIcon
};
