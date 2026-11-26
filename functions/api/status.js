// Cloudflare Pages Function: Query Server AI Configuration Status

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  const { env } = context;
  const hasServerKey = !!(env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim());

  return new Response(
    JSON.stringify({
      serverConfigured: hasServerKey,
      endpoint: '/api',
      defaultModel: 'gemini-3.5-flash-lite'
    }),
    { status: 200, headers: CORS_HEADERS }
  );
}
