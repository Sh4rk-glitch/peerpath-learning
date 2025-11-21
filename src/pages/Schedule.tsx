import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import SessionCard from "@/components/SessionCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calendar, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const allSubjects = [
  { id: 'ap-biology', title: 'AP Biology' },
  { id: 'chemistry', title: 'Chemistry' },
  { id: 'calculus', title: 'Calculus' },
  { id: 'spanish', title: 'Spanish' },
  { id: 'digital-art', title: 'Digital Art' },
];

const Schedule = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const toast = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [dialogDate, setDialogDate] = useState('');
  const [dialogTime, setDialogTime] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [form, setForm] = useState({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });

  const fetchSessions = async () => {
    try {
      const { data } = await supabase.from('sessions').select('*');
      setSessions(data || []);
    } catch (e) {
      // ignore
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await supabase.from('subjects').select('id,name');
      if (data && data.length) setSubjectsList(data as any);
      else setSubjectsList(allSubjects as any);
    } catch (e) {
      setSubjectsList(allSubjects as any);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
  }, []);

  const filteredSessions = subjectFilter ? sessions.filter(s => s.subject_id === subjectFilter || s.subject === subjectFilter) : sessions;

  const handleCreateDialogOpen = (prefillSubjectId?: string) => {
    setForm(f => ({ ...f, subject_id: prefillSubjectId || f.subject_id }));
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!user) { navigate('/auth'); return; }
    try {
      const subjectId = form.subject_id || (subjectsList && subjectsList[0] && (subjectsList[0].id || subjectsList[0].title)) || null;
      if (!subjectId) { toast({ title: 'No subject selected', description: 'Please select a subject', variant: 'destructive' }); return; }

      let start = new Date(Date.now() + 60 * 60 * 1000);
      if (form.date && form.time) start = new Date(`${form.date}T${form.time}`);

      const payload: any = {
        title: form.title || `Session by ${user.user_metadata?.full_name || user.email}`,
        subject_id: subjectId,
        host_id: user.id,
        host_name: user.user_metadata?.full_name || user.email,
        start_time: start.toISOString(),
        duration_minutes: form.duration,
        capacity: form.capacity,
        format: 'discussion',
        description: '',
        status: 'scheduled',
      };

      const { data, error } = await supabase.from('sessions').insert(payload).select();
      if (error) throw error;
      setShowCreateDialog(false);
      setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
      if (data && data[0]) {
        setSelectedSession(data[0]);
        setShowSessionDialog(true);
        toast({ title: 'Session created', description: `Session "${data[0].title}" created.` });
      } else toast({ title: 'Session created', description: 'Your session was created.' });
      fetchSessions();
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleJoin = async (sessionId: string) => {
    if (!user) { navigate('/auth'); return; }
    try {
      const { error } = await supabase.from('session_participants').insert({ session_id: sessionId, user_id: user.id });
      if (error) throw error;
      toast({ title: 'Joined', description: 'You joined the session.' });
      fetchSessions();
    } catch (err: any) {
      toast({ title: 'Error joining session', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleJoinWithLink = async (session: any | null) => {
    if (!user) { navigate('/auth'); return; }
    try {
      if (session) {
        const { error } = await supabase.from('session_participants').insert({ session_id: session.id, user_id: user.id });
        if (error) throw error;
      }
      let meetingTime = new Date().toISOString();
      if (session && session.start_time) meetingTime = new Date(session.start_time).toISOString();
      else if (dialogDate && dialogTime) meetingTime = new Date(`${dialogDate}T${dialogTime}`).toISOString();
      const slug = session ? String(session.id).slice(0, 8) : Math.random().toString(36).slice(2, 10);
      const userPart = user.id ? String(user.id).slice(0, 6) : 'guest';
      const link = `https://meet.google.com/lookup/${slug}-${userPart}`;
      setJoinLink(link);
      toast({ title: 'Joined', description: 'Session joined. Placeholder meeting link generated.' });
    } catch (err: any) {
      toast({ title: 'Error joining session', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-2">Schedule</h1>
            <p className="text-xl text-muted-foreground">Browse and join upcoming study sessions</p>
          </div>
          <Button className="gap-2" onClick={() => handleCreateDialogOpen()}>
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        <div className="flex justify-center mb-6">
          <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v)}>
            <SelectTrigger className="w-64">
              <SelectValue>{subjectFilter ? (subjectsList.find((s:any) => s.id === subjectFilter)?.name || subjectFilter) : 'All Subjects'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Subjects</SelectItem>
              {(subjectsList || allSubjects).map((s: any, i: number) => (
                <SelectItem key={s.id || i} value={s.id || s.title}>{s.name || s.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {filteredSessions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {filteredSessions.map((session) => (
                  <SessionCard key={session.id} sessionId={session.id} onJoin={handleJoin} {...session} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground mb-4">Be the first to create a study session</p>
                <Button className="gap-2" onClick={() => handleCreateDialogOpen()}>
                  <Plus className="h-4 w-4" />
                  Create Session
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="my-sessions">
            <Card className="p-12 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your sessions</h3>
              <p className="text-muted-foreground">Sessions you've created or joined will appear here</p>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Past sessions</h3>
              <p className="text-muted-foreground">Previously attended sessions will appear here</p>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Session</DialogTitle>
              <DialogDescription>Provide session details and schedule it.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              <div>
                <Label htmlFor="session-title">Title</Label>
                <Input id="session-title" value={form.title} onChange={(e:any) => setForm((f:any) => ({ ...f, title: e.target.value }))} />
              </div>

              <div>
                <Label>Subject</Label>
                <Select onValueChange={(v:any) => setForm((f:any) => ({ ...f, subject_id: v }))}>
                  <SelectTrigger>
                    <SelectValue>{subjectsList.find((s:any) => s.id === form.subject_id)?.name || 'Select a subject'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(subjectsList || allSubjects).map((s: any, i: number) => (
                      <SelectItem key={s.id || i} value={s.id || s.title}>{s.name || s.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e:any) => setForm((f:any) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={form.time} onChange={(e:any) => setForm((f:any) => ({ ...f, time: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Duration (minutes)</Label>
                  <Input type="number" value={String(form.duration)} onChange={(e:any) => setForm((f:any) => ({ ...f, duration: Number(e.target.value) }))} />
                </div>
                <div>
                  <Label>Capacity</Label>
                  <Input type="number" value={String(form.capacity)} onChange={(e:any) => setForm((f:any) => ({ ...f, capacity: Number(e.target.value) }))} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateSubmit}>Create Session</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSession ? selectedSession.title : 'Live Session'}</DialogTitle>
              <DialogDescription>{selectedSession ? `Hosted by ${selectedSession.host_name}` : 'Preview session'}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Subject</Label>
                  <div className="p-2 border rounded">{selectedSession ? (selectedSession.subjects?.name || selectedSession.subject_id) : 'N/A'}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={dialogDate} onChange={(e:any) => setDialogDate(e.target.value)} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={dialogTime} onChange={(e:any) => setDialogTime(e.target.value)} />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <div className="p-2 border rounded text-sm text-muted-foreground">{selectedSession ? (selectedSession.format || 'Discussion session') : 'Placeholder session for this subject.'}</div>
              </div>

              {joinLink && (
                <div className="mt-2 p-2 border rounded bg-muted/10">
                  <div className="text-sm">Meeting link:</div>
                  <a className="text-primary break-all" href={joinLink} target="_blank" rel="noreferrer">{joinLink}</a>
                </div>
              )}
            </div>

            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSessionDialog(false)}>Close</Button>
                <Button onClick={() => handleJoinWithLink(selectedSession)}>Join Session</Button>
                {joinLink && (
                  <Button onClick={() => window.open(joinLink, '_blank')}>Open Meet</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Schedule;
