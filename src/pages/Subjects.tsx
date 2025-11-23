import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import lessonGen from "@/lib/lessonGenerator";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { openQuizReviewInNewTab } from '@/lib/quizReview';
import ALL_SUBJECTS from '@/lib/subjectData';
import { supabase } from "@/integrations/supabase/client";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Subjects = () => {
  const allSubjects = ALL_SUBJECTS;

  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const q = new URLSearchParams(location.search);
  const searchQuery = q.get('search') || '';
  const { user } = useAuth();
  const { toast } = useToast();

  const selected = slug ? allSubjects.find(s => encodeURIComponent(s.title.replace(/\s+/g, "-").toLowerCase()) === slug) : null;
  const subjectSlug = slug || null;
  const [lessons, setLessons] = useState<Array<{ title: string; content: string }>>([]);
  const [selectedLesson, setSelectedLesson] = useState<{ title: string; content: string } | null>(null);
  const [showLessonDialog, setShowLessonDialog] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[] | null>(null);
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [enhancedQuizQuestions, setEnhancedQuizQuestions] = useState<any[] | null>(null);
  const [enhancedReady, setEnhancedReady] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; total: number } | null>(null);
  const [quizCount, setQuizCount] = useState<number>(5);
  const [quizStyle, setQuizStyle] = useState<'mixed'|'vocab'|'concept'|'application'>('mixed');
  const [subjectSessions, setSubjectSessions] = useState<any[]>([]);

  const handleJoin = async (sessionId: string) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const { error } = await supabase.from('session_participants').insert({ session_id: sessionId, user_id: user.id });
      if (error) throw error;
      toast({ title: 'Joined', description: 'You joined the session.' });
      // Re-fetch sessions to update participation status if necessary
      const subjectId = (selected as any)?.id || (selected ? encodeURIComponent(selected.title.toLowerCase()) : null);
      if (subjectId) {
        const { data } = await supabase.from('sessions').select('*').eq('subject_id', subjectId);
        setSubjectSessions(data || []);
      }
      // signal dashboard (and other tabs) to refresh so Upcoming Sessions updates
      try { localStorage.setItem('peerpath:dashboard:refresh', Date.now().toString()); } catch(e){}
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('peerpath');
          bc.postMessage('dashboard:refresh');
          bc.close();
        }
      } catch (e) {}
      // signal dashboard (and other tabs) to refresh so Upcoming Sessions updates
      try { localStorage.setItem('peerpath:dashboard:refresh', Date.now().toString()); } catch(e){}
    } catch (err: any) {
      toast({ title: 'Error joining session', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const openLesson = (lesson: { title: string; content: string }) => {
    setSelectedLesson(lesson);
    setShowLessonDialog(true);
  };

  const openQuizSetup = (lesson: { title: string; content: string }) => {
    setSelectedLesson(lesson);
    setShowQuizDialog(true);
    setQuizQuestions(null);
    setQuizAnswers({});
    setQuizResult(null);
    setEnhancedQuizQuestions(null);
    setEnhancedReady(false);
    setQuizCount(5);
  };

  const startQuizForLesson = async (lesson: { title: string; content: string }, count = 5) => {
    setSelectedLesson(lesson);
    setShowQuizDialog(true); // open dialog immediately
    setQuizLoading(true);
    setQuizAnswers({});
    setQuizResult(null);
    try {
      // First, generate a fast local quiz to show immediately
      const local = lessonGen.generateQuizFromLesson(lesson, count, quizStyle);
      const sanitizedLocal = (local || []).map((q:any) => ({
        ...q,
        question: lessonGen.sanitizeQuizText(String(q.question || '')),
        choices: (q.choices || []).map((c:any) => lessonGen.sanitizeQuizText(String(c || ''))),
        explanation: lessonGen.sanitizeQuizText(String(q.explanation || '')),
      }));
      setQuizQuestions(sanitizedLocal || []);
      setQuizLoading(false);

      // Meanwhile, try to generate an enhanced quiz via LLM in the background
      (async () => {
        try {
          const enhanced = await lessonGen.generateQuizWithLLM(lesson, Math.max(count, 6), quizStyle);
          if (enhanced && Array.isArray(enhanced) && enhanced.length > 0) {
            const sanitized = enhanced.map((q:any) => ({
              ...q,
              question: lessonGen.sanitizeQuizText(String(q.question || '')),
              choices: (q.choices || []).map((c:any) => lessonGen.sanitizeQuizText(String(c || ''))),
              explanation: lessonGen.sanitizeQuizText(String(q.explanation || '')),
            }));
            setEnhancedQuizQuestions(sanitized);
            setEnhancedReady(true);
            // notify user lightly
            try { toast({ title: 'Enhanced quiz ready', description: 'A richer version of this quiz is available.' }); } catch (e) {}
          }
        } catch (e) {
          // ignore background failure
          console.warn('Background enhanced quiz generation failed', e);
        }
      })();
    } catch (e) {
      console.error('startQuizForLesson error', e);
      toast({ title: 'Quiz error', description: 'Could not generate quiz for this lesson.', variant: 'destructive' });
      setQuizLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    if (subjectSlug) {
      lessonGen.getCurriculum(subjectSlug).then((c) => { if (mounted) setLessons(c || []); }).catch(() => {
        if (mounted) setLessons([]);
      });

      const fetchSubjectSessions = async () => {
        try {
          const subjectId = (selected as any)?.id || (selected ? encodeURIComponent(selected.title.toLowerCase()) : null);
          if (subjectId) {
            const { data } = await supabase.from('sessions').select('*').eq('subject_id', subjectId);
            if (mounted) setSubjectSessions(data || []);
          }
        } catch (error) {
          console.error('Error fetching subject sessions:', error);
          if (mounted) setSubjectSessions([]);
        }
      };
      fetchSubjectSessions();

    } else {
      setLessons([]);
      setSubjectSessions([]);
    }
    return () => { mounted = false; };
  }, [subjectSlug, selected]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2">{selected ? selected.title : 'All Subjects'}</h1>
            <p className="text-xl text-muted-foreground">
              {selected ? `Explore learning resources and sessions for ${selected.title}` : 'Explore subjects and start building your skill tree'}
            </p>
          </div>
          {selected && (
            <div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>Back</Button>
            </div>
          )}
        </div>

        {!selected && (
          <div>
            {searchQuery ? (
              <div>
                <h3 className="mb-4">Search results for "{searchQuery}"</h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {allSubjects.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase())).map((subject) => (
                    <SubjectCard key={subject.title} {...subject} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allSubjects.map((subject) => (
                  <SubjectCard key={subject.title} {...subject} />
                ))}
              </div>
            )}
          </div>
        )}

        {selected && (
          <section className="mt-12">
              <div className="mb-4">
                <button
                  onClick={() => navigate(`/schedule?subject=${encodeURIComponent((selected as any)?.id || selected.title)}`)}
                  className="w-full text-left group relative overflow-hidden rounded-lg p-6 bg-gradient-to-r from-primary/5 to-transparent hover:shadow-lg transition-transform transform hover:scale-[1.02]"
                  aria-label={`Sessions for ${selected.title}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Live Sessions</div>
                      <div className="text-2xl font-semibold">Sessions for {selected.title}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">View schedule</div>
                  </div>
                  {/* fluid hover overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute -inset-6 bg-[radial-gradient(circle_at_var(--x,50%)_var(--y,50%),rgba(255,255,255,0.06),transparent_30%)] transform-gpu will-change-transform" style={{ transition: 'opacity 220ms ease, transform 220ms ease' }} />
                  </div>
                </button>
              </div>
              {subjectSessions.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {subjectSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      sessionId={session.id}
                      onJoin={() => handleJoin(session.id)}
                      onDetails={() => { setSelectedSession(session); setShowSessionDialog(true); }}
                      {...session}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mb-6">No upcoming sessions for {selected.title}. Be the first to create one!</p>
              )}

            <h2 className="mb-4 mt-8">Learning Pathway and Resources</h2>
            <p className="text-muted-foreground mb-6">Learning pathway and resources for {selected.title}.</p>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {lessons.length > 0 ? (
                        lessons.map((lesson, i) => {
                          const overviewWords = lesson.content.split(/\s+/).slice(0, 16).join(' ');
                          return (
                            <LessonCard
                              key={i}
                              subject={selected}
                              index={i + 1}
                              lesson={{...lesson, overview: overviewWords + (lesson.content.split(/\s+/).length > 16 ? '...' : '')}}
                              subjectSlug={subjectSlug || ''}
                              onView={() => openLesson(lesson)}
                              onQuiz={() => openQuizSetup(lesson)}
                            />
                          );
                        })
                      ) : (
                        <div className="col-span-full text-muted-foreground">No lessons available for this subject.</div>
                      )}
            </div>

            {/* Lesson viewer dialog */}
            <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedLesson?.title || 'Lesson'}</DialogTitle>
                  <DialogDescription>Expanded lesson content with examples and practice.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 prose max-w-none">
                  {selectedLesson ? selectedLesson.content.split('\n\n').map((p, i) => <p key={i}>{p}</p>) : <p>No lesson selected.</p>}
                </div>
                <DialogFooter>
                    <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowLessonDialog(false)}>Close</Button>
                    <Button onClick={() => { if (selectedLesson) { openQuizSetup(selectedLesson); setShowLessonDialog(false); } }}>Take Quiz</Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Session viewer dialog */}
            <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedSession?.title || 'Session Details'}</DialogTitle>
                  <DialogDescription>Session information and join options.</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {selectedSession ? (
                    <div>
                      <p className="font-medium">Subject: {selectedSession.subject_id || selectedSession.subject || 'General'}</p>
                      <p className="text-sm text-muted-foreground">Time: {selectedSession.start_time ? new Date(selectedSession.start_time).toLocaleString() : 'TBD'}</p>
                      <p className="mt-2 text-sm">{selectedSession.description || selectedSession.title}</p>
                    </div>
                  ) : (
                    <p>No session selected.</p>
                  )}
                </div>
                <DialogFooter>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowSessionDialog(false)}>Close</Button>
                    <Button onClick={() => { if (selectedSession) { handleJoin(selectedSession.id); setShowSessionDialog(false); } }}>Join Session</Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Quiz dialog */}
            <Dialog open={showQuizDialog} onOpenChange={setShowQuizDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Quiz</DialogTitle>
                  <DialogDescription>Test your understanding of the lesson.</DialogDescription>
                </DialogHeader>

                <div className="max-w-6xl w-full mx-auto">
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="quiz-count">Questions</Label>
                        <Input id="quiz-count" type="number" value={quizCount} min={3} max={20} onChange={(e:any) => {
                          const v = parseInt(e.target.value || '0', 10);
                          setQuizCount(isNaN(v) ? 3 : Math.max(3, Math.min(20, v)));
                        }} className="w-24" />
                      </div>

                      <div className="flex items-center gap-2">
                        <Label htmlFor="quiz-style">Style</Label>
                        <select id="quiz-style" value={quizStyle} onChange={(e:any) => setQuizStyle(e.target.value)} className="form-select rounded border px-2 py-1 bg-white text-black">
                          <option value="mixed">Mixed</option>
                          <option value="vocab">Vocab</option>
                          <option value="concept">Concept</option>
                          <option value="application">Application</option>
                        </select>
                      </div>

                      <Button onClick={() => {
                        if (!selectedLesson) return;
                        try {
                          const url = `/quiz?subject=${encodeURIComponent((selected as any)?.title?.toLowerCase() || '')}&index=${encodeURIComponent(String(lessons.findIndex(l=>l===selectedLesson)+1 || 1))}&count=${encodeURIComponent(String(quizCount))}&style=${encodeURIComponent(String(quizStyle))}&newtab=1`;
                          navigate(url);
                        } catch (e) {
                          console.error('Could not open quiz in new tab', e);
                        }
                        setShowQuizDialog(false);
                      }} disabled={!selectedLesson || quizLoading}>Generate</Button>
                    </div>

                    {quizLoading && <div className="text-sm text-muted-foreground">Generating quiz...</div>}

                    {!quizLoading && quizQuestions && quizQuestions.length > 0 && (
                      <div className="max-h-[60vh] overflow-auto">
                        <div className="md:flex md:items-start md:gap-6">
                          <div className="md:flex-1 space-y-4">
                            {quizQuestions.map((q, idx) => (
                              <div key={idx} className="p-3 border rounded min-w-0">
                                <div className="font-medium break-words">{idx + 1}. {q.question}</div>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {q.choices.map((c:string, ci:number) => (
                                    <Button key={ci} className={`w-full text-left whitespace-normal break-words ${quizAnswers[idx] === ci ? 'bg-secondary text-white' : ''}`} variant={quizAnswers[idx] === ci ? 'secondary' : 'outline'} onClick={() => setQuizAnswers(a => ({ ...a, [idx]: ci }))}><span>{c}</span></Button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Right-hand review panel removed from dialog until user submits; review opens in new tab after submit */}
                        </div>
                      </div>
                    )}

                    {!quizLoading && (!quizQuestions || quizQuestions.length === 0) && (
                      <div className="text-sm text-muted-foreground">No quiz available for this lesson.</div>
                    )}
                  </div>

                  <DialogFooter>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => { setShowQuizDialog(false); setQuizQuestions(null); setQuizAnswers({}); setQuizResult(null); setEnhancedQuizQuestions(null); setEnhancedReady(false); }}>Close</Button>
                      {enhancedReady && (
                        <Button variant="secondary" onClick={() => {
                          if (enhancedQuizQuestions && enhancedQuizQuestions.length > 0) {
                            setQuizQuestions(enhancedQuizQuestions);
                            setEnhancedReady(false);
                            setEnhancedQuizQuestions(null);
                            setQuizAnswers({});
                            setQuizResult(null);
                          }
                        }}>Use Enhanced Quiz</Button>
                      )}
                    </div>
                  </DialogFooter>

                  {quizResult && (
                    <div className="p-4 border-t mt-2 max-h-[40vh] overflow-auto">
                      <div className="font-semibold">Results: {quizResult.score} / {quizResult.total}</div>
                      <div className="text-sm text-muted-foreground mt-2">Per-question results are shown beside each question for easier review.</div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </section>
        )}
      </div>
    </div>
  );
};

const LessonCard = ({ subject, index, lesson, subjectSlug, onView, onQuiz }: { subject: any; index: number; lesson: { title: string; content: string; overview?: string }; subjectSlug: string; onView?: () => void; onQuiz?: () => void }) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border rounded-lg min-h-[140px] flex flex-col justify-between">
      <div>
        <h4 className="font-semibold">{lesson.title}</h4>
        <p className="text-sm text-muted-foreground mt-2">{lesson.overview || lesson.content.split(/\s+/).slice(0,16).join(' ') + '...'}</p>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => onView ? onView() : navigate(`/lesson?subject=${encodeURIComponent(subjectSlug)}&index=${index}`)}>View Lesson</Button>
        <Button size="sm" onClick={() => {
          if (onQuiz) return onQuiz();
          // open quiz directly in a new tab with sensible defaults
            try {
            const url = `/quiz?subject=${encodeURIComponent(subjectSlug)}&index=${index}&count=5&style=mixed&newtab=1`;
            navigate(url);
          } catch (e) {
            navigate(`/lesson?subject=${encodeURIComponent(subjectSlug)}&index=${index}`);
          }
        }}>Take Quiz</Button>
        <Button size="sm" onClick={() => navigate(`/schedule?subject=${encodeURIComponent(subjectSlug)}&openSession=1`)}>Join Live</Button>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/schedule?subject=${encodeURIComponent(subjectSlug)}&openCreate=1`)}>Create Session</Button>
      </div>
    </div>
  );
};

export default Subjects;
