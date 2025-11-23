// Supabase Edge Function: generate_quiz (Gemini/Google Generative API)
// Accepts: { lesson: { title, content }, count: number }
// Requires secrets: GEMINI_API_KEY, GEMINI_MODEL

export default async (req: Request) => {
  try {
    const body = await req.json().catch(() => ({}));
    const lesson = body.lesson || {};
    const count = Number(body.count) || 5;
      const style = body.style || 'mixed';

    const GEMINI = Deno.env.get('GEMINI_API_KEY');
    const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') || 'gemini-pro';
    if (!GEMINI) return new Response(JSON.stringify({ error: 'Missing GEMINI_API_KEY' }), { status: 500 });

    const styleNote = style === 'vocab' ? 'Prioritize vocabulary-definition questions (term → concise definition).' : style === 'concept' ? 'Prioritize conceptual understanding questions (explain relationships/roles).' : style === 'application' ? 'Prioritize short application/word-problem questions requiring application of a concept.' : 'Produce a balanced mix of vocabulary, conceptual, and application-style questions.';

    const prompt = `You are a helpful assistant that generates multiple-choice quizzes from a lesson text. ${styleNote}\n` +
      `Respond with valid JSON only: an array of objects. Each object must have: question (string), choices (array of 4 unique strings), answerIndex (0-based integer index into choices), explanation (string briefly explaining correct answer). Do not include additional commentary.\n\n` +
      `Lesson title: ${lesson?.title || ''}\n\nContent:\n${lesson?.content || ''}\n\nGenerate ${count} questions. Make distractors plausible and avoid repeating near-duplicates. Return JSON array.`;

    // Use Gemini 1.5 API endpoint
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    };

    // Use a fetch wrapper with timeout to avoid hanging indefinitely
    const fetchWithTimeout = async (url: string, opts: any = {}, timeout = 20000) => {
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
      }, 20000);
    } catch (e) {
      console.error('Gemini fetch error/timeout', e);
      // Fallback: generate a local quiz so the function always returns something useful
      try {
        const local = generateLocalQuiz(lesson, count);
        return new Response(JSON.stringify({ questions: local }), { status: 200 });
      } catch (le) {
        return new Response(JSON.stringify({ error: 'Gemini fetch error or timeout', details: String(e) }), { status: 504 });
      }
    }

    const txt = await res.text();
    if (!res.ok) {
      console.error('Gemini error', res.status, txt);
      return new Response(JSON.stringify({ error: 'Gemini request failed', details: txt }), { status: 502 });
    }

    // Try to extract model output text from Gemini 1.5 response format
    let output = '';
    try {
      const parsed = JSON.parse(txt);
      if (parsed?.candidates?.[0]?.content?.parts?.[0]?.text) {
        output = parsed.candidates[0].content.parts[0].text;
      } else if (parsed?.candidates?.[0]?.output) {
        output = parsed.candidates[0].output;
      } else if (parsed?.candidates?.[0]?.content) {
        output = parsed.candidates[0].content;
      } else if (parsed?.output && Array.isArray(parsed.output)) {
        output = parsed.output.map((o: any) => o?.content || o?.output || '').join('\n');
      } else if (typeof parsed === 'string') {
        output = parsed;
      } else {
        output = JSON.stringify(parsed);
      }
    } catch (e) {
      // Not JSON — use raw text
      output = txt;
    }

    // Locate the first JSON array in the output and parse it
    const jstart = output.indexOf('[');
    const jend = output.lastIndexOf(']');
    if (jstart !== -1 && jend !== -1 && jend > jstart) {
      const sub = output.slice(jstart, jend + 1);
      try {
        const arr = JSON.parse(sub);
        return new Response(JSON.stringify({ questions: arr }), { status: 200 });
      } catch (e) {
        console.error('Failed to parse JSON substring from Gemini output', e, sub.slice(0, 200));
      }
    }

    console.error('Gemini returned unparsable content', output.slice(0, 1000));
    // Try local fallback when Gemini output cannot be parsed
    try {
      const local = generateLocalQuiz(lesson, count);
      return new Response(JSON.stringify({ questions: local, fallback: true }), { status: 200 });
    } catch (le) {
      return new Response(JSON.stringify({ error: 'Gemini returned unparsable content', raw: output }), { status: 502 });
    }
  } catch (err) {
    console.error('generate_quiz error', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
};

// Lightweight local quiz generator fallback (kept small so Edge Function remains compact)
function generateLocalQuiz(lesson: any, desiredCount = 5) {
  const content = (lesson?.content || '').split('\n').filter((l: string) => !/^(Overview|Key Concepts|Detailed Explanation|Summary|Applications)\s*:/i.test(l)).join(' ');
  const sentences = content.split(/(?<=[.!?])\s+/).map((s: string) => s.trim()).filter(Boolean).filter((s: string) => s.length > 20);
  const words = content.split(/\s+/).map((w: string) => w.replace(/[^a-zA-Z\-]/g, '')).filter(Boolean);
  const stop = new Set(["which","where","when","what","that","this","these","those","with","about","have","has","are","the","and","for","from","into","its","it's","use","used","using","include","includes","overview","detailed","summary","examples","example","section","related","key","concepts","concept"]);
  const freq: Record<string, number> = {};
  words.forEach((w: string) => {
    const lw = w.toLowerCase();
    if (lw.length < 4) return;
    if (stop.has(lw)) return;
    freq[lw] = (freq[lw] || 0) + 1;
  });
  const candidates = Object.keys(freq).sort((a,b) => (freq[b]-freq[a]) || (b.length - a.length)).slice(0, 40);
  const count = Math.max(1, Math.min(20, Number(desiredCount) || 5));
  const out: any[] = [];
  const pickDistractors = (correct: string, n = 3) => {
    const pool = candidates.filter(c => c !== correct);
    const res: string[] = [];
    let i = 0;
    while (res.length < n && i < pool.length) {
      res.push(pool[i++]);
    }
    while (res.length < n) res.push(correct + 'y');
    return res.map(s => s.charAt(0).toUpperCase() + s.slice(1));
  };
  for (let i = 0; i < count; i++) {
    const term = candidates[i % candidates.length] || (words.find((w: string) => w.length > 6) || '').toLowerCase();
    if (!term) break;
    const sentence = sentences.find((s: string) => new RegExp('\\b'+term+'\\b','i').test(s)) || sentences[Math.floor(Math.random()*sentences.length)] || '';
    const correct = term.charAt(0).toUpperCase() + term.slice(1);
    const distractors = pickDistractors(term, 3);
    const choices = [correct, ...distractors];
    for (let j = choices.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [choices[j], choices[k]] = [choices[k], choices[j]];
    }
    const answerIndex = choices.findIndex(c => c.toLowerCase() === correct.toLowerCase());
    if (sentence && new RegExp('\\b'+term+'\\b','i').test(sentence)) {
      const qtext = sentence.replace(new RegExp('\\b'+term+'\\b','ig'), '_____');
      out.push({ question: `Fill in the blank: ${qtext}`, choices, answerIndex, explanation: `The correct answer is "${correct}". Context: ${sentence}` });
    } else {
      const snippet = (sentence || '').slice(0,140).replace(/\s+/g,' ');
      out.push({ question: `Which term best fits this concept: "${snippet}..."`, choices, answerIndex, explanation: `"${correct}" is the best answer. Context: ${snippet}` });
    }
  }
  return out;
}
