// Cloudflare Pages Function: Secure Serverless Gemini Text Meal Analysis
// Protects API keys server-side while providing CORS support for PWA clients.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-gemini-api-key',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json().catch(() => ({}));
    const queryText = (body.queryText || '').trim();
    const model = body.model || 'gemini-3.5-flash-lite';

    if (!queryText) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid meal description.' }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // 1. Resolve API Key: Prefer server-side Cloudflare secret; fallback to client-supplied header
    const apiKey = (env.GEMINI_API_KEY || request.headers.get('x-gemini-api-key') || '').trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in Cloudflare Pages Secrets or enter your key in NutriTrack Settings.'
        }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 2. High-Precision Prompt with Indian Food & Packaged Pricing Intelligence
    const systemPrompt = `You are a clinical nutrition specialist, Indian food expert, and food packaging database AI.
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

You MUST respond strictly with a valid JSON object matching this schema without any markdown wrapping:
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

    // 3. Call Google Gemini API
    const targetModel = model || 'gemini-3.5-flash-lite';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      let errMsg = `Gemini API error (HTTP ${geminiRes.status})`;
      try {
        const parsedErr = JSON.parse(errText);
        if (parsedErr.error && parsedErr.error.message) {
          errMsg = parsedErr.error.message;
        }
      } catch (e) {}

      return new Response(
        JSON.stringify({ error: errMsg, statusCode: geminiRes.status }),
        { status: geminiRes.status, headers: CORS_HEADERS }
      );
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: 'AI returned an empty response. Please try describing the meal in more detail.' }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    // Sanitize and parse JSON
    let cleanJson = rawText.trim();
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsedData = JSON.parse(cleanJson);
    parsedData.source = 'gemini_backend_proxy';
    parsedData.modelUsed = targetModel;

    return new Response(JSON.stringify(parsedData), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message || 'Unknown processing error'}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
