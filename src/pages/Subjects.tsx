import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import lessonGen from "@/lib/lessonGenerator";
import { Microscope, Calculator, BookText, Languages, Palette, Music, Dumbbell, Code, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SessionCard from "@/components/SessionCard";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Subjects = () => {
  const allSubjects = [
    {
      title: "AP Biology",
      category: "science" as const,
      nextSession: "2:30 PM today",
      activeUsers: 234,
      icon: <Microscope className="h-6 w-6" />,
    },
    {
      title: "Chemistry",
      category: "science" as const,
      nextSession: "3:45 PM today",
      activeUsers: 187,
      icon: <FlaskConical className="h-6 w-6" />,
    },
    {
      title: "Calculus",
      category: "math" as const,
      nextSession: "4:00 PM today",
      activeUsers: 189,
      icon: <Calculator className="h-6 w-6" />,
    },
    {
      title: "Statistics",
      category: "math" as const,
      nextSession: "Tomorrow 2:00 PM",
      activeUsers: 142,
      icon: <Calculator className="h-6 w-6" />,
    },
    {
      title: "World History",
      category: "humanities" as const,
      nextSession: "Tomorrow 3:00 PM",
      activeUsers: 156,
      icon: <BookText className="h-6 w-6" />,
    },
    {
      title: "Literature",
      category: "humanities" as const,
      nextSession: "5:30 PM today",
      activeUsers: 178,
      icon: <BookText className="h-6 w-6" />,
    },
    {
      title: "Spanish",
      category: "language" as const,
      nextSession: "5:15 PM today",
      activeUsers: 198,
      icon: <Languages className="h-6 w-6" />,
    },
    {
      title: "French",
      category: "language" as const,
      nextSession: "Tomorrow 4:30 PM",
      activeUsers: 143,
      icon: <Languages className="h-6 w-6" />,
    },
    {
      title: "Digital Art",
      category: "arts" as const,
      nextSession: "Tomorrow 1:00 PM",
      activeUsers: 124,
      icon: <Palette className="h-6 w-6" />,
    },
    {
      title: "Music Theory",
      category: "arts" as const,
      nextSession: "6:00 PM today",
      activeUsers: 98,
      icon: <Music className="h-6 w-6" />,
    },
    {
      title: "Computer Science",
      category: "tech" as const,
      nextSession: "Tomorrow 10:00 AM",
      activeUsers: 267,
      icon: <Code className="h-6 w-6" />,
    },
    {
      title: "Physical Education",
      category: "health" as const,
      nextSession: "Tomorrow 9:00 AM",
      activeUsers: 156,
      icon: <Dumbbell className="h-6 w-6" />,
    },
  ];

  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const selected = slug ? allSubjects.find(s => encodeURIComponent(s.title.replace(/\s+/g, "-").toLowerCase()) === slug) : null;
  const subjectSlug = slug || null;
  const [lessons, setLessons] = useState<Array<{ title: string; content: string }>>([]);
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
    } catch (err: any) {
      toast({ title: 'Error joining session', description: err?.message || String(err), variant: 'destructive' });
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allSubjects.map((subject) => (
              <SubjectCard key={subject.title} {...subject} />
            ))}
          </div>
        )}

        {selected && (
          <section className="mt-12">
            <h2 className="mb-4">Live Sessions for {selected.title}</h2>
            {subjectSessions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {subjectSessions.map((session) => (
                  <SessionCard key={session.id} sessionId={session.id} onJoin={() => handleJoin(session.id)} {...session} />
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
                          const overviewWords = lesson.content.split(/\s+/).slice(0, 8).join(' ');
                          return (
                            <LessonCard key={i} subject={selected} index={i + 1} lesson={{...lesson, overview: overviewWords + (lesson.content.split(/\s+/).length > 8 ? '...' : '')}} subjectSlug={subjectSlug || ''} />
                          );
                        })
                      ) : (
                        <div className="col-span-full text-muted-foreground">No lessons available for this subject.</div>
                      )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const LessonCard = ({ subject, index, lesson, subjectSlug }: { subject: any; index: number; lesson: { title: string; content: string; overview?: string }; subjectSlug: string }) => {
  const navigate = useNavigate();

  return (
    <div className="p-4 border rounded-lg">
      <h4 className="font-semibold">{lesson.title}</h4>
      <p className="text-sm text-muted-foreground">{lesson.overview || lesson.content.split(/\s+/).slice(0,8).join(' ') + '...'}</p>
      <div className="mt-3 flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => navigate(`/lesson?subject=${encodeURIComponent(subjectSlug)}&index=${index}`)}>Open Lesson</Button>
        <Button size="sm" onClick={() => navigate(`/schedule?subject=${encodeURIComponent(subjectSlug)}&openSession=1`)}>Join Live Session</Button>
        <Button size="sm" variant="ghost" onClick={() => navigate(`/schedule?subject=${encodeURIComponent(subjectSlug)}&openCreate=1`)}>Create Session</Button>
      </div>
    </div>
  );
};

export default Subjects;
