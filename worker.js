// Mhat Tan Cloudflare Worker
// Holds API keys server-side — never exposed in the mobile bundle.
//
// Deploy:
//   1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
//   2. Paste this file, click Save and Deploy
//   3. Settings → Variables → Add:
//      - ELEVENLABS_API_KEY  = your ElevenLabs API key
//      - VIBE_CODE_API_KEY   = your sk-... API key
//      - VIBE_CODE_BASE_URL  = https://proxy.vibecode.tours/v1
//      - VIBE_CODE_MODEL     = mimo-v2.5-pro
//      - PROXY_SECRET        = any random string (match EXPO_PUBLIC_PROXY_SECRET in .env)

// ── In-memory rate limiting (best-effort, resets on worker restart) ──
const rateLimitStore = {};

function checkRateLimit(ip, env) {
  const maxPerMin = parseInt(env.MAX_REQUESTS_PER_MIN || '10', 10);
  const now = Math.floor(Date.now() / 60000); // current minute bucket

  const key = `${ip}:${now}`;
  const count = (rateLimitStore[key] || 0) + 1;
  rateLimitStore[key] = count;

  // Clean up old entries (keep last 5 minutes)
  if (Object.keys(rateLimitStore).length > 1000) {
    const cutoff = now - 5;
    for (const k in rateLimitStore) {
      const ts = parseInt(k.split(':')[1], 10);
      if (ts < cutoff) delete rateLimitStore[k];
    }
  }

  return count <= maxPerMin;
}

// ── Handle Requests ────────────────────────────────────────────
export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Proxy-Secret',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    // ── Proxy Secret Check ───────────────────────────────────
    const proxySecret = env.PROXY_SECRET;
    if (proxySecret) {
      const providedSecret = request.headers.get('X-Proxy-Secret');
      if (providedSecret !== proxySecret) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // ── Rate Limit Check ─────────────────────────────────────
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!checkRateLimit(clientIP, env)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Parse body ───────────────────────────────────────────
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Daily quota (best-effort, resets on worker restart) ──
    const dailyMax = parseInt(env.DAILY_TRANSCRIBE_QUOTA || '100', 10);
    if (dailyMax > 0) {
      const dayKey = `day:${Math.floor(Date.now() / 86400000)}`;
      rateLimitStore[dayKey] = (rateLimitStore[dayKey] || 0) + 1;
      if ((body.audioBase64 ? rateLimitStore[dayKey] : 0) > dailyMax) {
        return new Response(JSON.stringify({ error: 'Daily transcription quota reached.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/transcribe' || path === '/') {
        return await handleTranscribe(body, env, corsHeaders);
      }
      if (path === '/categorize') {
        return await handleCategorize(body, env, corsHeaders);
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// ── Transcribe ─────────────────────────────────────────────────
async function handleTranscribe(body, env, corsHeaders) {
  const { audioBase64, mimeType } = body;

  if (!audioBase64) {
    return new Response(JSON.stringify({ error: 'audioBase64 is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ── Max audio size: ~5 MB base64 ≈ ~3.75 MB raw ──────────
  const maxSize = parseInt(env.MAX_AUDIO_SIZE_BYTES || '5000000', 10);
  if (audioBase64.length > maxSize) {
    return new Response(JSON.stringify({ error: 'Audio file too large.' }), {
      status: 413,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Decode base64 to binary
  const audioBinary = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const fileName = mimeType === 'audio/wav' ? 'recording.wav' : 'recording.m4a';

  const formData = new FormData();
  formData.append('file', new Blob([audioBinary], { type: mimeType }), fileName);
  formData.append('model_id', 'scribe_v2');
  formData.append('language_code', 'my');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => 'Unknown error');
    return new Response(
      JSON.stringify({ error: `Transcription failed (${response.status}): ${detail}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const result = await response.json();
  return new Response(JSON.stringify({ text: result.text }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ── Categorize ─────────────────────────────────────────────────
async function handleCategorize(body, env, corsHeaders) {
  const { transcript } = body;

  if (!transcript || !transcript.trim()) {
    return new Response(JSON.stringify({ error: 'transcript is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = env.VIBE_CODE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'VIBE_CODE_API_KEY not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const baseUrl = env.VIBE_CODE_BASE_URL || 'https://proxy.vibecode.tours/v1';
  const model = env.VIBE_CODE_MODEL || 'mimo-v2.5-pro';

  const prompt = `Categorize this Burmese voice entry into: feelings, work, health, ideas, money, or other.
Generate a short title (max 5 words) that captures the main topic.
Return JSON: { "category": "...", "title": "short title", "summary": "English summary", "items": ["item1"], "mood": "mood", "date": "today" }
Entry: "${transcript}"`;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    return new Response(
      JSON.stringify({ error: `Categorization failed (${response.status}): ${errBody}` }),
      { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const result = await response.json();
  const text = result?.choices?.[0]?.message?.content;

  if (!text) {
    return new Response(
      JSON.stringify({
        category: 'other',
        title: transcript.slice(0, 30),
        summary: transcript.slice(0, 100),
        items: [],
        mood: 'neutral',
        date: 'today',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);
  const valid = ['feelings', 'work', 'health', 'ideas', 'money', 'other'];

  return new Response(
    JSON.stringify({
      category: valid.includes(parsed.category) ? parsed.category : 'other',
      title: parsed.title || transcript.slice(0, 30),
      summary: parsed.summary || '',
      items: parsed.items || [],
      mood: parsed.mood || 'neutral',
      date: parsed.date || 'today',
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
}
