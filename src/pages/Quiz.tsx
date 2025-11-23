import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import lessonGen from "@/lib/lessonGenerator";
import { openQuizReviewInNewTab } from '@/lib/quizReview';

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get('subject') || 'general';
  const index = Number(searchParams.get('index') || '1');
  const paramCount = Number(searchParams.get('count') || '0');
  const paramStyle = (searchParams.get('style') || '') as 'mixed'|'vocab'|'concept'|'application';
  const isNewTab = !!searchParams.get('newtab');
  const [lesson, setLesson] = useState<{ title: string; content: string } | null>(null);
  const [questions, setQuestions] = useState<Array<any>>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [mode, setMode] = useState<'choose' | 'running' | 'finished'>('choose');
  const [desiredCount, setDesiredCount] = useState<number>(5);
  const [quizStyle, setQuizStyle] = useState<'mixed'|'vocab'|'concept'|'application'>('mixed');
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    lessonGen.getLesson(subject, index).then(l => {
      if (!mounted) return;
      setLesson(l);
      console.debug('[Quiz] lesson loaded', { subject, index, title: l?.title });
      // wait for user to choose how many questions and style
    });
    return () => { mounted = false; };
  }, [subject, index]);

  // Auto-start when opened from Subjects with count/style/newtab params
  useEffect(() => {
    if (!lesson) return;
    if (mode !== 'choose') return;
    if (paramCount > 0) {
      if (paramStyle) setQuizStyle(paramStyle);
      startQuiz(paramCount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson, paramCount, paramStyle]);

  const { user } = useAuth();

  // timer
  useEffect(() => {
    let t: any = null;
    if (mode === 'running') {
      t = setInterval(() => setSecondsElapsed(s => s + 1), 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [mode]);

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answerIndex) correct++;
    });
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    // Persist a lightweight quiz result to Supabase (if possible) so dashboard reflects it
    (async () => {
      try {
        if (!user) return;
        const lessonTitle = lesson?.title || '';
        // Try to find a matching skill node by title (best-effort match)
        const { data: skillRows } = await supabase
          .from('skill_nodes')
          .select('id, title')
          .ilike('title', `%${lessonTitle}%`) // best-effort
          .limit(1);

        const skillId = Array.isArray(skillRows) && skillRows.length > 0 ? skillRows[0].id : null;
        if (skillId) {
          // See if a progress row exists
          const { data: existing } = await supabase
            .from('user_skill_progress')
            .select('id, mastery_percentage, lessons_completed')
            .eq('user_id', user.id)
            .eq('skill_id', skillId)
            .maybeSingle();

          if (existing && (existing as any).id) {
            const newMastery = Math.round((((existing as any).mastery_percentage ?? 0) + pct) / 2);
            await supabase.from('user_skill_progress').update({ mastery_percentage: newMastery, quiz_score: pct, updated_at: new Date().toISOString() }).eq('id', (existing as any).id);
          } else {
            await supabase.from('user_skill_progress').insert({ user_id: user.id, skill_id: skillId, mastery_percentage: pct, quiz_score: pct, lessons_completed: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
          }
        }
      } catch (e) {
        console.warn('Could not persist quiz result to Supabase', e);
      } finally {
        try {
          localStorage.setItem('peerpath:dashboard:refresh', Date.now().toString());
          const payload = { type: 'quiz', title: lesson?.title || 'Quiz', score: pct, time: new Date().toISOString() };
          localStorage.setItem('peerpath:quiz:submitted', JSON.stringify(payload));
        } catch(e){}
      }
    })();
    // open review in new tab and close here (user requested new tab review)
    try {
      // If this quiz was opened in a new tab, navigate this tab to the review page so the user sees answers here.
      const id = `quiz-review-${Date.now()}`;
      try { sessionStorage.setItem(id, JSON.stringify({ questions, answers, meta: { title: lesson?.title || 'Quiz Review', subject } })); } catch (e) { console.warn('sessionStorage write failed', e); }
      const url = `/quiz-review?id=${encodeURIComponent(id)}`;
      if (isNewTab) {
        // navigate current tab to review
        window.location.href = url;
        return;
      } else {
        // open review in a new tab (old behavior)
        openQuizReviewInNewTab(questions, answers, { title: lesson?.title || 'Quiz Review', subject });
      }
    } catch (e) {
      console.error('Could not open review in new tab', e);
    }
    setMode('finished');
  };

  const startQuiz = (count: number) => {
    if (!lesson) return;
    // Immediately generate a local quiz so the UI is instant, then attempt LLM and replace if available
    console.debug('[Quiz] startQuiz invoked (immediate local + async LLM)', { count, lessonTitle: lesson.title });
    const localQ = lessonGen.generateQuizFromLesson(lesson, count, quizStyle);
    // sanitize locally-generated questions to remove invisible/control characters
    const sanitizedLocal = (localQ || []).map((q:any) => ({
      ...q,
      question: lessonGen.sanitizeQuizText(String(q.question || '')),
      choices: (q.choices || []).map((c:any) => lessonGen.sanitizeQuizText(String(c || ''))),
      explanation: lessonGen.sanitizeQuizText(String(q.explanation || '')),
    }));
    setQuestions(sanitizedLocal);
    setAnswers({});
    setScore(null);
    setSecondsElapsed(0);
    setStartedAt(Date.now());
    setMode('running');

    // Async: try to fetch LLM-backed quiz and swap in if good
    (async () => {
      try {
        const llm = await lessonGen.generateQuizWithLLM(lesson, Math.max(count, 6), quizStyle).catch(() => null);
        if (llm && Array.isArray(llm) && llm.length > 0) {
          console.debug('[Quiz] LLM returned questions, replacing local quiz', llm.length);
          const sanitized = llm.map((q:any) => ({
            ...q,
            question: lessonGen.sanitizeQuizText(String(q.question || '')),
            choices: (q.choices || []).map((c:any) => lessonGen.sanitizeQuizText(String(c || ''))),
            explanation: lessonGen.sanitizeQuizText(String(q.explanation || '')),
          }));
          setQuestions(sanitized);
        } else {
          console.debug('[Quiz] LLM returned no questions — keeping local quiz');
        }
      } catch (e) {
        console.debug('[Quiz] LLM fetch error, keeping local quiz', e);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">Quiz — {lesson?.title || 'Lesson'}</h1>

          {mode === 'choose' && (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label htmlFor="desired-count">Questions</Label>
                  <Input id="desired-count" type="number" min={1} max={20} value={desiredCount} onChange={(e:any) => setDesiredCount(Number(e.target.value || 5))} className="w-24" />
                  <Label htmlFor="quiz-style">Style</Label>
                  <select id="quiz-style" value={quizStyle} onChange={(e:any) => setQuizStyle(e.target.value)} className="form-select rounded border px-2 py-1 bg-white text-black">
                    <option value="mixed">Mixed</option>
                    <option value="vocab">Vocab</option>
                    <option value="concept">Concept</option>
                    <option value="application">Application</option>
                  </select>
                </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                  <Button onClick={() => startQuiz(desiredCount)}>Start Quiz</Button>
              </div>
            </div>
          )}

          {mode === 'running' && (
            <>
              <div className="text-sm text-muted-foreground mb-4">Time: {Math.floor(secondsElapsed / 60).toString().padStart(2,'0')}:{(secondsElapsed%60).toString().padStart(2,'0')}</div>
              <div className="max-w-6xl mx-auto md:flex md:items-start md:gap-6">
                <div className="md:flex-1 space-y-6">
                  {questions.map((q, i) => (
                    <div key={i} className="mb-6 p-4 border rounded-lg bg-card">
                      <div>
                        <div className="mb-3 font-medium text-base leading-relaxed break-words whitespace-normal">{i + 1}. {q.question}</div>
                        <div className="grid gap-2">
                          {q.choices.map((c: string, ci: number) => (
                            <label key={ci} className={`p-3 border rounded cursor-pointer transition-colors hover:bg-muted/50 flex items-start gap-2 ${answers[i] === ci ? 'bg-primary/10 border-primary' : ''}`}>
                              <input type="radio" name={`q-${i}`} checked={answers[i] === ci} onChange={() => setAnswers(a => ({ ...a, [i]: ci }))} className="mt-1 flex-shrink-0" />
                              <span className="break-words whitespace-normal leading-relaxed">{c}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right-hand review panel removed during quiz; review opens in a new tab after submit */}
              </div>

              <div className="flex gap-2 justify-end mt-6">
                <Button variant="outline" onClick={() => { setMode('choose'); setQuestions([]); }}>Cancel</Button>
                <Button onClick={submit}>Submit Quiz</Button>
              </div>
            </>
          )}

          {mode === 'finished' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-6">
                <div className="text-3xl font-semibold mb-2">Score: {score}%</div>
                <div className="text-sm text-muted-foreground">Time: {Math.floor(secondsElapsed / 60).toString().padStart(2,'0')}:{(secondsElapsed%60).toString().padStart(2,'0')}</div>
              </div>

              <div className="space-y-4">
                {questions.map((q, i) => {
                  const userIdx = answers[i];
                  const correctIdx = q.answerIndex;
                  const correct = q.choices[correctIdx];
                  const selected = typeof userIdx === 'number' ? q.choices[userIdx] : null;
                  const correctFlag = userIdx === correctIdx;
                  return (
                    <div key={i} className="p-4 border rounded-lg bg-card">
                      <div className="font-medium mb-3 text-base leading-relaxed break-words whitespace-pre-wrap">{i + 1}. {q.question}</div>
                      <div className="mb-2 break-words">Your answer: <strong className="text-base">{selected ?? '—'}</strong></div>
                      <div className="mb-3 break-words">Correct answer: <strong className="text-base">{correct}</strong></div>
                      <div className={`p-3 rounded ${correctFlag ? 'bg-green-50 dark:bg-green-950/30' : 'bg-red-50 dark:bg-red-950/30'}`}>
                        <div className="text-sm leading-relaxed break-words whitespace-pre-wrap">{q.explanation}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-2 justify-center">
                <Button onClick={() => navigate(`/lesson?subject=${encodeURIComponent(subject)}&index=${index + 1}`)}>Next Lesson</Button>
                <Button variant="outline" onClick={() => navigate('/subjects')}>All Subjects</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Quiz;
