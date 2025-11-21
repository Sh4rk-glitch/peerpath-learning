#!/usr/bin/env node
// Lightweight LLM proxy for lesson generation.
// Usage: set OPENAI_API_KEY and run `node server/proxy.js`

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Proxy will return 502 for LLM requests.');
}

app.post('/api/generate-lessons', async (req, res) => {
  try {
    const { subject, base } = req.body || {};
    if (!OPENAI_KEY) return res.status(502).json({ error: 'OpenAI key not configured on server.' });

    const system = `You are an expert curriculum author. For the provided subject and base lesson titles/shorts, produce a JSON array of lessons. Each lesson must be an object with keys: title (string), content (string) and quiz (array of question objects).\nQuiz question object: { question: string, choices: string[], answerIndex: number }.\nProduce well-formed JSON ONLY.`;

    const userPrompt = `Subject: ${subject}\nBase:\n${(base || []).map(b => `- ${b.title}: ${b.content}`).join('\n')}`;

    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1600,
    };

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(502).json({ error: 'OpenAI error', detail: txt });
    }

    const body = await r.json();
    const text = body?.choices?.[0]?.message?.content || body?.choices?.[0]?.text;
    // Try to parse JSON from the model output. Models are instructed to output JSON only.
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // try to extract JSON substring
      const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    if (!parsed) return res.status(502).json({ error: 'Could not parse LLM JSON output', raw: text });

    return res.json({ lessons: parsed });
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).json({ error: String(err) });
  }
});

const port = process.env.PORT || 5179;
app.listen(port, () => console.log(`LLM proxy listening on http://localhost:${port}`));
