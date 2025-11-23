const builtInCurricula: Record<string, Array<{ title: string; content: string }>> = {
  "ap-biology": [
    {
      title: "Cell Structure & Function",
      content: `Cells are the basic unit of life. This lesson covers prokaryotic and eukaryotic cells, organelles (nucleus, mitochondria, chloroplasts), membrane structure and transport (diffusion, osmosis, active transport), cytoskeleton, and how cellular structure relates to specialized functions in tissues and organisms. Includes examples and practice questions.`,
    },
    {
      title: "Cellular Energetics: Photosynthesis & Respiration",
      content: `Overview of energy flow in living systems: light reactions, Calvin cycle, glycolysis, Krebs cycle, electron transport chain, chemiosmosis, ATP production, and comparative yields. Discuss regulation, inhibitors, and lab methods for measuring respiration/photosynthesis.`,
    },
    {
      title: "Molecular Genetics",
      content: `DNA structure and replication, transcription and RNA processing, translation and protein synthesis, regulation of gene expression, operons, and basics of molecular biology techniques (PCR, gel electrophoresis, sequencing).`,
    },
    {
      title: "Mendelian & Non-Mendelian Inheritance",
      content: `Mendel's laws, Punnett squares, probability, extensions including incomplete dominance, codominance, epistasis, polygenic traits, sex-linked inheritance, and pedigree analysis.`,
    },
    {
      title: "Evolution and Natural Selection",
      content: `Evidence for evolution, mechanisms (natural selection, genetic drift, gene flow, mutation), Hardy-Weinberg equilibrium, speciation, and phylogenetics.`,
    },
    {
      title: "Ecology & Ecosystems",
      content: `Population dynamics, community interactions (predation, competition, mutualism), energy flow and nutrient cycles, biomes, and human impacts on ecosystems.`,
    },
    {
      title: "Structure & Function: Plants and Animals",
      content: `Comparative anatomy and physiology: plant structure, vascular systems, animal organ systems (circulatory, respiratory, nervous, endocrine), homeostasis, and adaptations.`,
    },
  ],
  "chemistry": [
    { title: "Atomic Structure & Periodic Trends", content: `Atoms, subatomic particles (protons, neutrons, electrons), isotopes, electron configuration, orbitals, periodic trends (ionization energy, electronegativity, atomic radius), and how these trends affect reactivity.` },
    { title: "Chemical Bonding & Molecular Geometry", content: `Ionic, covalent, polar vs nonpolar bonds, Lewis structures, VSEPR theory for molecular shapes, hybridization, and how bonding affects physical and chemical properties.` },
    { title: "Stoichiometry & Chemical Reactions", content: `Balancing equations, mole concept, molar mass, limiting reagents, percent yield, reaction stoichiometry, types of chemical reactions, and titration basics.` },
    { title: "Thermochemistry & Kinetics", content: `Energy changes in reactions (enthalpy, calorimetry), bond energies, activation energy, reaction rates, rate laws, and factors affecting reaction speed.` },
    { title: "Equilibrium & Acids/Bases", content: `Chemical equilibrium, Le Chatelier's principle, equilibrium constants (Kc, Kp), acid-base theories, pH calculations, buffers, and titration curves.` },
    { title: "Electrochemistry & Redox", content: `Oxidation-reduction reactions, balancing redox equations, galvanic cells, standard reduction potentials, and electrolysis.` },
  ],
  "calculus": [
    { title: "Limits, Continuity & Intro to Derivatives", content: `Understanding limits (including one-sided limits), continuity, and the derivative concept; tangent lines and basic derivative rules.` },
    { title: "Differentiation Techniques", content: `Product, quotient, chain rules, implicit differentiation, higher-order derivatives, and applications (related rates, linear approximation).` },
    { title: "Applications of Derivatives", content: `Critical points, optimization, curve sketching, mean value theorem, and motion problems (velocity/acceleration).` },
    { title: "Integration Techniques", content: `Antiderivatives, substitution, integration by parts, area under curve, definite integrals, and applications to area/volume.` },
    { title: "Sequences, Series & Polar/Parametric", content: `Intro to sequences and series, convergence tests, power series, and calculus with parametric and polar equations.` },
  ],
  "spanish": [
    { title: "Foundations: Pronouns & Present Tense", content: `Common greetings, subject pronouns, present tense conjugation for regular verbs, essential vocabulary and pronunciation tips.` },
    { title: "Past Tenses & Storytelling", content: `Preterite vs imperfect distinction, common irregular verbs in past tenses, and practice constructing narratives about past events.` },
    { title: "Conversational Spanish & Functional Phrases", content: `Question formation, useful phrases for travel and social interaction, expressions of opinion, and polite forms.` },
    { title: "Grammar Deep Dive: Subjunctive", content: `Introduction to the subjunctive mood, triggers for usage, present vs past subjunctive, and practice sentences.` },
  ],
  "digital-art": [
    { title: "Fundamentals of Composition & Color", content: `Principles of composition, focal points, rule of thirds, balance, contrast, and color theory including hue, saturation, and value.` },
    { title: "Digital Tools, Layers & Brushes", content: `Overview of common digital art tools, working with layers, masks, blending modes, brush settings, and non-destructive workflows.` },
    { title: "Lighting, Shading & Form", content: `Understanding light sources, shading techniques, creating form, rim light, cast shadows, and rendering materials like skin, metal, and fabric.` },
    { title: "Character Design & Gesture", content: `Gesture drawing, anatomy basics for characters, silhouette, proportions, and designing memorable characters.` },
  ],
};

