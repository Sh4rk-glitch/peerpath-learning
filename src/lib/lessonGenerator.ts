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
    const resp = await fetch('/api/generate-lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subjectSlug, base }),
    });
    if (!resp.ok) return null;
    const out = await resp.json();
    if (out && out.lessons && Array.isArray(out.lessons)) return out.lessons;
    return null;
  } catch (e) {
    return null;
  }
}

export async function getCurriculum(subjectSlug: string) {
  // try exact match
  const slug = subjectSlug.toLowerCase();
  const simple = slug.replace(/^ap-/, "");

  let base = builtInCurricula[slug] || builtInCurricula[simple];
  if (!base) {
    // default: synthesize several lessons with expanded content
    base = Array.from({ length: 6 }).map((_, i) => ({
      title: `${simple.replace(/-/g, ' ')} — Topic ${i + 1}`,
      content: `This lesson covers key concepts of ${simple.replace(/-/g, ' ')}. It introduces important ideas and practice exercises.`,
    }));
  }

  // Try enriching lessons with an LLM if configured — otherwise fall back to local expansion
  const llm = await generateWithLLM(slug, base);
  if (llm && Array.isArray(llm) && llm.length > 0) {
    // Ensure each item has title/content
    return llm.map((it: any) => ({ title: it.title || 'Lesson', content: it.content || buildExpandedContent(it.title || 'Lesson', it.short || '') }));
  }

  // Expand each lesson's content significantly for the lesson page (local fallback)
  const expanded = base.map((l) => ({
    title: l.title,
    content: buildExpandedContent(l.title, l.content),
  }));

  return expanded;
}

export function getLesson(subjectSlug: string, index: number) {
  return getCurriculum(subjectSlug).then((c) => c[Math.max(0, Math.min(index - 1, c.length - 1))] || c[0]);
}

// Very simple quiz generator: pick 3 short questions by cloze removal of keywords
export function generateQuizFromLesson(lesson: { title: string; content: string }) {
  const content = lesson.content || '';
  // split into sentences
  const sentences = content.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  // extract candidate keywords (simple heuristic)
  const words = content.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
  const stop = new Set(["which","where","when","what","that","this","these","those","with","about","have","has","are","the","and","for","from","into","its","it's","use","used","using"]);
  const candidates = Array.from(new Set(words.filter(w => w.length > 4 && !stop.has(w.toLowerCase())).map(w => w))).slice(0, 40);

  const approxLength = content.length;
  const qCount = Math.min(10, Math.max(5, Math.floor(approxLength / 400)));
  const questions: Array<{ question: string; choices: string[]; answerIndex: number; type?: string }> = [];

  // helper: pick distractors
  const pickDistractors = (correct: string, n = 3) => {
    const pool = candidates.filter(c => c.toLowerCase() !== correct.toLowerCase());
    const out: string[] = [];
    while (out.length < n && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(idx, 1)[0]);
    }
    while (out.length < n) out.push('example');
    return out;
  };

  for (let i = 0; i < qCount; i++) {
    const sentence = sentences[i % sentences.length] || sentences[Math.floor(Math.random() * sentences.length)] || content.slice(0, 120);
    // choose a keyword from the sentence if possible
    const sentenceWords = sentence.split(/\s+/).map(w => w.replace(/[^a-zA-Z]/g, '')).filter(Boolean);
    let keyword = sentenceWords.find(w => candidates.includes(w)) || candidates[i % candidates.length] || sentenceWords.find(w => w.length > 4) || 'concept';

    keyword = keyword || 'concept';

    // Alternate question types for variety
    const typeRoll = i % 3; // 0: cloze MC, 1: true/false, 2: definition-style MC

    if (typeRoll === 0) {
      // Cloze multiple-choice
      const questionText = sentence.replace(new RegExp(keyword, 'ig'), '_____');
      const correct = keyword;
      const distractors = pickDistractors(correct, 3);
      const choices = [correct, ...distractors];
      // shuffle
      for (let j = choices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [choices[j], choices[k]] = [choices[k], choices[j]];
      }
      const answerIndex = choices.findIndex(c => c === correct);
      questions.push({ question: `Fill in the blank: ${questionText}`, choices, answerIndex, type: 'cloze' });
    } else if (typeRoll === 1) {
      // True/False by slightly mutating the sentence
      const distractor = pickDistractors(keyword, 1)[0] || 'something';
      const makeFalse = Math.random() < 0.5;
      const statement = makeFalse ? sentence.replace(new RegExp(keyword, 'ig'), distractor) : sentence;
      const choices = ['True', 'False'];
      const answerIndex = makeFalse ? 1 : 0; // if we changed it, correct answer is False
      questions.push({ question: `Is the following statement true? ${statement}`, choices, answerIndex, type: 'truefalse' });
    } else {
      // Definition / concept multiple-choice: ask "Which best describes <keyword>?"
      const correct = keyword;
      const distractors = pickDistractors(correct, 3);
      const choices = [correct, ...distractors];
      for (let j = choices.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [choices[j], choices[k]] = [choices[k], choices[j]];
      }
      const answerIndex = choices.findIndex(c => c === correct);
      questions.push({ question: `Which term best fits this concept: "${sentence.slice(0, 120).replace(/\s+/g, ' ')}..."`, choices, answerIndex, type: 'concept' });
    }
  }

  return questions;
}

export default { getCurriculum, getLesson, generateQuizFromLesson };
