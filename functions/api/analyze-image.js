// Cloudflare Pages Function: Secure Serverless Gemini Multimodal Food Image Analysis

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
    const imageBase64 = (body.imageBase64 || '').trim();
    const mimeType = body.mimeType || 'image/jpeg';
    const model = body.model || 'gemini-3.5-flash-lite';

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image data provided for scanning.' }),
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

    // Clean base64 string
    const pureBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '').trim();

    const prompt = `You are an elite clinical nutritionist and food computer vision specialist.
Examine this food plate photo carefully.
Identify every distinct food, side, curry, bread, beverage, or snack visible.
For each item, estimate portion size, realistic weight in grams, calories, and macros (protein, carbs, fat, fiber, sugar).
Ensure values are consistent with USDA and standard regional/Indian nutrition databases.

You MUST respond strictly with a valid JSON object matching this schema without any markdown commentary:
{
  "meal_name": "string (concise descriptive title of the plate/meal)",
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

    const targetModel = model || 'gemini-3.5-flash-lite';
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${apiKey}`;

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

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      let errMsg = `Gemini Vision error (HTTP ${geminiRes.status})`;
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
        JSON.stringify({ error: 'AI vision could not identify any foods in this image. Please take a clearer photo under good lighting.' }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    let cleanJson = rawText.trim();
    cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

    const parsedData = JSON.parse(cleanJson);
    parsedData.source = 'gemini_vision_proxy';
    parsedData.modelUsed = targetModel;

    return new Response(JSON.stringify(parsedData), { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Server error: ${err.message || 'Unknown vision processing error'}` }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