function buildExpandedContent(title: string, short: string) {
  // Build a multi-paragraph expanded lesson from a short blurb.
  const paragraphs = [] as string[];

  // Intro / overview
  paragraphs.push(`Overview:\n${short}`);

  // Key concepts: break title into words and create bullets
  paragraphs.push(`Key Concepts:\n- ${title} — core idea and definitions.\n- Related subtopics and vocabulary that students must learn.\n- Important formulas or frameworks (where applicable).`);

  // Detailed explanation (3-5 paragraphs)
  paragraphs.push(`Detailed Explanation:\n${short} expands into a longer explanation. This section walks through the core theory in depth, step by step. Provide definitions, worked examples, and connections to prerequisite knowledge. Use concrete examples and visual descriptions when helpful.`);

  paragraphs.push(`Worked Examples & Practice:\n1) Example problem with setup and step-by-step solution.\n2) A second example that highlights a common pitfall.\n3) Quick practice questions to try and answers or hints.`);

  paragraphs.push(`Applications & Labs:\nDescribe real-world applications or simple lab/activities students can do to observe the concepts. Explain expected results and how to record observations.`);

  paragraphs.push(`Summary & Next Steps:\nSummarize the most important points. Provide further reading, short practice problems, and a preview of what to expect next.`);

  return paragraphs.join('\n\n');
}

