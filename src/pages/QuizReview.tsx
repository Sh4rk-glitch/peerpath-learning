import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const QuizReview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get('id');
  const [data, setData] = React.useState<any>(null);

  React.useEffect(() => {
    if (!id) return;
    try {
      const raw = sessionStorage.getItem(id);
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch (e) {
      console.error('Could not load quiz review data', e);
    }
  }, [id]);

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <Card className="p-8">No review data found. Go back and take a quiz first.</Card>
        </div>
      </div>
    );
  }

  const { questions = [], answers = {}, meta = {} } = data;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Review — {meta.title || 'Quiz Review'}</h1>
              <div className="text-sm text-muted-foreground">Review your answers. Click the chevron to open details.</div>
            </div>
            <div>
              <button className="btn" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>

          <div className="md:flex md:gap-6">
            <div className="md:flex-1">
              <ol className="space-y-4">
                {questions.map((q:any, i:number) => (
                  <li key={i} className="p-5 border rounded-lg bg-card">
                    <div className="font-medium mb-3">{i + 1}. {q.question}</div>
                    <div className="grid gap-3">
                      {q.choices.map((c:string, ci:number) => {
                        const selected = answers[i] === ci;
                        const correct = q.answerIndex === ci;
                        // Decide classes: green for correct, red for selected wrong. No white overlay.
                        const classes = correct ? 'p-2 rounded bg-green-100 text-green-900' : (selected && !correct) ? 'p-2 rounded bg-red-100 text-red-900' : 'p-2 rounded';
                        return (
                          <div key={ci} className={classes}>
                            <div className={`${selected ? 'font-semibold' : ''}`}>{c}</div>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="md:w-96 mt-6 md:mt-0">
              <Accordion type="single" collapsible defaultValue={questions.length > 0 ? `rev-0` : undefined}>
                {questions.map((q:any, i:number) => (
                  <AccordionItem value={`rev-${i}`} key={`rev-${i}`}>
                    <AccordionTrigger>{i + 1}. { (q.question || '').length > 80 ? (q.question || '').slice(0,80) + '…' : q.question }</AccordionTrigger>
                    <AccordionContent>
                      <div className="text-sm mb-2">Question: <div className="font-medium break-words">{q.question}</div></div>
                      <div className="text-sm mb-2">Your answer: <div className="font-medium">{ (typeof answers[i] === 'number') ? q.choices[answers[i]] : '—' }</div></div>
                      <div className="text-sm mb-2">Correct answer: <div className="font-medium">{ q.choices[q.answerIndex] }</div></div>
                      <div className="text-sm text-muted-foreground">{ q.explanation }</div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default QuizReview;
