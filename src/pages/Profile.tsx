import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setDisplayName(data.display_name || "");
      // prefer explicit username stored in profiles or in auth metadata
      setUsername(data.username ?? user?.user_metadata?.username ?? "");
      setBio(data.bio || "");
    } catch (error: any) {
      // If profiles table is missing or access denied, fall back to auth metadata
      console.error('fetchProfile error', error);
      // Do not surface a destructive toast when the profiles table is unavailable.
      // Use console warning and fall back to auth metadata so the page still renders.
      console.warn('Profiles table unavailable or permission denied; using fallback profile.');
      const fallback = {
        id: user?.id,
        display_name: user?.user_metadata?.full_name ?? user?.email ?? 'Student',
        username: user?.user_metadata?.username ?? (user?.email?.split('@')[0] ?? ''),
        created_at: new Date().toISOString(),
        reputation: 0,
        avatar_url: user?.user_metadata?.avatar_url ?? null,
        bio: '',
      };
      setProfile(fallback as any);
      setDisplayName(fallback.display_name || "");
      setUsername((fallback as any).username || "");
      setBio(fallback.bio || "");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: any = { display_name: displayName, bio };
      if (username) payload.username = username;

      let { error } = await supabase.from("profiles").update(payload).eq("id", user!.id);

      // If the profiles table doesn't have a `username` column, retry without it and notify the developer
      if (error) {
        const msg = String(error.message || error.details || '');
        if (msg.toLowerCase().includes('column "username"') || msg.toLowerCase().includes('column username')) {
          const { error: err2 } = await supabase.from("profiles").update({ display_name: displayName, bio }).eq("id", user!.id);
          if (err2) throw err2;
          toast({ title: 'Profile updated', description: 'Username not persisted: database schema missing `username` column. See migration below to add it.',
            // keep it informational
          });
          // still attempt to update auth metadata below
        } else {
          throw error;
        }
      }

      // Also update auth user metadata so UI that reads `user.user_metadata.username` reflects changes
      try {
        // Supabase auth.updateUser accepts `data` which merges into user_metadata
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { data: authData, error: authErr } = await supabase.auth.updateUser({ data: { username: username || null } });
        if (authErr) console.warn('auth updateUser error', authErr);
      } catch (e) {
        console.warn('auth.updateUser exception', e);
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-8">
        {user && !(user.email_confirmed_at || (user as any).email_confirmed || (user as any).confirmed_at) && (
          <div className="mb-4 p-3 rounded bg-yellow-50 border border-yellow-200 text-sm">
            <strong>Email not confirmed:</strong> Please check your email for a confirmation message and follow the link to verify your address.
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl">{userInitials}</AvatarFallback>
              </Avatar>
              <CardTitle>{displayName || "Student"}</CardTitle>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="h-4 w-4 text-warning fill-warning" />
                <span className="font-semibold">{profile.reputation || 0}</span>
                <span>reputation</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Member since</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Timezone</span>
                  <span className="font-medium">{
                    (() => {
                      try {
                        const date = new Date();
                        // Get the short timezone name (e.g., EST, CST)
                        const tz = Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date).find(part => part.type === 'timeZoneName');
                        return tz ? tz.value : Intl.DateTimeFormat().resolvedOptions().timeZone;
                      } catch {
                        return Intl.DateTimeFormat().resolvedOptions().timeZone;
                      }
                    })()
                  }</span>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <h4 className="font-semibold text-sm">Quick Stats</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted">
                    <p className="text-xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="edit" className="space-y-6">
              <TabsList>
                <TabsTrigger value="edit">Edit Profile</TabsTrigger>
                <TabsTrigger value="badges">Badges</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="edit">
                <Card>
                  <CardHeader>
                    <CardTitle>Edit Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                      />
                      <p className="text-xs text-muted-foreground">Your unique username shown across the app.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display-name">Display Name</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email} disabled />
                      <p className="text-xs text-muted-foreground">
                        Email cannot be changed
                      </p>
                    </div>

                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="badges">
                <Card className="p-12 text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
                  <p className="text-muted-foreground">
                    Complete challenges and sessions to earn badges
                  </p>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="p-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                  <p className="text-muted-foreground">
                    Your learning activity will appear here
                  </p>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
