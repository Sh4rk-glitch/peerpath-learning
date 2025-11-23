import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useEffect, useState } from "react";
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProgressCard from "@/components/ProgressCard";
import { Flame, Target, Award, Calendar, TrendingUp, Clock, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, displayName, profileLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const demoMode = searchParams.get('demo') === '1';
  const [progressData, setProgressData] = useState<any[]>([]);

  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [streakDays, setStreakDays] = useState<number>(0);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const [badgesCount, setBadgesCount] = useState<number>(0);
  const [badgesList, setBadgesList] = useState<any[]>([]);
  const [avgMastery, setAvgMastery] = useState<number | null>(null);
  const [totalStudyMinutes, setTotalStudyMinutes] = useState<number>(0);

  const [showStreakDialog, setShowStreakDialog] = useState(false);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [showStudyDialog, setShowStudyDialog] = useState(false);
  const [studyRange, setStudyRange] = useState<'day'|'week'|'month'|'all'>('month');
  const [showAvgNotice, setShowAvgNotice] = useState(false);

  const hoverPos = useRef<{ x:number; y:number; stat?:string }>({ x:0, y:0 });
  const [, setHoverTick] = useState(0);

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extracted loader so we can call it from storage events (refresh) and from effects
  const loadDashboard = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
        // 1) Fetch user skill progress
        const { data: progressRows, error: progressErr } = await supabase
          .from('user_skill_progress')
          .select('id, skill_id, mastery_percentage, lessons_completed, total_lessons, updated_at, participation_minutes')
          .eq('user_id', user.id)
          .order('mastery_percentage', { ascending: false })
          .limit(50);

        if (progressErr) console.warn('progressErr', progressErr);

        const skillIds = (progressRows ?? []).map((r: any) => r.skill_id).filter(Boolean);

        // 2) Fetch skill nodes for titles and subject ids
        const { data: skills } = await supabase
          .from('skill_nodes')
          .select('id, title, subject_id')
          .in('id', skillIds || []);

        const subjectIds = (skills ?? []).map((s: any) => s.subject_id).filter(Boolean);

        // 3) Fetch subject names
        const { data: subjects } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', subjectIds || []);

        const subjectMap = new Map((subjects ?? []).map((s: any) => [s.id, s.name]));
        const skillMap = new Map((skills ?? []).map((s: any) => [s.id, s]));

        const progressDataMapped = (progressRows ?? []).map((r: any) => {
          const skill = skillMap.get(r.skill_id) || {};
          const subjName = subjectMap.get(skill.subject_id) ?? skill.title ?? 'Unknown';
          const nameLower = (subjName || '').toLowerCase();
          let category: any = 'science';
          if (nameLower.includes('calc') || nameLower.includes('math')) category = 'math';
          else if (nameLower.includes('span') || nameLower.includes('language')) category = 'language';
          else if (nameLower.includes('bio') || nameLower.includes('chem') || nameLower.includes('physics')) category = 'science';
          else if (nameLower.includes('art')) category = 'arts';
          else category = 'tech';

          return {
            subject: subjName,
            skillTitle: skill.title ?? 'Unknown Skill',
            mastery: r.mastery_percentage ?? 0,
            skillsCompleted: r.lessons_completed ?? 0,
            totalSkills: r.total_lessons ?? 0,
            recentGain: Math.max(0, Math.round((r.mastery_percentage ?? 0) * 0.1)),
            category
          };
        });

        // 4) Upcoming sessions
        const nowIso = new Date().toISOString();
        const { data: sessionsRows } = await supabase
          .from('sessions')
          .select('id, title, start_time, subject_id')
          .gte('start_time', nowIso)
          .order('start_time', { ascending: true })
          .limit(6);

        const sessionSubjectIds = (sessionsRows ?? []).map((s: any) => s.subject_id).filter(Boolean);
        // we'll fetch subject names for any sessions we show
        const { data: sessionSubjects } = await supabase
          .from('subjects')
          .select('id, name')
          .in('id', sessionSubjectIds || []);
        const sessionSubjectMap = new Map((sessionSubjects ?? []).map((s: any) => [s.id, s.name]));

        const upcoming = (sessionsRows ?? []).map((s: any) => ({
          id: s.id,
          title: s.title,
          time: new Date(s.start_time).toLocaleString(),
          subject: sessionSubjectMap.get(s.subject_id) ?? 'General'
        }));

        // (user upcoming sessions will be fetched after we load joined session ids)

        // 5) Recent activity: combine recent progress updates & session joins
        const recentProgress = (progressRows ?? []).slice(0, 8).map((r: any) => ({
          type: 'lesson',
          title: `${skillMap.get(r.skill_id)?.title ?? 'Skill'} progress`,
          progress: r.lessons_completed ?? 0,
          time: r.updated_at
        }));

        const { data: joinedSessions } = await supabase
          .from('session_participants')
          .select('id, session_id, joined_at')
          .eq('user_id', user.id)
          .order('joined_at', { ascending: false })
          .limit(6);

        const sessionIds = (joinedSessions ?? []).map((j: any) => j.session_id).filter(Boolean);
        const { data: joinedSessionRows } = await supabase
          .from('sessions')
          .select('id, title, start_time')
          .in('id', sessionIds || []);

        // Fetch the user's upcoming joined sessions (start_time >= now) and prefer showing these
        let userUpcoming: any[] = [];
        try {
          if ((sessionIds || []).length > 0) {
            const { data: userUpcomingRows } = await supabase
              .from('sessions')
              .select('id, title, start_time, subject_id')
              .in('id', sessionIds || [])
              .gte('start_time', nowIso)
              .order('start_time', { ascending: true });

            const userSubjectIds = (userUpcomingRows ?? []).map((s: any) => s.subject_id).filter(Boolean);
            if (userSubjectIds.length > 0) {
              const { data: userSubjects } = await supabase
                .from('subjects')
                .select('id, name')
                .in('id', userSubjectIds || []);
              (userSubjects ?? []).forEach((us: any) => sessionSubjectMap.set(us.id, us.name));
            }

            (userUpcomingRows ?? []).forEach((s: any) => {
              userUpcoming.push({ id: s.id, title: s.title, time: new Date(s.start_time).toLocaleString(), subject: sessionSubjectMap.get(s.subject_id) ?? 'General' });
            });
          }
        } catch (e) {
          console.warn('Error fetching user upcoming sessions', e);
        }

        const joinedMap = new Map((joinedSessionRows ?? []).map((s: any) => [s.id, s]));

        const recentSessions = (joinedSessions ?? []).map((j: any) => ({
          type: 'session',
          title: joinedMap.get(j.session_id)?.title ?? 'Session',
          duration: joinedMap.get(j.session_id)?.duration_minutes ?? undefined,
          time: j.joined_at
        }));

          // Compute badges, avg mastery, study time, and streak (best-effort)
          try {
            const { data: badgeRows } = await supabase.from('user_badges').select('badge_id, earned_at').eq('user_id', user.id);
            const badgeIds = (badgeRows ?? []).map((b:any)=>b.badge_id).filter(Boolean);
            let badgesResolved:any[] = [];
            if (badgeIds.length > 0) {
              const { data: badgeDefs } = await supabase.from('badges').select('id, name, description, criteria').in('id', badgeIds as any[]);
              badgesResolved = (badgeDefs ?? []).map((d:any) => ({ id: d.id, name: d.name, description: d.description, criteria: d.criteria }));
            }

            const avg = (progressRows ?? []).reduce((acc:any, r:any) => acc + (r.mastery_percentage ?? 0), 0) / Math.max(1, (progressRows ?? []).length);
            const totalMinutesFromProgress = (progressRows ?? []).reduce((acc:any, r:any) => acc + (Number(r.participation_minutes) || 0), 0);
            const totalMinutesFromSessions = (joinedSessionRows ?? []).reduce((acc:any, s:any) => acc + (Number(s.duration_minutes) || 0), 0);

            const dateSet = new Set<string>();
            (progressRows ?? []).forEach((r:any) => { if (r.updated_at) dateSet.add((new Date(r.updated_at)).toISOString().slice(0,10)); });
            (joinedSessions ?? []).forEach((j:any) => { if (j.joined_at) dateSet.add((new Date(j.joined_at)).toISOString().slice(0,10)); });

            const today = new Date();
            let streak = 0;
            const datesList: string[] = [];
            for (let i=0;i<365;i++){
              const d = new Date(today.getTime() - i*24*60*60*1000);
              const key = d.toISOString().slice(0,10);
              if (dateSet.has(key)) { streak++; datesList.push(key); } else break;
            }

            setBadgesCount((badgeRows ?? []).length);
            setBadgesList(badgesResolved);
            setAvgMastery(Math.round(avg));
            setTotalStudyMinutes(Math.round(totalMinutesFromProgress + totalMinutesFromSessions));
            setStreakDays(streak);
            setStreakDates(datesList);
          } catch (e) {
            console.warn('Stats compute error', e);
          }

        // Merge in any locally-submitted quiz (best-effort) so dashboard shows immediate feedback
        const localQuizRaw = typeof window !== 'undefined' ? localStorage.getItem('peerpath:quiz:submitted') : null;
        let localQuizList: any[] = [];
        try {
          const parsed = localQuizRaw ? JSON.parse(localQuizRaw) : null;
          if (Array.isArray(parsed)) localQuizList = parsed;
          else if (parsed) localQuizList = [parsed];
        } catch (_) { localQuizList = []; }

        const combined = [...localQuizList, ...recentProgress, ...recentSessions]
          .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 10);

      // mark which upcoming sessions the user has joined
      const upcomingMarked = (upcoming || []).map((s:any) => ({ ...s, isJoined: sessionIds.includes(s.id) }));

      // If the user has upcoming joined sessions, prefer showing those in the sidebar
      const upcomingToShow = (userUpcoming && userUpcoming.length > 0)
        ? userUpcoming.map((s:any) => ({ ...s, isJoined: true }))
        : upcomingMarked;

      setProgressData(progressDataMapped);
      setUpcomingSessions(upcomingToShow);
      setRecentActivity(combined);
    } catch (e) {
      console.error('Dashboard load error', e);
      toast({ title: 'Dashboard error', description: 'Could not load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  // Join a session (best-effort insert into session_participants)
  const joinSession = async (sessionId: string) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const payload = { session_id: sessionId, user_id: user.id, joined_at: new Date().toISOString() };
      const { data, error } = await supabase.from('session_participants').insert(payload).select();
      if (error) {
        console.warn('Could not join session', error);
        toast({ title: 'Could not join', description: 'Unable to join session (server error).', variant: 'destructive' });
      } else {
        toast({ title: 'Joined', description: 'You have joined the session.' });
        // signal other tabs and reload
        try { localStorage.setItem('peerpath:dashboard:refresh', Date.now().toString()); } catch(e){}
        await loadDashboard();
      }
    } catch (e) {
      console.error('joinSession exception', e);
      toast({ title: 'Could not join', description: 'An unexpected error occurred.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    // If demo mode, populate with a canned, long-time-user dataset
    if (demoMode) {
      setLoading(false);
      setProgressData([
        { subject: 'AP Biology', skillTitle: 'Cell Structure & Function', mastery: 92, skillsCompleted: 28, totalSkills: 30, recentGain: 4, category: 'science' },
        { subject: 'Calculus', skillTitle: 'Integration Techniques', mastery: 88, skillsCompleted: 26, totalSkills: 28, recentGain: 6, category: 'math' },
        { subject: 'Spanish', skillTitle: 'Conversational Spanish', mastery: 95, skillsCompleted: 35, totalSkills: 35, recentGain: 2, category: 'language' },
        { subject: 'Digital Art', skillTitle: 'Lighting & Shading', mastery: 84, skillsCompleted: 18, totalSkills: 20, recentGain: 10, category: 'arts' },
      ]);
      setUpcomingSessions([
        { id: 's1', title: 'Cellular Respiration Deep Dive', time: 'Today 3:00 PM', subject: 'AP Biology' },
        { id: 's2', title: 'Advanced Integrals Workshop', time: 'Tomorrow 5:00 PM', subject: 'Calculus' },
        { id: 's3', title: 'Spanish Conversation Club', time: 'Fri 7:00 PM', subject: 'Spanish' },
      ]);
      // richer demo recent activity with several sessions across day/week/month
      setRecentActivity([
        { type: 'session', title: 'Quick Review: Mendelian Genetics', duration: 90, time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
        { type: 'session', title: 'Problem Solving: Integration', duration: 60, time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
        { type: 'lesson', title: 'Limits & Continuity progress', progress: 100, time: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
        { type: 'session', title: 'Derivatives Study Room', duration: 45, time: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString() },
        { type: 'session', title: 'Advanced Integrals Workshop (recap)', duration: 120, time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString() },
        { type: 'session', title: 'Spanish Conversation Club', duration: 180, time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString() },
        { type: 'session', title: 'Digital Art Lighting Lab', duration: 240, time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString() },
      ]);
      // Demo stats: streak, badges, mastery and study time
      setStreakDays(45);
      setStreakDates(Array.from({length:45}).map((_,i)=>{
        const d = new Date(); d.setDate(d.getDate()-i); return d.toISOString().slice(0,10);
      }));
      setBadgesCount(7);
      setBadgesList([
        { id: 'b1', name: 'Consistency Champ', description: 'Studied 30 days in a row' },
        { id: 'b2', name: 'Speed Learner', description: 'Completed 10 skills quickly' },
        { id: 'b3', name: 'Quiz Master', description: 'Scored 90%+ on 5 quizzes' },
      ]);
      setAvgMastery(90);
      setTotalStudyMinutes(12500); // demo total minutes (~208 hours)

      // mark first two upcoming sessions as joined for demo
      setUpcomingSessions((prev) => (prev || []).map((s, idx) => ({ ...s, isJoined: idx < 2 })));
      return;
    }

    // Otherwise run normal dashboard load
    loadDashboard();

    // Listen for cross-tab dashboard refresh signals via BroadcastChannel (more reliable)
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('peerpath');
        bc.onmessage = (ev: MessageEvent) => {
          try {
            if (ev?.data === 'dashboard:refresh' || ev?.data === 'quiz:submitted') loadDashboard();
          } catch (e) {}
        };
      }
    } catch (e) {}

    // Listen for cross-tab dashboard refresh signals
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === 'peerpath:dashboard:refresh' || e.key === 'peerpath:quiz:submitted') {
        loadDashboard();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('storage', onStorage); try { if (bc) bc.close(); } catch(e){} };
  }, [user, toast, demoMode]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{
            profileLoading ? 'Welcome back' : `Welcome back, ${displayName ?? user?.user_metadata?.username ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Student'}!`
          }</h1>
          <p className="text-xl text-muted-foreground">
            Track your progress and continue learning
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="p-6 relative" onMouseMove={(e:any)=>{ const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left)/r.width)*100; const y = ((e.clientY - r.top)/r.height)*100; hoverPos.current = { x,y, stat: 'streak' }; setHoverTick(t => t+1); }} onClick={() => setShowStreakDialog(true)}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Streak</span>
            </div>
            <p className="text-3xl font-bold">{streakDays} days</p>
            <div className="pointer-events-none absolute inset-0" style={{background: hoverPos.current.stat === 'streak' ? `radial-gradient(circle at ${hoverPos.current.x}% ${hoverPos.current.y}%, rgba(255,255,255,0.06), transparent)` : 'transparent'}} />
          </Card>

          <Card className="p-6 relative" onMouseMove={(e:any)=>{ const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left)/r.width)*100; const y = ((e.clientY - r.top)/r.height)*100; hoverPos.current = { x,y, stat: 'avg' }; setHoverTick(t => t+1); }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Avg Mastery</span>
            </div>
            <p className="text-3xl font-bold">{avgMastery ?? '—'}%</p>
            <button className="absolute right-2 bottom-2 text-xs text-muted-foreground" onClick={() => { setShowAvgNotice(true); setTimeout(()=>setShowAvgNotice(false), 2800); }}>Details</button>
            <div className="pointer-events-none absolute inset-0" style={{background: hoverPos.current.stat === 'avg' ? `radial-gradient(circle at ${hoverPos.current.x}% ${hoverPos.current.y}%, rgba(255,255,255,0.04), transparent)` : 'transparent'}} />
          </Card>

          <Card className="p-6 relative" onMouseMove={(e:any)=>{ const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left)/r.width)*100; const y = ((e.clientY - r.top)/r.height)*100; hoverPos.current = { x,y, stat: 'badges' }; setHoverTick(t => t+1); }} onClick={() => setShowBadgesDialog(true)}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Award className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Badges</span>
            </div>
            <p className="text-3xl font-bold">{badgesCount}</p>
            <div className="pointer-events-none absolute inset-0" style={{background: hoverPos.current.stat === 'badges' ? `radial-gradient(circle at ${hoverPos.current.x}% ${hoverPos.current.y}%, rgba(255,255,255,0.04), transparent)` : 'transparent'}} />
          </Card>

          <Card className="p-6 relative" onMouseMove={(e:any)=>{ const r = e.currentTarget.getBoundingClientRect(); const x = ((e.clientX - r.left)/r.width)*100; const y = ((e.clientY - r.top)/r.height)*100; hoverPos.current = { x,y, stat: 'study' }; setHoverTick(t => t+1); }} onClick={() => setShowStudyDialog(true)}>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Study Time</span>
            </div>
            <p className="text-3xl font-bold">{Math.round((totalStudyMinutes || 0)/60)}h</p>
            <div className="pointer-events-none absolute inset-0" style={{background: hoverPos.current.stat === 'study' ? `radial-gradient(circle at ${hoverPos.current.x}% ${hoverPos.current.y}%, rgba(255,255,255,0.04), transparent)` : 'transparent'}} />
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {loading && (
              <div className="p-4 bg-muted rounded">Loading your dashboard...</div>
            )}
            {/* Active Skills */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2>Active Skills</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate('/subjects')}>View All</Button>
                  <Button variant="outline" size="sm" onClick={() => loadDashboard()}>Refresh</Button>
                </div>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {progressData.map((progress) => (
                  <ProgressCard key={progress.subject} {...progress} />
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="mb-6">Recent Activity</h2>
              
              <Card className="divide-y">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {activity.type === "quiz" && <Target className="h-5 w-5" />}
                      {activity.type === "session" && <Calendar className="h-5 w-5" />}
                      {activity.type === "lesson" && <TrendingUp className="h-5 w-5" />}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-medium">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.time}</p>
                    </div>
                    
                    <div className="text-right">
                      {"score" in activity && typeof (activity as any).score === 'number' && (
                        <Badge variant={(activity as any).score >= 80 ? "default" : "secondary"}>
                          {(activity as any).score}%
                        </Badge>
                      )}
                      {"duration" in activity && (
                        <span className="text-sm text-muted-foreground">{activity.duration} min</span>
                      )}
                      {"progress" in activity && (
                        <Badge variant="default">Completed</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Upcoming Sessions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </h3>
              
              <div className="space-y-4">
                {
                  // show message when user hasn't joined any sessions yet
                  (upcomingSessions || []).filter((s:any)=>s.isJoined).length === 0 ? (
                    <div className="p-4 rounded-lg bg-muted text-center">
                      <p className="font-medium">You haven't joined any sessions yet.</p>
                      <p className="text-sm text-muted-foreground">Click below to browse sessions and join one.</p>
                      <div className="mt-3">
                        <Button onClick={() => navigate('/schedule')}>Find Sessions</Button>
                      </div>
                    </div>
                  ) : (
                    // show up to 2 joined sessions
                    (upcomingSessions || []).filter((s:any)=>s.isJoined).slice(0,2).map((session:any, index:number) => (
                      <div key={index} className="p-3 rounded-lg bg-muted space-y-1 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{session.title}</p>
                          <p className="text-xs text-muted-foreground">{session.time}</p>
                          <Badge variant="outline" className="text-xs">{session.subject}</Badge>
                        </div>
                        <div>
                          <Badge>Joined</Badge>
                        </div>
                      </div>
                    ))
                  )
                }

                <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/schedule?mine=1')}>
                  View Schedule
                </Button>
              </div>
            </Card>

            {/* Suggestions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Recommended for You</h3>
              
              <div className="space-y-3">
                <div className="p-3 rounded-lg border space-y-1">
                  <p className="font-medium text-sm">Complete Photosynthesis Quiz</p>
                  <p className="text-xs text-muted-foreground">Boost your Biology mastery</p>
                </div>
                
                <div className="p-3 rounded-lg border space-y-1">
                  <p className="font-medium text-sm">Join Study Room: Derivatives</p>
                  <p className="text-xs text-muted-foreground">Tomorrow 3:00 PM</p>
                </div>
              </div>
            </Card>

            {/* Export Portfolio & Judges Demo */}
            <Card className="p-6 bg-gradient-card">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Export Portfolio</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download your achievements and progress for college applications
              </p>
              <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full" onClick={() => {
                  try {
                    // Generate a simple PDF summary using jsPDF
                    // Import lazily to avoid SSR/packaging issues
                    (async () => {
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
                      const margin = 40;
                      let y = margin;
                      doc.setFontSize(18);
                      doc.text('PeerPath Portfolio', margin, y);
                      doc.setFontSize(10);
                      doc.text(`Generated: ${(new Date()).toLocaleString()}`, margin, y + 18);
                      y += 36;

                      doc.setFontSize(12);
                      doc.text('Progress Summary', margin, y);
                      y += 18;
                      for (const p of progressData) {
                        const line = `${p.subject} — ${p.skillTitle ?? ''} — Mastery: ${p.mastery}% (${p.skillsCompleted}/${p.totalSkills})`;
                        doc.text(line, margin, y);
                        y += 14;
                        if (y > 700) { doc.addPage(); y = margin; }
                      }

                      y += 8;
                      doc.text('Upcoming Sessions', margin, y);
                      y += 18;
                      for (const s of upcomingSessions) {
                        const line = `${s.time} — ${s.title} (${s.subject ?? ''})`;
                        doc.text(line, margin, y);
                        y += 14;
                        if (y > 700) { doc.addPage(); y = margin; }
                      }

                      y += 8;
                      doc.text('Recent Activity', margin, y);
                      y += 18;
                      for (const a of recentActivity) {
                        let line = '';
                        if (a.type === 'quiz') line = `Quiz: ${a.title} — Score: ${a.score ?? ''} — ${new Date(a.time).toLocaleString()}`;
                        else if (a.type === 'lesson') line = `Lesson: ${a.title} — Progress: ${a.progress ?? ''} — ${new Date(a.time).toLocaleString()}`;
                        else if (a.type === 'session') line = `Session: ${a.title} — Duration: ${a.duration ?? ''} min — ${new Date(a.time).toLocaleString()}`;
                        else line = `${a.title} — ${a.time}`;
                        doc.text(line, margin, y);
                        y += 14;
                        if (y > 700) { doc.addPage(); y = margin; }
                      }

                      const filename = `peerpath-portfolio-${(new Date()).toISOString().slice(0,10)}.pdf`;
                      doc.save(filename);
                      toast({ title: 'Downloaded', description: 'Portfolio PDF saved locally.' });
                    })();
                  } catch (e) {
                    console.error('Download error', e);
                    toast({ title: 'Download failed', description: 'Could not generate portfolio.' });
                  }
                }}>
                  <Download className="mr-2 h-4 w-4" /> Export PDF
                </Button>

                { demoMode ? (
                  <Button className="w-full" variant="ghost" onClick={() => { try { if (window.opener) { window.opener.focus(); window.close(); } else { window.location.href = '/'; } } catch(e){ window.location.href = '/'; } }}>
                    Click here to go back
                  </Button>
                ) : (
                  <Button className="w-full" variant="ghost" onClick={() => window.open('/dashboard?demo=1', '_blank')}>
                    JUDGES CLICK ME FOR SIMULATION OF DASHBOARD!
                  </Button>
                )}
                </div>
            </Card>
            {/* Modals for stats */}
            <Dialog open={showStreakDialog} onOpenChange={setShowStreakDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Streak</DialogTitle>
                  <DialogDescription>Days you've been active on PeerPath and recent activity dates.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 prose max-w-none">
                  <p className="mb-2">Current streak: <strong>{streakDays} days</strong></p>
                  <p className="mb-2">Recent active dates:</p>
                  <ul>
                    {streakDates.slice(0,30).map(d => <li key={d}>{d}</li>)}
                  </ul>
                  <p className="mt-4">Milestones: you earn badges at 7, 14, 30, 90 days. Keep learning to earn more badges!</p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStreakDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Your Badges</DialogTitle>
                  <DialogDescription>Badges you've earned and how to earn more.</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  {badgesList && badgesList.length > 0 ? (
                    <div className="space-y-3">
                      {badgesList.map(b => (
                        <div key={b.id} className="p-3 border rounded">
                          <div className="font-semibold">{b.name}</div>
                          <div className="text-sm text-muted-foreground">{b.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">How to earn: {b.criteria}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">You haven't earned any badges yet. Keep progressing to unlock badges at key milestones (streaks, mastery, participation).</div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowBadgesDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showStudyDialog} onOpenChange={setShowStudyDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Study Time</DialogTitle>
                  <DialogDescription>Filter study time by range.</DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <div className="flex gap-2 mb-4">
                    <Button size="sm" variant={studyRange==='day'? 'default':'outline'} onClick={() => setStudyRange('day')}>Day</Button>
                    <Button size="sm" variant={studyRange==='week'? 'default':'outline'} onClick={() => setStudyRange('week')}>Week</Button>
                    <Button size="sm" variant={studyRange==='month'? 'default':'outline'} onClick={() => setStudyRange('month')}>Month</Button>
                    <Button size="sm" variant={studyRange==='all'? 'default':'outline'} onClick={() => setStudyRange('all')}>All Time</Button>
                  </div>
                  <div className="p-3 border rounded">
                    <p className="font-medium">Total study time ({studyRange}):</p>
                    <p className="text-2xl">{
                      (() => {
                        if (studyRange === 'all') return `${Math.round((totalStudyMinutes||0)/60)} hours`;
                        const now = Date.now();
                        let cutoff = 0;
                        if (studyRange === 'day') cutoff = now - 24*60*60*1000;
                        if (studyRange === 'week') cutoff = now - 7*24*60*60*1000;
                        if (studyRange === 'month') cutoff = now - 30*24*60*60*1000;
                        let mins = 0;
                        (recentActivity || []).forEach((a:any) => {
                          try {
                            const t = new Date(a.time).getTime();
                            if (t >= cutoff) {
                              if (a.type === 'session' && a.duration) mins += Number(a.duration);
                              if (a.type === 'lesson' && a.progress) mins += 5; // heuristic
                            }
                          } catch(e){}
                        });
                        return `${Math.round(mins/60)} hours`;
                      })()
                    }</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowStudyDialog(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Avg Mastery slide-in notice */}
            {showAvgNotice && (
              <div className="fixed bottom-6 right-6 bg-card p-4 rounded shadow-lg z-50">
                <div className="font-semibold">Feature coming soon</div>
                <div className="text-sm text-muted-foreground">Avg Mastery: {avgMastery ?? '—'}%</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
