// Cloudflare Pages Function: Test Gemini API Key Connection

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
    const model = body.model || 'gemini-3.5-flash-lite';

    // 1. Resolve key: Server secret OR client-supplied key from body/header
    const apiKey = (body.apiKey || env.GEMINI_API_KEY || request.headers.get('x-gemini-api-key') || '').trim();

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No API key provided. Enter a key or configure GEMINI_API_KEY in Cloudflare Pages.'
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const testRes = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Healthcheck. Reply with {"status":"ok"}' }] }],
        generationConfig: { response_mime_type: 'application/json' }
      })
    });

    if (testRes.ok) {
      const data = await testRes.json();
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Connection verified successfully! HTTP 200 from Gemini API.',
          modelUsed: model,
          serverConfigured: !!env.GEMINI_API_KEY
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    } else {
      const errText = await testRes.text();
      let errMsg = `HTTP ${testRes.status}`;
      try {
        const parsed = JSON.parse(errText);
        if (parsed.error && parsed.error.message) {
          errMsg = parsed.error.message;
        }
      } catch (e) {}

      return new Response(
        JSON.stringify({
          success: false,
          error: `Gemini verification failed (${errMsg})`,
          statusCode: testRes.status
        }),
        { status: 200, headers: CORS_HEADERS }
      );
    }
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Network or server failure: ${err.message}`
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
