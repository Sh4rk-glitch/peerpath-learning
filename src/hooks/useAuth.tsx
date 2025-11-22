import { useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const emailNoticeShown = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        try {
          const u = session?.user;
          const confirmed = Boolean(u?.email_confirmed_at || (u as any)?.email_confirmed || (u as any)?.confirmed_at);
          if (u && !confirmed && !emailNoticeShown.current) {
            emailNoticeShown.current = true;
            toast({ title: 'Email not confirmed', description: 'Please check your email for a confirmation link.' });
          }
        } catch (_) {}
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      // show email confirmation notice once if needed
      try {
        const u = session?.user;
        const confirmed = Boolean(u?.email_confirmed_at || (u as any)?.email_confirmed || (u as any)?.confirmed_at);
        if (u && !confirmed && !emailNoticeShown.current) {
          emailNoticeShown.current = true;
          toast({ title: 'Email not confirmed', description: 'Please check your email for a confirmation link.' });
        }
      } catch (_) {}
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load profile/display name once when user becomes available
  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      setProfileLoading(true);
      if (!user) { if (mounted) setProfileLoading(false); return; }
      try {
        const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
        if (!error && data && mounted) {
          setDisplayName(data.display_name ?? null);
        } else {
          // If profiles table is missing or access denied, fall back to user metadata
          if (user?.user_metadata?.full_name && mounted) {
            setDisplayName(user.user_metadata.full_name);
          }
        }
      } catch (e) {
        // fallback to metadata if profiles table is missing or request fails
        if (user?.user_metadata?.full_name && mounted) {
          setDisplayName(user.user_metadata.full_name);
        }
      }
      if (mounted) setProfileLoading(false);
    };

    fetchProfile();
    return () => { mounted = false; };
  }, [user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return { user, session, loading, signOut, displayName, profileLoading };
};
