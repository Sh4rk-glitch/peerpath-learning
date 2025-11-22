// Supabase Edge Function: generate_lessons (Gemini/Google Generative API)
// Accepts: { subject: string, base: Array<{ title, content }> }
// Requires secrets: GEMINI_API_KEY, GEMINI_MODEL

export default async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const subject = body.subject || 'general';
    const base = body.base || [];

    const GEMINI = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-pro';
    if (!GEMINI) {
      console.error('Missing GEMINI_API_KEY');
      return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), { status: 500 });
    }

    // Build prompt for lesson generation
    const lessonTitles = base.map((l: any) => l.title || 'Untitled').join(', ');
    const prompt = `You are an expert educator creating comprehensive lesson content for the subject: "${subject}".\n\n` +
      `I have these lesson topics: ${lessonTitles}\n\n` +
      `For each topic, generate detailed educational content including:\n` +
      `1. Overview and key concepts\n` +
      `2. Detailed explanations with examples\n` +
      `3. Practice problems or activities\n` +
      `4. Summary and next steps\n\n` +
      `Respond with a JSON array where each object has: { title: string, content: string }\n` +
      `The content should be comprehensive (500-800 words per lesson).\n\n` +
      `Generate enriched content for these ${base.length} lessons:\n` +
      base.map((l: any, i: number) => `${i + 1}. ${l.title}: ${l.content}`).join('\n');

    // Use Gemini 1.5 API endpoint (newer API)
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
      }
    };

    const fetchWithTimeout = async (url: string, opts: any = {}, timeout = 30000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        return await fetch(url, { ...opts, signal: controller.signal });
      } finally {
        clearTimeout(id);
      }
    };

    let res: Response;
    try {
      res = await fetchWithTimeout(endpoint + `?key=${encodeURIComponent(GEMINI)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }, 30000);
    } catch (e) {
      console.error('Gemini fetch error/timeout', e);
      return new Response(JSON.stringify({ 
        error: 'Gemini fetch timeout', 
        fallback: true,
        lessons: base 
      }), { status: 200 });
    }

    const txt = await res.text();
    if (!res.ok) {
      console.error('Gemini error', res.status, txt);
      return new Response(JSON.stringify({ 
        error: 'Gemini request failed', 
        details: txt,
        fallback: true,
        lessons: base 
      }), { status: 200 });
    }

    // Parse Gemini 1.5 response format
    let output = '';
    try {
      const parsed = JSON.parse(txt);
      if (parsed?.candidates?.[0]?.content?.parts?.[0]?.text) {
        output = parsed.candidates[0].content.parts[0].text;
      } else if (parsed?.candidates?.[0]?.output) {
        output = parsed.candidates[0].output;
      } else {
        output = txt;
      }
    } catch (e) {
      output = txt;
    }

    // Extract JSON array from output
    const jstart = output.indexOf('[');
    const jend = output.lastIndexOf(']');
    if (jstart !== -1 && jend !== -1 && jend > jstart) {
      const sub = output.slice(jstart, jend + 1);
      try {
        const arr = JSON.parse(sub);
        if (Array.isArray(arr) && arr.length > 0) {
          return new Response(JSON.stringify({ lessons: arr }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        console.error('Failed to parse JSON from Gemini output', e);
      }
    }

    console.error('Gemini returned unparsable content', output.slice(0, 500));
    return new Response(JSON.stringify({ 
      fallback: true,
      lessons: base 
    }), { status: 200 });

  } catch (err) {
    console.error('generate_lessons error', err);
    return new Response(JSON.stringify({ 
      error: String(err),
      fallback: true
    }), { status: 500 });
  }
};