// Exported sanitizer to clean up quiz text (removes invisible/control chars and collapses whitespace)
export function sanitizeQuizText(t: string) {
  if (!t) return '';
  // remove zero-width / invisible characters and control chars
  let out = t.replace(/[\u200B-\u200F\uFEFF\u2028\u2029\u0000-\u001F]/g, '');
  // normalize excessive whitespace and newlines into single spaces
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

// Attempt to use an LLM (Gemini) to enrich lessons when an API key is supplied.
async function generateWithLLM(subjectSlug: string, base: Array<{ title: string; content: string }>) {
  try {
    // First try: Call Supabase Edge Function
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    const fnUrl = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate_lessons` : null;
    
    if (fnUrl) {
      try {
        const resp = await fetch(fnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ subject: subjectSlug, base }),
        });
        if (resp.ok) {
          const out = await resp.json();
          if (out && out.lessons && Array.isArray(out.lessons)) return out.lessons;
        }
      } catch (e) {
        console.warn('Supabase Edge Function failed, trying direct Gemini API', e);
      }
    }

    // Second try: Direct Gemini API call
    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (geminiKey) {
      try {
        const lessonTitles = base.map(l => l.title || 'Untitled').join(', ');
        const prompt = `You are an expert educator creating comprehensive lesson content for the subject: "${subjectSlug}".\n\n` +
          `I have these lesson topics: ${lessonTitles}\n\n` +
          `For each topic, generate detailed educational content including:\n` +
          `1. Overview and key concepts\n` +
          `2. Detailed explanations with examples\n` +
          `3. Practice problems or activities\n` +
          `4. Summary and next steps\n\n` +
          `Respond with a JSON array where each object has: { title: string, content: string }\n` +
          `The content should be comprehensive (500-800 words per lesson).\n\n` +
          `Generate enriched content for these ${base.length} lessons:\n` +
          base.map((l, i) => `${i + 1}. ${l.title}: ${l.content}`).join('\n');

        const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
          })
        });

        if (geminiResp.ok) {
          const data = await geminiResp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Extract JSON array from response
          const jstart = text.indexOf('[');
          const jend = text.lastIndexOf(']');
          if (jstart !== -1 && jend !== -1 && jend > jstart) {
            const jsonStr = text.slice(jstart, jend + 1);
            const lessons = JSON.parse(jsonStr);
            if (Array.isArray(lessons) && lessons.length > 0) {
              console.log('✅ Generated lessons with Gemini API');
              return lessons;
            }
          }
        }
      } catch (e) {
        console.warn('Direct Gemini API call failed', e);
      }
    }

    return null;
  } catch (e) {
    console.warn('generateWithLLM error', e);
    return null;
  }
}

// New helper: request quiz generation from Supabase Edge Function or direct Gemini API
export async function generateQuizWithLLM(lesson: { title: string; content: string }, count = 5, style: 'mixed'|'vocab'|'concept'|'application' = 'mixed') {
  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    // First try: Supabase Edge Function if configured
    if (supabaseUrl && key) {
      try {
        const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate_quiz`;
        const res = await fetch(fnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ lesson, count, style }),
        });
        if (res.ok) {
          const data = await res.json();
          // Edge function may return { questions: [...] } or the array directly
          if (data && Array.isArray(data.questions)) return data.questions;
          if (Array.isArray(data)) return data;
        }
      } catch (e) {
        console.warn('Supabase quiz generation failed, trying direct Gemini API', e);
      }
    }

    // Second try: Direct Gemini API call
    const geminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    if (geminiKey) {
      try {
        const styleNote = style === 'vocab' ? 'Prioritize vocabulary-definition questions (term → concise definition).' : style === 'concept' ? 'Prioritize conceptual understanding questions (explain relationships/roles).' : style === 'application' ? 'Prioritize short application/word-problem questions requiring application of a concept.' : 'Produce a balanced mix of vocabulary, conceptual, and application-style questions.';
        const prompt = `You are an expert educator. ${styleNote} From the lesson below, generate exactly ${count} multiple-choice questions (4 choices each). Avoid cloze/fill-in-the-blank items. Make distractors plausible and focused on common misconceptions.\n\n` +
          `Respond with valid JSON only: an array of objects. Each object must have: question (string), choices (array of 4 unique strings), answerIndex (0-based integer index into choices), explanation (string briefly explaining correct answer). Do not include additional commentary.\n\n` +
          `Lesson title: ${lesson.title}\n\nContent:\n${lesson.content}\n\nGenerate ${count} questions. Return JSON array.`;

        const geminiResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${encodeURIComponent(geminiKey)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          })
        });

        if (geminiResp.ok) {
          const data = await geminiResp.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

          // Extract JSON array from response
          const jstart = text.indexOf('[');
          const jend = text.lastIndexOf(']');
          if (jstart !== -1 && jend !== -1 && jend > jstart) {
            const jsonStr = text.slice(jstart, jend + 1);
            const questions = JSON.parse(jsonStr);
            if (Array.isArray(questions) && questions.length > 0) {
              console.log('✅ Generated quiz with Gemini API');
              return questions;
            }
          }
        }
      } catch (e) {
        console.warn('Direct Gemini quiz generation failed', e);
      }
    }

    return null;
  } catch (e) {
    console.warn('generateQuizWithLLM error', e);
    return null;
  }
}

export async function getCurriculum(subjectSlug: string) {
  // try exact match
  const slug = subjectSlug.toLowerCase();
  const simple = slug.replace(/^ap-/, "");
  let base = builtInCurricula[slug] || builtInCurricula[simple];

  // If we have a small built-in base, augment or synthesize it so every subject returns a
  // comprehensive set of lessons (targetCount). We prefer built-in lessons but expand
  // each item into a multi-paragraph lesson using buildExpandedContent.
  const targetCount = 8;
  if (!base) {
    // default: synthesize several lessons with expanded content
    base = Array.from({ length: targetCount }).map((_, i) => ({
      title: `${simple.replace(/-/g, ' ')} — Topic ${i + 1}`,
      content: `This lesson covers key concepts of ${simple.replace(/-/g, ' ')}. It introduces important ideas and practice exercises.`,
    }));
  } else if (Array.isArray(base) && base.length < targetCount) {
    // augment the base with generated variations so we reach the target count
    const extra: Array<{ title: string; content: string }> = [];
    for (let i = base.length; i < targetCount; i++) {
      const seed = base[i % base.length];
      extra.push({
        title: `${seed.title} — Advanced Topic ${i + 1}`,
        content: `${seed.content} Deeper exploration and applied examples for advanced learners.`,
      });
    }
    base = base.concat(extra);
  }

  // Try enriching lessons with an LLM if configured — otherwise fall back to local expansion
  const llm = await generateWithLLM(slug, base);
  if (llm && Array.isArray(llm) && llm.length > 0) {
    // Ensure each item has title/content; also limit/normalize to targetCount
    const normalized = llm.slice(0, targetCount).map((it: any, idx: number) => ({
      title: it.title || base[idx]?.title || 'Lesson',
      content: it.content || buildExpandedContent(it.title || base[idx]?.title || 'Lesson', it.short || base[idx]?.content || ''),
    }));
    return normalized;
  }

  // Expand each lesson's content significantly for the lesson page (local fallback)
  const expanded = base.slice(0, targetCount).map((l) => ({
    title: l.title,
    content: buildExpandedContent(l.title, l.content),
  }));

  return expanded;
}

