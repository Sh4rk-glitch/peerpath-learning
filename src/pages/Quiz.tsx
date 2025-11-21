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

  useEffect(() => {
    let mounted = true;
    lessonGen.getLesson(subject, index).then(l => {
      if (!mounted) return;
      setLesson(l);
      const q = lessonGen.generateQuizFromLesson(l);
      setQuestions(q);
    });
    return () => { mounted = false; };
  }, [subject, index]);

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answerIndex) correct++;
    });
    setScore(Math.round((correct / questions.length) * 100));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <Card className="p-8">
          <h1 className="text-2xl font-semibold mb-4">Quiz — {lesson?.title || 'Lesson'}</h1>
          {questions.map((q, i) => (
            <div key={i} className="mb-6">
              <div className="mb-2 font-medium">{i + 1}. {q.question}</div>
              <div className="grid gap-2">
                {q.choices.map((c: string, ci: number) => (
                  <label key={ci} className={`p-2 border rounded ${answers[i] === ci ? 'bg-primary/10' : ''}`}>
                    <input type="radio" name={`q-${i}`} checked={answers[i] === ci} onChange={() => setAnswers(a => ({ ...a, [i]: ci }))} />
                    <span className="ml-2">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {score === null ? (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              <Button onClick={submit}>Submit Quiz</Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-semibold">Score: {score}%</div>
              <div className="mt-4 flex gap-2 justify-center">
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
