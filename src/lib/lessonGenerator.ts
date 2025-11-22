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

// Attempt to use an LLM (OpenAI) to enrich lessons when an API key is supplied.
// WARNING: Calling OpenAI from frontend exposes the key — prefer a server-side proxy.
async function generateWithLLM(subjectSlug: string, base: Array<{ title: string; content: string }>) {
  try {
    // Call a local server-side proxy to avoid exposing API keys in the browser.
    // Prefer calling Supabase Edge Function if available
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    const fnUrl = supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate_lessons` : null;
    let resp: Response | null = null;
    if (fnUrl) {
      try {
        resp = await fetch(fnUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` },
          body: JSON.stringify({ subject: subjectSlug, base }),
        });
      } catch (e) {
        resp = null;
      }
    }
    if (!resp) {
      // fallback to old path if function missing
      resp = await fetch('/api/generate-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectSlug, base }),
      });
    }
    if (!resp.ok) return null;
    const out = await resp.json();
    if (out && out.lessons && Array.isArray(out.lessons)) return out.lessons;
    return null;
  } catch (e) {
    return null;
  }
}

// New helper: request quiz generation from Supabase Edge Function (OpenAI)
export async function generateQuizWithLLM(lesson: { title: string; content: string }, count = 5) {
  try {
    const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const key = (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    if (!supabaseUrl || !key) return null;
    const fnUrl = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/generate_quiz`;
    const res = await fetch(fnUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': key, 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ lesson, count }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.questions)) return data.questions;
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
export function generateQuizFromLesson(lesson: { title: string; content: string }, desiredCount?: number) {
  const content = lesson.content || '';
  // Remove structural headings like 'Overview:', 'Key Concepts:', etc. to avoid picking them as answers
  const cleaned = content.split('\n').filter(line => !/^(Overview|Key Concepts|Detailed Explanation|Summary|Applications)\s*:/i.test(line)).join(' ');

  // split into sentences
  const sentences = cleaned.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean).filter(s => s.length > 20);

  // build candidate terms: pick nouns/keywords heuristically
  const rawWords = cleaned.split(/\s+/).map(w => w.replace(/[^a-zA-Z\-]/g, '')).filter(Boolean);
  const stop = new Set(["which","where","when","what","that","this","these","those","with","about","have","has","are","the","and","for","from","into","its","it's","use","used","using","include","includes","overview","detailed","summary","examples","example","section","related","key","concepts","concept"]);
  const freq: Record<string, number> = {};
  rawWords.forEach(w => {
    const lw = w.toLowerCase();
    if (lw.length < 4) return;
    if (stop.has(lw)) return;
    freq[lw] = (freq[lw] || 0) + 1;
  });
  // prefer longer or capitalized words (likely terms)
  const candidates = Object.keys(freq).sort((a, b) => (freq[b] - freq[a]) || (b.length - a.length)).slice(0, 60);

  const approxLength = cleaned.length;
  const defaultCount = Math.min(10, Math.max(3, Math.floor(approxLength / 600)));
  const qCount = typeof desiredCount === 'number' && desiredCount > 0 ? Math.max(1, Math.min(20, desiredCount)) : defaultCount;
  const questions: Array<{ question: string; choices: string[]; answerIndex: number; type?: string; explanation?: string; sourceSentence?: string }> = [];

  const pickDistractors = (correct: string, n = 3) => {
    const pool = candidates.filter(c => c.toLowerCase() !== correct.toLowerCase());
    const out: string[] = [];
    // prefer words of similar length
    pool.sort((a, b) => Math.abs(a.length - correct.length) - Math.abs(b.length - correct.length));
    let i = 0;
    while (out.length < n && i < pool.length) {
      const c = pool[i++];
      if (!out.includes(c)) out.push(c);
    }
    // fallback synthetic distractors
    while (out.length < n) out.push(correct + 'y');
    return out.map(s => s.charAt(0).toUpperCase() + s.slice(1));
  };

  // helper: pick a sentence that contains a candidate term
  const sentenceForTerm = (term: string) => {
    const re = new RegExp('\\b' + term + '\\b', 'i');
    const found = sentences.find(s => re.test(s));
    return found || sentences[Math.floor(Math.random() * sentences.length)] || '';
  };

  // First: templated factual questions for common concepts (improves quality for taught topics)
  const usedTerms = new Set<string>();
  const knowledgeTemplates: Record<string, { question: string; answer: string; distractors: string[] }> = {
    nucleus: { question: 'Which organelle contains the cell\'s genetic material (DNA)?', answer: 'Nucleus', distractors: ['Mitochondria', 'Ribosome', 'Chloroplast'] },
    mitochondria: { question: 'Which organelle is the primary site of ATP production?', answer: 'Mitochondria', distractors: ['Nucleus', 'Chloroplast', 'Golgi apparatus'] },
    chloroplasts: { question: 'Which organelle is responsible for photosynthesis in plant cells?', answer: 'Chloroplasts', distractors: ['Mitochondria', 'Ribosome', 'Lysosome'] },
    diffusion: { question: 'Which process moves molecules from an area of higher concentration to lower concentration without requiring energy?', answer: 'Diffusion', distractors: ['Active transport', 'Endocytosis', 'Osmosis'] },
    osmosis: { question: 'Which process specifically refers to the movement of water across a semipermeable membrane?', answer: 'Osmosis', distractors: ['Diffusion', 'Active transport', 'Facilitated diffusion'] },
    'active transport': { question: 'Which transport mechanism requires cellular energy (ATP) to move substances against their concentration gradient?', answer: 'Active transport', distractors: ['Diffusion', 'Osmosis', 'Facilitated diffusion'] },
    cytoskeleton: { question: 'Which cellular structure provides internal support and helps enable movement within the cell?', answer: 'Cytoskeleton', distractors: ['Cell membrane', 'Nucleus', 'Ribosome'] },
    cells: { question: 'What is the basic unit of life?', answer: 'Cells', distractors: ['Organelles', 'Tissues', 'Molecules'] },
  };

  for (const k of Object.keys(knowledgeTemplates)) {
    if (questions.length >= qCount) break;
    const re = new RegExp('\\b' + k.replace(/\s+/g, '\\s+') + '\\b', 'i');
    if (re.test(cleaned)) {
      const tpl = knowledgeTemplates[k];
      const choices = [tpl.answer, ...tpl.distractors].slice(0, 4);
      // shuffle
      for (let j = choices.length - 1; j > 0; j--) {
        const t = Math.floor(Math.random() * (j + 1));
        [choices[j], choices[t]] = [choices[t], choices[j]];
      }
      const answerIndex = choices.findIndex(c => c.toLowerCase() === tpl.answer.toLowerCase());
      questions.push({ question: tpl.question, choices, answerIndex, type: 'fact', explanation: `Correct: ${tpl.answer}` });
      usedTerms.add(k);
    }
  }

  // Fill remaining slots with heuristic-generated questions, avoiding already-used terms
  for (let i = 0, idx = 0; questions.length < qCount; idx++) {
    const term = candidates[idx % candidates.length] || (rawWords.find(w => w.length > 6) || '').toLowerCase();
    if (!term) break;
    if (usedTerms.has(term)) continue;
    usedTerms.add(term);
    const sentence = sentenceForTerm(term);
    const correct = term.charAt(0).toUpperCase() + term.slice(1);

    if (sentence && new RegExp('\b' + term + '\b', 'i').test(sentence)) {
      const questionText = sentence.replace(new RegExp('\b' + term + '\b', 'ig'), '_____');
      const distractors = pickDistractors(term, 3);
      const choices = [correct, ...distractors];
      for (let j = choices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [choices[j], choices[k]] = [choices[k], choices[j]];
      }
      const answerIndex = choices.findIndex(c => c.toLowerCase() === correct.toLowerCase());
      const explanation = `The correct answer is "${correct}". Context: ${sentence}`;
      questions.push({ question: `Fill in the blank: ${questionText}`, choices, answerIndex, type: 'cloze', explanation, sourceSentence: sentence });
      continue;
    }

    const snippet = (sentence || '').slice(0, 140).replace(/\s+/g, ' ');
    const distractors = pickDistractors(term, 3);
    const choices = [correct, ...distractors];
    for (let j = choices.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [choices[j], choices[k]] = [choices[k], choices[j]];
    }
    const answerIndex = choices.findIndex(c => c.toLowerCase() === correct.toLowerCase());
    const explanation = `"${correct}" is the best answer. Context: ${snippet}`;
    questions.push({ question: `Which term best matches this concept: "${snippet}..."`, choices, answerIndex, type: 'concept', explanation, sourceSentence: sentence });
    i++;
  }

  return questions;
}

export default { getCurriculum, getLesson, generateQuizFromLesson, generateQuizWithLLM };
