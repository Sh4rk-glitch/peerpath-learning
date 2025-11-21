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

interface Session {
  id: string;
  title: string;
  host_id: string;
  start_time: string;
  duration_minutes: number;
  capacity: number;
  status: string;
  format: string;
  host_name: string;
  subjects: {
    name: string;
    category: string;
  };
  session_participants: Array<{ id: string }>;
}

const Schedule = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select(`
          *,
          subjects (name, category),
          session_participants (id)
        `)
        .eq("status", "scheduled")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Fetch host names separately
      const sessionsWithHosts = await Promise.all(
        (data || []).map(async (session: any) => {
          const { data: hostData } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", session.host_id)
            .single();

          return {
            ...session,
            host_name: hostData?.display_name || "Unknown",
          };
        })
      );

      setSessions(sessionsWithHosts as any);
    } catch (error: any) {
      toast({
        title: "Error loading sessions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingSessions(false);
    }
  };

  const formatSessionData = (session: Session) => {
    const startDate = new Date(session.start_time);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let timeStr = "";
    if (startDate.toDateString() === today.toDateString()) {
      timeStr = `Today ${startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else if (startDate.toDateString() === tomorrow.toDateString()) {
      timeStr = `Tomorrow ${startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      timeStr = startDate.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    return {
      title: session.title,
      host: session.host_name,
      hostRating: 4.8,
      subject: session.subjects.name,
      time: timeStr,
      duration: session.duration_minutes,
      participants: session.session_participants.length,
      capacity: session.capacity,
      spotsLeft: session.capacity - session.session_participants.length,
      format: session.format,
      category: session.subjects.category as "science" | "math" | "humanities" | "language" | "arts",
    };
  };

  if (loading || loadingSessions) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading sessions...</p>
          </div>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="mb-2">Schedule</h1>
            <p className="text-xl text-muted-foreground">
              Browse and join upcoming study sessions
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Session
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="my-sessions">My Sessions</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            {upcomingSessions.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {upcomingSessions.map((session) => (
                  <SessionCard key={session.id} {...formatSessionData(session)} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to create a study session
                </p>
                <Button className="gap-2">
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
              <p className="text-muted-foreground">
                Sessions you've created or joined will appear here
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Past sessions</h3>
              <p className="text-muted-foreground">
                Previously attended sessions will appear here
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Schedule;