export function getLesson(subjectSlug: string, index: number) {
  return getCurriculum(subjectSlug).then((c) => c[Math.max(0, Math.min(index - 1, c.length - 1))] || c[0]);
}

// Very simple quiz generator: pick 3 short questions by cloze removal of keywords
export function generateQuizFromLesson(lesson: { title: string; content: string }, desiredCount?: number, style: 'mixed'|'vocab'|'concept'|'application' = 'mixed') {
  const content = lesson.content || '';

  const shorten = (s:string, n=140) => (s.length > n ? s.slice(0, n).trim() + '...' : s.trim());
  const cap = (s:string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const sanitizeText = (t:string) => {
    if (!t) return '';
    // remove zero-width / invisible characters and control chars
    let out = t.replace(/[\u200B-\u200F\uFEFF\u2028\u2029\u0000-\u001F]/g, '');
    // normalize excessive whitespace and newlines
    out = out.replace(/\s+/g, ' ').trim();
    return out;
  };
  const shuffle = (arr:string[]) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Try to extract a 'Key Concepts' section first for focused, topical questions
  const keySectionMatch = content.match(/Key Concepts:\s*\n([\s\S]*?)(?:\n\n|$)/i);
  const keyConcepts: Array<{ term: string; desc: string }> = [];
  if (keySectionMatch) {
    const lines = keySectionMatch[1].split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const cleaned = line.replace(/^[-\d\.\)\s]+/, '');
      // split by em-dash or hyphen or colon
      const parts = cleaned.split(/\s+—\s+|\s+-\s+|:\s+/);
      let term = (parts[0] || cleaned).trim();
      let desc = (parts[1] || parts.slice(1).join(' ') || '').trim();
      // sanitize term
      term = term.replace(/[^a-zA-Z0-9\s\-]/g, '').trim();
      if (!term && desc) {
        const words = desc.split(/\s+/).slice(0,3).join(' ');
        term = words;
      }
      if (term) keyConcepts.push({ term, desc: desc || 'Core concept' });
    }
  }

  const qCount = typeof desiredCount === 'number' && desiredCount > 0 ? Math.max(1, Math.min(20, desiredCount)) : Math.min(8, Math.max(3, Math.floor((content||'').length / 800)));
  const questions: Array<{ question: string; choices: string[]; answerIndex: number; explanation?: string }> = [];

  // prepare a global pool of lesson titles to use as distractors when needed
  const pool: string[] = [];
  for (const sub of Object.keys(builtInCurricula)) {
    (builtInCurricula[sub] || []).forEach(l => { if (l.title) pool.push(l.title.replace(/\s+&\s+/g, ' and ')); });
  }
  const shufflePool = shuffle(pool.slice());

  if (keyConcepts.length >= 2) {
    // Build definition -> term style questions from key concepts (fast and topical)
    // Detect placeholder-like descriptions and instead generate title- or sentence-focused questions
    const placeholderRe = /core idea|core concept|important formulas|practice exercises|key concepts|detailed explanation/i;
    const hasPlaceholders = keyConcepts.every(kc => placeholderRe.test(kc.desc || '') || placeholderRe.test(kc.term || ''));

    // Use the global `shufflePool` prepared above for plausible distractors

    if (hasPlaceholders) {
      // If descriptions are placeholders, create vocabulary-style questions from the lesson title
      for (let i = 0; i < qCount; i++) {
        const correctTerm = keyConcepts[0].term || keyConcepts[0].desc || '';
        const correct = cap((correctTerm || '').replace(/\s+&\s+/g, ' and '));
        const distractors = shufflePool.slice((i * 3) % Math.max(1, shufflePool.length), ((i * 3) % Math.max(1, shufflePool.length)) + 3).filter(d => d.toLowerCase() !== correct.toLowerCase()).slice(0, 3);
        while (distractors.length < 3) distractors.push('A related concept');
        const choices = shuffle([correct, ...distractors]);
        const questionText = sanitizeText(`Which term best matches this description: "${shorten(keyConcepts[0].desc || keyConcepts[0].term || '', 160)}"`);
        const explanation = sanitizeText(`${correct} — ${shorten(keyConcepts[0].desc || '', 300)}`);
        questions.push({ question: questionText, choices: choices.map(sanitizeText), answerIndex: choices.findIndex(c => c.toLowerCase() === correct.toLowerCase()), explanation });
      }
    } else {
      // Produce vocabulary and conceptual questions from key concepts first
      for (let i = 0; i < Math.min(qCount, keyConcepts.length); i++) {
        const correct = keyConcepts[i];
        const correctTerm = cap(correct.term || correct.desc || 'Concept');
        // distractors: other key terms or shuffled pool
        const others = keyConcepts.filter((_, idx) => idx !== i).map(k => cap(k.term));
        const distractors = shuffle(others).slice(0, 2);
        // add one extra distractor from global pool
        const extra = shufflePool.find(p => p.toLowerCase() !== correctTerm.toLowerCase());
        if (extra) distractors.push(extra);
        while (distractors.length < 3) distractors.push('None of the above');
        const vocabChoices = shuffle([correctTerm, ...distractors]);
        questions.push({
          question: sanitizeText(`Which term best matches this definition: "${shorten(correct.desc || correct.term || '', 140)}"`),
          choices: vocabChoices.map(sanitizeText),
          answerIndex: vocabChoices.findIndex(c => c.toLowerCase() === correctTerm.toLowerCase()),
          explanation: sanitizeText(`${correctTerm} — ${shorten(correct.desc || '', 300)}`)
        });

        // If we still need more, add a conceptual/application style question based on this key concept
        if (questions.length < qCount && style !== 'vocab') {
          const conceptualChoices = shuffle([`${correctTerm} is the underlying cause`, ...(distractors.slice(0,3))]);
          questions.push({
            question: sanitizeText(`Which of the following best explains the role of "${shorten(correct.term || correct.desc || '', 80)}" in this lesson?`),
            choices: conceptualChoices.map(sanitizeText),
            answerIndex: 0,
            explanation: sanitizeText(`Role: ${shorten(correct.desc || '', 200)}`)
          });
        }
      }
    }
    // If we still need more questions, we'll fall through to sentence-based generation below to fill the remainder.
  }

  // Fallback: produce cloze-style and short-concept questions from sentences
  const cleaned = content.replace(/\n+/g, ' ');
  const sentences = cleaned.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean).filter(s => s.length > 40);
  const termsPool: string[] = [];
  // pick longer words that look like technical terms
  const rawWords = cleaned.split(/\s+/).map(w => w.replace(/[^a-zA-Z\-]/g, '')).filter(Boolean);
  rawWords.forEach(w => { if (w.length > 5) termsPool.push(w); });
  // unique and capitalized
  const stopWords = new Set(['section','lesson','overview','covers','includes','example','examples','practice','questions','question','study','topic','unit','lesson','summary']);
  const uniq = Array.from(new Set(termsPool)).map(t => cap(t)).filter(t => !stopWords.has(t.toLowerCase())).slice(0, 60);

  const pickDistractors = (correct:string, n=3) => {
    const pool = uniq.filter(u => u.toLowerCase() !== correct.toLowerCase());
    const out = pool.slice(0, n);
    while (out.length < n) out.push(correct + 'y');
    return out;
  };

  // Now attempt to fill remaining slots (or replace duplicates) using sentence-based heuristics.
  const seen = new Set<string>();
  const unique: Array<{ question: string; choices: string[]; answerIndex: number; explanation?: string }> = [];
  const pushIfUnique = (q: { question: string; choices: string[]; answerIndex: number; explanation?: string }) => {
    const key = (q.question || '').trim().toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    unique.push(q);
    return true;
  };

  // seed unique with already-created questions in order
  for (const q of questions) pushIfUnique(q);

  let attempts = 0;
  const maxAttempts = Math.max(20, qCount * 5);
  // Randomize sentence order to reduce repeated patterns
  const sentPool = sentences.length > 0 ? shuffle(sentences.slice()) : [];

  while (unique.length < qCount && attempts < maxAttempts) {
    attempts++;
    // Prefer sentence-based cloze if available
    if (sentPool.length > 0) {
      const s = sentPool[attempts % sentPool.length];
      const found = uniq.find(u => new RegExp('\\b' + u + '\\b', 'i').test(s));
      if (found) {
        // If the user requested application-style, build an application/concept question from the sentence
        if (style === 'application') {
          const snippet = shorten(s, 140);
          const concept = found;
          const distractors = pickDistractors(concept, 3).map(sanitizeText);
          const choices = shuffle([`It would likely lead to ${concept}`, ...distractors]).map(sanitizeText);
          const qobj = { question: sanitizeText(`Given the scenario: "${snippet}...", which outcome is most likely?`), choices, answerIndex: 0, explanation: sanitizeText(`Based on: ${snippet}`) };
          pushIfUnique(qobj);
          continue;
        }

        // Otherwise build a vocabulary-style question using the sentence as a definition/snippet
        const defSnippet = s.replace(new RegExp('\b' + found + '\b', 'ig'), found);
        const correct = found;
        const distractors = pickDistractors(correct, 3);
        const choices = shuffle([correct, ...distractors]).map(sanitizeText);
        const answerIndex = choices.findIndex(c => c.toLowerCase() === correct.toLowerCase());
        const qobj = { question: sanitizeText(`Which term is best defined by: "${shorten(defSnippet, 160)}"`), choices, answerIndex, explanation: sanitizeText(`Context: ${shorten(s,160)}`) };
        pushIfUnique(qobj);
        continue;
      }
      // If no clear term, produce a conceptual/application-style question from the sentence
      const snippet = shorten(s, 140);
      const concept = (uniq[0] || 'Concept');
      const distractors = pickDistractors(concept, 3).map(sanitizeText);
      const choices = shuffle([`It would likely lead to ${concept}`, ...distractors]).map(sanitizeText);
      const answerIndex = 0;
      const qobj = { question: sanitizeText(`Given the scenario: "${snippet}...", which outcome is most likely?`), choices, answerIndex, explanation: sanitizeText(`Based on: ${snippet}`) };
      pushIfUnique(qobj);
      continue;
    }

    // If no sentences, fall back to title-focused or key-concept variants
    if (keyConcepts.length > 0) {
      const kc = keyConcepts[attempts % keyConcepts.length];
      const correct = cap(kc.term || kc.desc || 'Concept');
      const distractors = shufflePool.slice((attempts * 3) % Math.max(1, shufflePool.length), ((attempts * 3) % Math.max(1, shufflePool.length)) + 3).filter(d => d.toLowerCase() !== correct.toLowerCase()).slice(0,3);
      while (distractors.length < 3) distractors.push('A related concept');
      const choices = shuffle([correct, ...distractors]);
      const answerIndex = choices.findIndex(c => c.toLowerCase() === correct.toLowerCase());
      const qobj = { question: `Which term best matches this description: "${shorten(kc.desc || kc.term || '', 160)}"`, choices, answerIndex, explanation: `${correct} — ${shorten(kc.desc || '', 300)}` };
      pushIfUnique(qobj);
      continue;
    }

    // As a last resort create a generic question from the lesson title
    const titleSnippet = shorten(lesson.title || 'Lesson', 80);
    const fallbackChoices = shufflePool.slice(0,3).filter(d => d.toLowerCase() !== titleSnippet.toLowerCase()).slice(0,3);
    while (fallbackChoices.length < 3) fallbackChoices.push('Related topic');
    const choices = shuffle([`Overview of ${titleSnippet}`, ...fallbackChoices]);
    const answerIndex = choices.findIndex(c => c.toLowerCase().startsWith('overview of'));
    const qobj = { question: `What is the main focus of the lesson titled "${titleSnippet}"?`, choices, answerIndex: answerIndex >= 0 ? answerIndex : 0, explanation: `Overview: ${shorten(lesson.content || '', 160)}` };
    pushIfUnique(qobj);
  }

  // Return up to the requested count
  return unique.slice(0, qCount);
}

export default { getCurriculum, getLesson, generateQuizFromLesson, generateQuizWithLLM, sanitizeQuizText };
