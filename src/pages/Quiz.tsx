import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import lessonGen from "@/lib/lessonGenerator";

const Quiz = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subject = searchParams.get('subject') || 'general';
  const index = Number(searchParams.get('index') || '1');
  const [lesson, setLesson] = useState<{ title: string; content: string } | null>(null);
  const [questions, setQuestions] = useState<Array<any>>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const [mode, setMode] = useState<'choose' | 'running' | 'finished'>('choose');
  const [desiredCount, setDesiredCount] = useState<number>(5);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    lessonGen.getLesson(subject, index).then(l => {
      if (!mounted) return;
      setLesson(l);
      console.debug('[Quiz] lesson loaded', { subject, index, title: l?.title });
      const q = lessonGen.generateQuizFromLesson(l);
      // wait for user to choose how many questions
    });
    return () => { mounted = false; };
  }, [subject, index]);

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
    setScore(Math.round((correct / questions.length) * 100));
    setMode('finished');
  };

  const startQuiz = (count: number) => {
    if (!lesson) return;
    // Immediately generate a local quiz so the UI is instant, then attempt LLM and replace if available
    console.debug('[Quiz] startQuiz invoked (immediate local + async LLM)', { count, lessonTitle: lesson.title });
    const localQ = lessonGen.generateQuizFromLesson(lesson, count);
    setQuestions(localQ);
    setAnswers({});
    setScore(null);
    setSecondsElapsed(0);
    setStartedAt(Date.now());
    setMode('running');

    // Async: try to fetch LLM-backed quiz and swap in if good
    (async () => {
      try {
        const llm = await lessonGen.generateQuizWithLLM(lesson, count).catch(() => null);
        if (llm && Array.isArray(llm) && llm.length > 0) {
          console.debug('[Quiz] LLM returned questions, replacing local quiz', llm.length);
          setQuestions(llm);
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
              <div>How many questions do you want? (1-20)</div>
              <input type="number" min={1} max={20} value={desiredCount} onChange={(e) => setDesiredCount(Number(e.target.value || 5))} className="border p-2 rounded w-24" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
                <Button onClick={() => startQuiz(desiredCount)}>Start Quiz</Button>
              </div>
            </div>
          )}

          {mode === 'running' && (
            <>
              <div className="text-sm text-muted-foreground mb-4">Time: {Math.floor(secondsElapsed / 60).toString().padStart(2,'0')}:{(secondsElapsed%60).toString().padStart(2,'0')}</div>
              <div className="space-y-6 max-w-4xl mx-auto">
                {questions.map((q, i) => (
                  <div key={i} className="mb-6 p-4 border rounded-lg bg-card">
                    <div className="mb-3 font-medium text-base leading-relaxed break-words whitespace-pre-wrap">{i + 1}. {q.question}</div>
                    <div className="grid gap-2">
                      {q.choices.map((c: string, ci: number) => (
                        <label key={ci} className={`p-3 border rounded cursor-pointer transition-colors hover:bg-muted/50 flex items-start gap-2 ${answers[i] === ci ? 'bg-primary/10 border-primary' : ''}`}>
                          <input type="radio" name={`q-${i}`} checked={answers[i] === ci} onChange={() => setAnswers(a => ({ ...a, [i]: ci }))} className="mt-1 flex-shrink-0" />
                          <span className="break-words whitespace-normal leading-relaxed">{c}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
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
