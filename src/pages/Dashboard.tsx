import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import ProgressCard from "@/components/ProgressCard";
import { Flame, Target, Award, Calendar, TrendingUp, Clock } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { setLoadingProfile(false); return; }
      try {
        const { data, error } = await supabase.from("profiles").select("display_name").eq("id", user.id).single();
        if (!error && data) setDisplayName(data.display_name);
      } catch (e) {
        // ignore
      }
      setLoadingProfile(false);
    };

    fetchProfile();
  }, [user]);
  const progressData = [
    {
      subject: "AP Biology",
      mastery: 78,
      skillsCompleted: 23,
      totalSkills: 30,
      recentGain: 12,
      category: "science" as const,
    },
    {
      subject: "Calculus",
      mastery: 65,
      skillsCompleted: 18,
      totalSkills: 28,
      recentGain: 8,
      category: "math" as const,
    },
    {
      subject: "Spanish",
      mastery: 82,
      skillsCompleted: 31,
      totalSkills: 35,
      recentGain: 15,
      category: "language" as const,
    },
  ];

  const upcomingSessions = [
    { title: "Cellular Respiration Review", time: "Today 2:30 PM", subject: "AP Biology" },
    { title: "Integral Calculus Practice", time: "Tomorrow 4:00 PM", subject: "Calculus" },
  ];

  const recentActivity = [
    { type: "quiz", title: "DNA Replication Quiz", score: 92, time: "2 hours ago" },
    { type: "session", title: "Spanish Conversation", duration: 45, time: "Yesterday" },
    { type: "lesson", title: "Limits and Continuity", progress: 100, time: "2 days ago" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">{
            loadingProfile ? 'Welcome back' : `Welcome back, ${displayName ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Student'}!`
          }</h1>
          <p className="text-xl text-muted-foreground">
            Track your progress and continue learning
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Streak</span>
            </div>
            <p className="text-3xl font-bold">14 days</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Avg Mastery</span>
            </div>
            <p className="text-3xl font-bold">75%</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Award className="h-5 w-5 text-success" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Badges</span>
            </div>
            <p className="text-3xl font-bold">23</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-info/10">
                <Clock className="h-5 w-5 text-info" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Study Time</span>
            </div>
            <p className="text-3xl font-bold">42h</p>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Active Skills */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2>Active Skills</h2>
                <Button variant="ghost" size="sm">View All</Button>
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
                      {"score" in activity && (
                        <Badge variant={activity.score >= 80 ? "default" : "secondary"}>
                          {activity.score}%
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
                {upcomingSessions.map((session, index) => (
                  <div key={index} className="p-3 rounded-lg bg-muted space-y-1">
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.time}</p>
                    <Badge variant="outline" className="text-xs">{session.subject}</Badge>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
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

            {/* Export Portfolio */}
            <Card className="p-6 bg-gradient-card">
              <Award className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-2">Export Portfolio</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Download your achievements and progress for college applications
              </p>
              <Button variant="outline" className="w-full">Download PDF</Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
