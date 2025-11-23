import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "@/components/Navigation";
import SessionCard from "@/components/SessionCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Calendar, Plus, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { sendReservationEmail } from '@/lib/email';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import ALL_SUBJECTS from '@/lib/subjectData';

const allSubjects = ALL_SUBJECTS;

const Schedule = () => {
  // types
  type SubjectItem = { id?: string; title?: string; name?: string; category?: string; color_accent?: string };
  type UISession = { id: string; title: string; host: string; hostRating?: number; time: string; duration: number; capacity: number; spotsLeft: number; subject: string; raw?: any; isHost?: boolean; isJoined?: boolean; hostId?: string };

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();
  const { toast: showToast } = useToast();

  const [sessions, setSessions] = useState<any[]>([]);
  const cachedProfiles = useRef<Record<string,string>>({});
  const [subjectsList, setSubjectsList] = useState<SubjectItem[]>(allSubjects as SubjectItem[]);
  // combine fetched subjects with local fallback list and dedupe by id/title
  const availableSubjects: SubjectItem[] = (() => {
    const map = new Map<string, SubjectItem>();
    const norm = (v: any) => (String(v || '').toLowerCase().trim());
    // prefer server subjectsList first
    (subjectsList || []).forEach(s => {
      const key = norm(s.id || s.title || s.name || s);
      if (!map.has(key)) map.set(key, s);
    });
    // add local fallbacks for missing ones
    (allSubjects || []).forEach(s => {
      const key = norm(s.id || s.title || s.name || s);
      if (!map.has(key)) map.set(key, s);
    });
    return Array.from(map.values());
  })();
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSessionDialog, setShowSessionDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<UISession | null>(null);
  const [openSessionRequest, setOpenSessionRequest] = useState<string | null>(null);
  const [dialogDate, setDialogDate] = useState('');
  const [dialogTime, setDialogTime] = useState('');
  const [joinLink, setJoinLink] = useState('');
  const [form, setForm] = useState({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);
  const [attendees, setAttendees] = useState<Array<{ id: string; display_name?: string; username?: string; email?: string }>>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hostDialogCloseTrigger, setHostDialogCloseTrigger] = useState(0);
  const [appKey, setAppKey] = useState(0);

  const cleanupStuckOverlays = () => {
    try {
      const root = document.getElementById('root');
      const els = Array.from(document.body.children) as HTMLElement[];
      els.forEach(el => {
        if (el === root) return;
        const style = window.getComputedStyle(el);
        const pos = style.position;
        if (pos !== 'fixed' && pos !== 'absolute') return;
        const z = parseInt(style.zIndex || '0', 10) || 0;
        const rect = el.getBoundingClientRect();
        const coversScreen = rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.5;
        if (coversScreen && z >= 100) {
          console.debug('Removing potential stuck overlay element:', el, { zIndex: z, rect });
          el.remove();
        }
      });

      // Also remove large portal dialogs
      const dialogs = Array.from(document.querySelectorAll('div[role="dialog"], [data-radix-portal], .radix-portal')) as HTMLElement[];
      dialogs.forEach(d => {
        const rect = d.getBoundingClientRect();
        const covers = rect.width >= window.innerWidth * 0.5 || rect.height >= window.innerHeight * 0.4;
        if (covers) {
          console.debug('Removing potential stuck dialog portal (body-level):', d, { rect });
          d.remove();
        }
      });

      // Also scan inside the app root for portal remnants or overlays
      if (root) {
        const innerEls = Array.from(root.querySelectorAll('[role="dialog"], [data-radix-portal], .radix-portal, .overlay, .portal')) as HTMLElement[];
        innerEls.forEach(d => {
          const rect = d.getBoundingClientRect();
          const covers = rect.width >= window.innerWidth * 0.5 || rect.height >= window.innerHeight * 0.4;
          if (covers) {
            console.debug('Removing potential stuck dialog portal (root-level):', d, { rect });
            d.remove();
          } else {
            // if not covering entire screen, hide it to restore interaction
            d.style.display = 'none';
          }
        });
      }

      document.body.style.pointerEvents = 'auto';
      if (root) root.style.pointerEvents = 'auto';
    } catch (e) {
      console.warn('cleanupStuckOverlays error', e);
    }
  };

  const isCreateValid = Boolean(form.subject_id && form.date && form.time);

  const fetchSessions = async () => {
    try {
      const { data } = await supabase.from('sessions').select('*');
      const rows = (data as any) || [];

      // attempt to resolve host display names by querying profiles if possible
      const hostIds = Array.from(new Set(rows.map((r: any) => r.host_id).filter(Boolean)));
      let profileMap: Record<string, string> = {};
      if (hostIds.length > 0) {
        try {
          // Work around PostgREST "in" encoding edgecases by using `.eq` for single id
          let profilesRes: any = null;
          // Only request columns we know are present in the user's DB.
          // `display_name` is present; `username` or other columns may not exist in some schemas.
          if (hostIds.length === 1) {
            profilesRes = await supabase.from('profiles').select('id,display_name').eq('id', String(hostIds[0]));
          } else {
            profilesRes = await supabase.from('profiles').select('id,display_name').in('id', hostIds as any);
          }
          const profiles = profilesRes?.data ?? profilesRes?.data;
          const pErr = profilesRes?.error;
          if (!pErr && profiles) {
            (profiles as any).forEach((p: any) => {
              // prefer a human-friendly display name, fall back to email local-part if available
              profileMap[p.id] = p.display_name || (p.email ? String(p.email).split('@')[0] : '') || '';
            });
          } else if (pErr) {
            console.warn('Could not fetch profiles for host names', pErr);
          }
        } catch (e) {
          console.warn('Could not fetch profiles for host names', e);
        }
      }

      let mapped = rows.map((s: any) => {
        const start = s.start_time ? new Date(s.start_time) : new Date();
        const hostLabel = (s.host_name ?? (s.host_id ? profileMap[s.host_id] : null) ?? s.host ?? 'Host');
        return {
          id: s.id,
          title: s.title || 'Session',
          host: hostLabel,
          hostId: s.host_id,
          hostRating: s.host_rating ?? 4.5,
          time: start.toLocaleString(),
          duration: s.duration_minutes ?? 30,
          capacity: s.capacity ?? 10,
          spotsLeft: (s.capacity ?? 10) - (s.participants_count ?? 0),
          subject: s.subjects?.name ?? s.subject_id ?? 'General',
          raw: s,
        } as any;
      });

      // mark joined sessions for current user if session_participants table exists
      if (user) {
        try {
          const { data: parts, error: pErr } = await supabase.from('session_participants').select('session_id').eq('user_id', user.id);
          if (!pErr && parts) {
            const joined = new Set((parts as any).map((p: any) => p.session_id));
            mapped = mapped.map((m: any) => ({ ...m, isJoined: joined.has(m.id) }));
          }
        } catch (e) {
          // table likely missing or permission denied; ignore and leave isJoined undefined
          console.warn('Could not fetch session_participants', e);
        }
      }

      // mark host flag
      mapped = mapped.map((m: any) => ({ ...m, isHost: Boolean(user && m.hostId && String(m.hostId) === String(user.id)) }));

      setSessions(mapped || []);
    } catch (e) {
      console.error('fetchSessions error', e);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error, status } = await supabase.from('subjects').select('*');
      if (error) {
        console.error('fetchSubjects supabase error', error);
        // If permission denied (403), notify user and keep local fallback
        if ((error as any)?.status === 403 || status === 403) {
          showToast({ title: 'Unable to load subjects', description: 'Permission denied reading subjects from Supabase. Using local fallback list.', variant: 'destructive' });
        } else {
          showToast({ title: 'Unable to load subjects', description: error.message || String(error), variant: 'destructive' });
        }
        return;
      }

      if (data && (data as any).length) setSubjectsList((data as any) as SubjectItem[]);
    } catch (e) {
      console.error('fetchSubjects error', e);
      showToast({ title: 'Unable to load subjects', description: 'An unexpected error occurred; using local fallback subjects.', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchSubjects();
    const q = new URLSearchParams(location.search);
    const openCreate = q.get('openCreate');
    const openSessionId = q.get('open');
    const subjectFromQuery = q.get('subject');
    if (openCreate === '1') setShowCreateDialog(true);
    if (subjectFromQuery) {
      setForm(f => ({ ...f, subject_id: subjectFromQuery }));
      // auto-apply subject filter when navigating from a lesson or subject link
      try { setSubjectFilter(subjectFromQuery); } catch (e) { /* ignore */ }
    }
    if (openSessionId) setOpenSessionRequest(openSessionId);
  }, [location.search]);

  // If a request to open a specific session was made via query param, wait for sessions to load then open it
  useEffect(() => {
    if (!openSessionRequest) return;
    if (!sessions || sessions.length === 0) return;
    const found = sessions.find(s => String(s.id) === String(openSessionRequest));
    if (found) {
      setSelectedSession(found as any);
      setShowSessionDialog(true);
      setOpenSessionRequest(null);
    }
  }, [openSessionRequest, sessions]);

  // when auth state changes (user logs in/out), refresh sessions so isHost/isJoined flags update
  useEffect(() => {
    fetchSessions();
  }, [user]);

  const filteredSessions = subjectFilter && subjectFilter !== 'all' ? sessions.filter((s: any) => {
    try {
      const subjVal = String(s.subject || s.subject_id || '').toLowerCase().trim();
      const filterVal = String(subjectFilter || '').toLowerCase().trim();
      return subjVal === filterVal || String(s.subject_id) === String(subjectFilter) || String(s.subject) === String(subjectFilter);
    } catch (e) {
      return false;
    }
  }) : sessions;

  const handleCreateDialogOpen = (prefillSubjectId?: string) => {
    if (prefillSubjectId) setForm(f => ({ ...f, subject_id: prefillSubjectId }));
    setShowCreateDialog(true);
  };

  const handleCreateSubmit = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    try {
      const selectedSubject = subjectsList.find((s: SubjectItem) => s.id === form.subject_id || s.title === form.subject_id);
      let subjectIdCandidate = selectedSubject?.id || (subjectsList.length > 0 ? subjectsList[0].id : null);
      let subjectName = selectedSubject?.name || selectedSubject?.title || (subjectsList.length > 0 ? subjectsList[0].name : null);

      // Ensure we have a UUID for subject_id. If the candidate isn't a UUID, try to find or create the subject in the DB.
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      let subjectId: string | null = null;
      let permissionDenied = false;
      if (subjectIdCandidate && uuidRegex.test(String(subjectIdCandidate))) {
        subjectId = String(subjectIdCandidate);
      } else {
        // try to find subject by title or name in DB
        try {
          const lookupName = subjectName || String(subjectIdCandidate || '').replace(/-/g, ' ');
          if (lookupName) {
            // Try case-insensitive lookup by name, then title
            let found: any = null;
            try {
              const { data: f1, error: findErr, status: findStatus } = await supabase.from('subjects').select('id,name,title').ilike('name', lookupName).maybeSingle();
              if (findErr) {
                console.error('Subject lookup error (name)', findErr);
                // treat any lookup error as a permission/availability issue and fallback
                permissionDenied = true;
                showToast({ title: 'Unable to lookup subjects', description: 'Could not lookup subjects from Supabase. Will create session locally.', variant: 'destructive' });
              }
              if (f1 && (f1 as any).id) found = f1;
            } catch (e) {
              console.error('Subject lookup exception (name)', e);
              permissionDenied = true;
              showToast({ title: 'Unable to lookup subjects', description: 'Could not lookup subjects from Supabase. Will create session locally.', variant: 'destructive' });
            }

            if (!found) {
              try {
                const { data: f2, error: findErr2, status: findStatus2 } = await supabase.from('subjects').select('id,name,title').ilike('title', lookupName).maybeSingle();
                if (findErr2) {
                  console.error('Subject lookup error (title)', findErr2);
                  permissionDenied = true;
                  showToast({ title: 'Unable to lookup subjects', description: 'Could not lookup subjects from Supabase. Will create session locally.', variant: 'destructive' });
                }
                if (f2 && (f2 as any).id) found = f2;
              } catch (e) {
                console.error('Subject lookup exception (title)', e);
              }
            }

            if (found && (found as any).id) {
              subjectId = (found as any).id;
              subjectName = (found as any).name || (found as any).title || subjectName;
            } else {
              // create subject row and use returned id; subjects table requires category and color_accent
              const { data: created, error: createErr, status: createStatus } = await supabase.from('subjects').insert({ name: lookupName, category: 'general', color_accent: '180 60% 45%' }).select().maybeSingle();
              if (createErr) {
                console.error('Subject create error', createErr);
                // treat any create error as permission/availability issue and fallback
                permissionDenied = true;
                showToast({ title: 'Unable to create subject', description: 'Could not create subject in Supabase. Will create session locally.', variant: 'destructive' });
              }
              if (!createErr && created && (created as any).id) {
                subjectId = (created as any).id;
                subjectName = (created as any).name || (created as any).title || subjectName;
                // add to local subjects list for future
                setSubjectsList((prev: any[]) => [ ...(prev || []), created ]);
              }
            }
          }
        } catch (e) {
          console.error('Subject lookup/create error', e);
        }
      }

      if (!subjectId) {
        if (permissionDenied) {
          // fallback: create a local-only session so the UI behaves as if a session was created
          const localId = `local-${Math.random().toString(36).slice(2, 9)}`;
          const startLocal = form.date && form.time ? new Date(`${form.date}T${form.time}`) : new Date(Date.now() + 60 * 60 * 1000);
          const localSession: UISession = {
            id: localId,
            title: form.title || `Local Session by ${user.user_metadata?.full_name || user.email}`,
            host: user.user_metadata?.full_name || user.email,
            hostRating: 4.5,
            time: startLocal.toLocaleString(),
            duration: form.duration,
            capacity: form.capacity,
            spotsLeft: form.capacity,
            subject: subjectName || 'General',
            raw: { local: true },
          };
          setSessions(prev => [localSession as any, ...(prev || [])]);
          // Do not auto-open the dialog. Generate a meeting link and notify the user.
          const slug = localId.slice(0, 8);
          const userPart = user.id ? String(user.id).slice(0, 6) : 'guest';
           const link = `https://meet.google.com/lookup/${slug}-${userPart}`; // removed automatic clipboard copy for privacy — user will see the link in the UI
          setJoinLink(link);
          setSelectedSession(localSession as any);
          setShowCreateDialog(false);
          setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
           // removed automatic clipboard copy for privacy — user will see the link in the UI
          showToast({ title: 'Created locally', description: 'Session created locally. Meeting link generated and saved.' });
          return;
        }

        showToast({ title: 'Invalid subject', description: 'Could not resolve subject to a valid id.', variant: 'destructive' });
        return;
      }

      let start = new Date(Date.now() + 60 * 60 * 1000);
      if (form.date && form.time) start = new Date(`${form.date}T${form.time}`);

      type SessionFormat = 'lecture' | 'discussion' | 'problem_solving' | 'review';

      const payload = {
        title: form.title || `Session by ${user.user_metadata?.full_name || user.email}`,
        subject_id: subjectId, // UUID from subjects table
        host_id: user.id,
        start_time: start.toISOString(),
        duration_minutes: form.duration,
        capacity: form.capacity,
        format: 'discussion' as SessionFormat,
        description: '',
        status: 'scheduled',
      };
      // If editing, attempt to update instead of insert
      if (editingSessionId) {
        try {
          const { data: updated, error: updateErr } = await supabase.from('sessions').update(payload as any).eq('id', editingSessionId).select();
          if (updateErr) {
            console.error('Supabase update error', updateErr);
            showToast({ title: 'Unable to update', description: 'Could not update session on server. Changes saved locally.', variant: 'destructive' });
            // update locally
            setSessions(prev => (prev || []).map(s => s.id === editingSessionId ? { ...s, title: payload.title, duration: payload.duration_minutes, capacity: payload.capacity } : s));
          } else {
            showToast({ title: 'Session updated', description: 'Session was updated.' });
          }
        } catch (e) {
          console.error('Update exception', e);
        }
        setEditingSessionId(null);
        setShowCreateDialog(false);
        setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
        fetchSessions();
        return;
      }
      console.log("Final subjectId in payload:", subjectId); // This should be the UUID
      console.log("Final payload for Supabase insert:", payload);

      const { data, error } = await supabase.from('sessions').insert(payload as any).select();
      if (error) {
        console.error("Supabase insert error:", JSON.stringify(error, null, 2)); // Log detailed error
        // treat any insert error as permission/availability issue and fallback to local-only session
        const localId = `local-${Math.random().toString(36).slice(2, 9)}`;
        const startLocal = form.date && form.time ? new Date(`${form.date}T${form.time}`) : new Date(Date.now() + 60 * 60 * 1000);
        const localSession: UISession = {
          id: localId,
          title: payload.title,
          host: user.user_metadata?.full_name || user.email,
          hostRating: 4.5,
          time: startLocal.toLocaleString(),
          duration: payload.duration_minutes,
          capacity: payload.capacity,
          spotsLeft: payload.capacity,
          subject: subjectName || 'General',
          raw: { local: true },
        };
        setSessions(prev => [localSession as any, ...(prev || [])]);
        // Do not auto-open the dialog. Generate a meeting link and notify the user.
        const slug = localId.slice(0, 8);
        const userPart = user.id ? String(user.id).slice(0, 6) : 'guest';
        const link = `https://meet.google.com/lookup/${slug}-${userPart}`;
        setJoinLink(link);
        setSelectedSession(localSession as any);
        setShowCreateDialog(false);
        setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
        try { navigator?.clipboard?.writeText(link); } catch (e) { /* ignore */ }
        showToast({ title: 'Created locally', description: 'Session created locally because Supabase prevented saving. Meeting link generated.' });
      }

      setShowCreateDialog(false);
      setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 });
      if (data && data[0]) {
        // map to UI session shape
        const s = data[0] as any;
        const start2 = s.start_time ? new Date(s.start_time) : new Date();
        const uiSession: UISession = {
          id: s.id,
          title: s.title,
          host: s.host_name ?? s.host_id ?? (user.user_metadata?.full_name ?? user.email),
          hostRating: s.host_rating ?? 4.5,
          time: start2.toLocaleString(),
          duration: s.duration_minutes ?? 30,
          capacity: s.capacity ?? 10,
          spotsLeft: s.capacity ?? 10,
          subject: subjectName || (s.subjects?.name ?? s.subject_id ?? 'General'),
          raw: s,
        };

        // Do not auto-open the dialog. Generate a meeting link and notify the user.
        const slug = String(s.id).slice(0, 8);
        const userPart = user.id ? String(user.id).slice(0, 6) : 'guest';
        const link = `https://meet.google.com/lookup/${slug}-${userPart}`;
        setJoinLink(link);
        setSelectedSession(uiSession as any);
        showToast({ title: 'Session created', description: `Session "${s.title}" created. Meeting link generated.` });
      } else {
        showToast({ title: 'Session created', description: 'Your session was created.' });
      }
      fetchSessions();
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleEditSession = async (sessionId: string) => {
    // Find session locally first
    const s = sessions.find(s => String(s.id) === String(sessionId));
    if (s) {
      // Try to parse start_time if present
      let date = '';
      let time = '';
      try {
        const st = s.raw?.start_time || s.raw?.start || s.time;
        if (st) {
          const d = new Date(st);
          if (!isNaN(d.getTime())) {
            date = d.toISOString().slice(0,10);
            time = d.toTimeString().slice(0,5);
          }
        }
      } catch (e) {}

      setForm({ title: s.title || '', subject_id: s.raw?.subject_id || s.subject || '', date, time, duration: s.duration || 30, capacity: s.capacity || 10 });
      setEditingSessionId(String(sessionId));
      setShowCreateDialog(true);
      return;
    }

    // fallback: fetch from server
    try {
      const { data, error } = await supabase.from('sessions').select('*').eq('id', sessionId).maybeSingle();
      if (!error && data) {
        const st = data.start_time;
        let date = '';
        let time = '';
        try {
          const d = new Date(st);
          if (!isNaN(d.getTime())) { date = d.toISOString().slice(0,10); time = d.toTimeString().slice(0,5); }
        } catch (e) {}
        setForm({ title: data.title || '', subject_id: data.subject_id || '', date, time, duration: data.duration_minutes || 30, capacity: data.capacity || 10 });
        setEditingSessionId(String(sessionId));
        setShowCreateDialog(true);
      }
    } catch (e) {
      console.error('handleEditSession fetch error', e);
    }
  };

  const handleViewAttendees = async (sessionId: string) => {
    try {
      // Try to fetch attendees via session_participants -> profiles
      const { data } = await supabase.from('session_participants').select('user_id').eq('session_id', sessionId);
      const uids = (data || []).map((r:any) => r.user_id).filter(Boolean);
      if (uids.length === 0) {
        setAttendees([]);
        setShowAttendeesDialog(true);
        return;
      }
      // Only request display_name/email to match common schemas
      const { data: profiles } = await supabase.from('profiles').select('id,display_name,email').in('id', uids as any);
      setAttendees((profiles as any) || []);
      setShowAttendeesDialog(true);
    } catch (e) {
      console.error('handleViewAttendees error', e);
      // fallback: try to get participants from session.raw if present
      const s = sessions.find(s => String(s.id) === String(sessionId));
      if (s && s.raw && Array.isArray(s.raw.participants)) {
        setAttendees(s.raw.participants);
        setShowAttendeesDialog(true);
      } else {
        setAttendees([]);
        setShowAttendeesDialog(true);
      }
    }
  };

  const handleToggleReservation = async (sessionId: string, isJoined?: boolean, sessionObj?: any) => {
    if (!user) { navigate('/auth'); return; }
    try {
      if (isJoined) {
        // remove reservation
        try {
          const { error } = await supabase.from('session_participants').delete().match({ session_id: sessionId, user_id: user.id });
          if (error) throw error;
          showToast({ title: 'Reservation cancelled', description: 'You removed your reservation.' });
          setSessions(prev => (prev || []).map(s => s.id === sessionId ? { ...s, isJoined: false, spotsLeft: Math.min((s.capacity ?? 10), (s.spotsLeft ?? (s.capacity ?? 10)) + 1) } : s));
        } catch (e: any) {
          // fallback when table missing / permission denied
          console.warn('Unable to delete participant row', e);
          setSessions(prev => (prev || []).map(s => s.id === sessionId ? { ...s, isJoined: false, spotsLeft: Math.min((s.capacity ?? 10), (s.spotsLeft ?? (s.capacity ?? 10)) + 1) } : s));
          showToast({ title: 'Reservation removed locally', description: 'Could not persist cancellation to server.' });
        }
      } else {
        // add reservation
        try {
          const { error } = await supabase.from('session_participants').insert({ session_id: sessionId, user_id: user.id });
          if (error) throw error;
          showToast({ title: 'Reserved', description: 'You joined the session. Confirmation email sent.' });
          setSessions(prev => (prev || []).map(s => s.id === sessionId ? { ...s, isJoined: true, spotsLeft: Math.max(0, (s.spotsLeft ?? (s.capacity ?? 10)) - 1) } : s));
        } catch (e: any) {
          console.warn('Unable to insert participant row', e);
          setSessions(prev => (prev || []).map(s => s.id === sessionId ? { ...s, isJoined: true, spotsLeft: Math.max(0, (s.spotsLeft ?? (s.capacity ?? 10)) - 1) } : s));
          showToast({ title: 'Reserved locally', description: 'Could not persist reservation to server.' });
        }

        // send confirmation email via mailto fallback (client-side)
        try {
          const sess = sessionObj || sessions.find((s:any) => s.id === sessionId);
          // attempt to send server email using Edge Function (SendGrid). Falls back to mailto if unavailable.
          const sent = await sendReservationEmail(sess, user.email || '');
          if (!sent) {
            // fallback to mailto UI so user can send themselves the confirmation
            const meetingLink = sess?.raw?.meet_link || `https://meet.google.com/lookup/${String(sessionId).slice(0, 8)}`;
            const when = sess?.raw?.start_time ? new Date(sess.raw.start_time).toLocaleString() : sess?.time || '';
            const host = sess?.host || '';
            const subj = encodeURIComponent(`You joined: ${sess?.title || 'Session'}`);
            const body = encodeURIComponent(`Hi ${user.user_metadata?.full_name || user.email},\n\nYou have joined the session "${sess?.title}" hosted by ${host}.\n\nWhen: ${when}\n\nMeeting link: ${meetingLink}\n\nSee you there!`);
            const mailto = `mailto:${encodeURIComponent(user.email || '')}?subject=${subj}&body=${body}`;
            window.open(mailto);
          } else {
            showToast({ title: 'Confirmation sent', description: 'A confirmation email was sent to your inbox.' });
          }
        } catch (e) {
          console.warn('Unable to send confirmation email', e);
        }
      }

      // refresh sessions list if possible
      fetchSessions();
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleJoinWithLink = async (session: any | null) => {
    if (!user) { navigate('/auth'); return; }
    try {
      if (session) {
        await handleToggleReservation(session.id, session.isJoined, session);
      }
      // ensure joinLink is present
      if (session) {
        const link = session.raw?.meet_link || `https://meet.google.com/lookup/${String(session.id).slice(0, 8)}`;
        setJoinLink(link);
      }
    } catch (err: any) {
      showToast({ title: 'Error', description: err?.message || String(err), variant: 'destructive' });
    }
  };

  const handleDeleteClick = (sessionId: string) => {
    setSessionToDelete(sessionId);
    setShowDeleteConfirm(true);
  };
  const handleDeleteSession = async () => {
    if (isDeleting) return;
    const sessionId = sessionToDelete;
    if (!sessionId) return;

    setIsDeleting(true);
    // keep the delete confirmation open while the delete is in progress
    // capture the session and close possible open dialogs/host controls
    const removed = (sessions || []).find((s:any) => String(s.id) === String(sessionId));
    // close any open session preview and attendees modal to avoid portal issues
    setSelectedSession(null);
    setShowSessionDialog(false);
    setShowAttendeesDialog(false);
    // signal SessionCard instances to close their host dialogs
    setHostDialogCloseTrigger(t => t + 1);

    try {
      if (String(sessionId).startsWith('local-')) {
        // remove local sessions immediately
        setSessions(prev => (prev || []).filter(s => String(s.id) !== String(sessionId)));
        showToast({ title: 'Session removed', description: 'Local session removed.' });
        return;
      }

      const { data: delData, error } = await supabase.from('sessions').delete().eq('id', sessionId).select();
      if (error) {
        console.error('delete session error', error);
        // do not remove session (it remains visible); inform user with details
        showToast({ title: 'Delete failed', description: error.message || 'Could not delete session on server.', variant: 'destructive' });
        try {
          const debug = { error, delData };
          console.debug('Supabase delete error detail:', debug);
          // debug info (no clipboard copy to respect privacy)
          console.debug('Delete failed response:', debug);
        } catch (e) {
          // ignore
        }
        // log full error to console for debugging
        console.debug('Supabase delete error detail:', error);
      } else {
        // remove from UI after server confirms deletion
        setSessions(prev => (prev || []).filter(s => String(s.id) !== String(sessionId)));
        showToast({ title: 'Success', description: 'Session permanently deleted.' });
        try {
          const debug = { delData };
          console.debug('Supabase delete success detail:', debug);
          console.debug('Delete success response:', debug);
        } catch (e) {}
        // reflect server state by re-fetching as well
        await fetchSessions();
      }
    } catch (e) {
      console.error('handleDeleteSession error', e);
      // on unexpected error, keep the session visible and notify
      showToast({ title: 'Delete failed', description: (e as any)?.message || 'An error occurred while deleting.', variant: 'destructive' });
    } finally {
      // close the confirmation dialog now that the operation finished
      setShowDeleteConfirm(false);
      setSessionToDelete(null);
      setIsDeleting(false);
      // force a lightweight remount of this page to ensure any Radix portals/overlays are removed
      // (works around stuck overlays left by nested dialogs)
      try { setAppKey(k => k + 1); } catch (e) { /* ignore */ }
      // also attempt a defensive DOM cleanup of any stuck overlays
      try { cleanupStuckOverlays(); } catch (e) { /* ignore */ }
    }
  };

  return (
    <div key={appKey} className="min-h-screen bg-background">
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

        <div className="flex justify-center mb-6 gap-2">
          <Select value={subjectFilter} onValueChange={v => setSubjectFilter(v)}>
            <SelectTrigger className="w-64">
              <SelectValue>{subjectFilter && subjectFilter !== 'all' ? (availableSubjects.find((s:any) => s.id === subjectFilter)?.name || subjectFilter) : 'All Subjects'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {
                // avoid duplicate display names in the dropdown (normalize by lowercased name)
                (() => {
                  const seen = new Set();
                  const items: any[] = [];
                  for (let i = 0; i < availableSubjects.length; i++) {
                    const s: any = availableSubjects[i];
                    const display = (s.name || s.title || '').toString().toLowerCase().trim();
                    if (!display || seen.has(display)) continue;
                    seen.add(display);
                    items.push(
                      <SelectItem key={s.id || i} value={s.id || s.title}>{s.name || s.title}</SelectItem>
                    );
                  }
                  return items;
                })()
              }
            </SelectContent>
          </Select>
          {subjectFilter && subjectFilter !== 'all' && (
            <Button onClick={() => handleCreateDialogOpen(subjectFilter)}>Create Session for {subjectsList.find((s:any) => s.id === subjectFilter)?.name || subjectFilter}</Button>
          )}
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
                  <SessionCard
                    key={session.id}
                    sessionId={session.id}
                    onJoin={() => handleToggleReservation(session.id, session.isJoined, session)}
                    onDelete={() => handleDeleteClick(session.id)}
                    onEdit={() => handleEditSession(session.id)}
                    onViewAttendees={() => handleViewAttendees(session.id)}
                    onDetails={() => { setSelectedSession(session); setShowSessionDialog(true); }}
                    isHost={session.isHost}
                    isJoined={session.isJoined}
                    closeHostDialogTrigger={hostDialogCloseTrigger}
                    {...session}
                  />
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

        <Dialog open={showCreateDialog} onOpenChange={(open) => { setShowCreateDialog(open); if (!open) { setEditingSessionId(null); setForm({ title: '', subject_id: '', date: '', time: '', duration: 30, capacity: 10 }); } }}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingSessionId ? 'Edit Session' : 'Create Session'}</DialogTitle>
                <DialogDescription>{editingSessionId ? 'Modify session details and save changes.' : 'Provide session details and schedule it.'}</DialogDescription>
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
                    <SelectValue>{availableSubjects.find((s:any) => s.id === form.subject_id)?.name || availableSubjects.find((s:any) => s.title === form.subject_id)?.title || 'Select a subject'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s: any, i: number) => (
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

            <DialogFooter className="mt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                <Button onClick={handleCreateSubmit} disabled={!isCreateValid}>
                  {editingSessionId ? 'Update Session' : 'Create Session'}
                </Button>
              </div>
              {!isCreateValid && (
                <div className="text-xs text-muted-foreground mt-2">Please select a subject, date, and time.</div>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showSessionDialog} onOpenChange={setShowSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSession ? selectedSession.title : 'Live Session'}</DialogTitle>
              <DialogDescription>{selectedSession ? `Hosted by ${selectedSession.host}` : 'Preview session'}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-3 w-full">
              {selectedSession ? (
                <div>
                  {/* Render a preview card and details */}
                  <div className="mb-4">
                    <SessionCard
                      title={selectedSession.title}
                      host={selectedSession.host}
                      hostRating={selectedSession.hostRating ?? 4.5}
                      time={selectedSession.time}
                      duration={selectedSession.duration}
                      capacity={selectedSession.capacity}
                      spotsLeft={selectedSession.spotsLeft}
                      subject={selectedSession.subject}
                      sessionId={selectedSession.id}
                      onJoin={() => handleToggleReservation(selectedSession.id, selectedSession.isJoined, selectedSession)}
                      onDelete={() => handleDeleteClick(selectedSession.id)}
                      onEdit={() => handleEditSession(selectedSession.id)}
                      onViewAttendees={() => handleViewAttendees(selectedSession.id)}
                      isHost={selectedSession.isHost}
                      isJoined={selectedSession.isJoined}
                        closeHostDialogTrigger={hostDialogCloseTrigger}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Subject</Label>
                      <div className="p-2 border rounded">{selectedSession.subject}</div>
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
                    <div className="p-2 border rounded text-sm text-muted-foreground">{selectedSession.raw?.description || 'Discussion session'}</div>
                  </div>

                  {joinLink && (
                    <div className="mt-2 p-2 border rounded bg-muted/10">
                      <div className="text-sm">Meeting link:</div>
                      <a className="text-primary break-all" href={joinLink} target="_blank" rel="noreferrer">{joinLink}</a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-sm text-muted-foreground">No session selected</div>
              )}
            </div>

            <DialogFooter>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSessionDialog(false)}>Close</Button>
                <Button onClick={() => handleJoinWithLink(selectedSession)}>Join Session</Button>
                {joinLink && (
                  <Button onClick={() => { window.location.href = joinLink; }}>Open Meet</Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showAttendeesDialog} onOpenChange={setShowAttendeesDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendees</DialogTitle>
              <DialogDescription>Participants who reserved this session</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-2">
              {attendees && attendees.length > 0 ? (
                attendees.map(a => (
                  <div key={a.id} className="flex items-center gap-3 p-3 border rounded hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{(a.display_name || a.username || 'U').charAt(0).toUpperCase()}</div>
                    <div className="flex-1">
                      <div className="font-medium">{a.display_name || a.username || 'User'}</div>
                      {a.username && <div className="text-xs text-muted-foreground">@{a.username}</div>}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">No attendees yet. Be the first to join!</div>
              )}
            </div>
            <DialogFooter>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setShowAttendeesDialog(false)}>Close</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this session? This action cannot be undone and all participants will lose access.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <Button 
                onClick={() => handleDeleteSession()}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <span className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-destructive-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                    Deleting...
                  </span>
                ) : 'Delete'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Schedule;
