import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Navigation from "@/components/Navigation";
import { Award, Bell, Lock, User, Mail, Globe } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8 max-w-4xl">
        <h1 className="mb-8">Profile & Settings</h1>

        <div className="grid gap-8">
          {/* Profile Info */}
          <Card className="p-8">
            <div className="flex items-start gap-6 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">AC</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="mb-1">Alex Cooper</h2>
                <p className="text-muted-foreground mb-3">Student • Joined March 2024</p>
                <div className="flex gap-2">
                  <Badge>🔥 14 Day Streak</Badge>
                  <Badge variant="outline">⭐ Top Contributor</Badge>
                </div>
              </div>
              
              <Button variant="outline">Edit Profile</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue="Alex Cooper" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue="alex@example.com" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input id="bio" defaultValue="Passionate about biology and math" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input id="timezone" defaultValue="EST (UTC-5)" />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline">Cancel</Button>
              <Button>Save Changes</Button>
            </div>
          </Card>

          {/* Settings Sections */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified 15 minutes before sessions</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">Notifications for chat messages</p>
                </div>
                <input type="checkbox" className="toggle" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Progress Report</p>
                  <p className="text-sm text-muted-foreground">Summary of your learning activity</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Accessibility
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reduce Motion</p>
                  <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Increase text and UI contrast</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Larger Text</p>
                  <p className="text-sm text-muted-foreground">Increase default font size</p>
                </div>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Privacy & Security
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Profile Visibility</p>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="cursor-pointer">Public</Badge>
                  <Badge variant="outline" className="cursor-pointer">Friends Only</Badge>
                  <Badge variant="outline" className="cursor-pointer">Private</Badge>
                </div>
              </div>
              
              <Button variant="outline" className="w-full">Change Password</Button>
              <Button variant="outline" className="w-full">Download My Data</Button>
            </div>
          </Card>

          {/* Achievements */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              Badges & Achievements
            </h3>
            
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { emoji: "🎯", label: "First Session" },
                { emoji: "🔥", label: "7 Day Streak" },
                { emoji: "⭐", label: "Perfect Quiz" },
                { emoji: "🎓", label: "Completed 10 Skills" },
                { emoji: "👥", label: "Host 5 Sessions" },
                { emoji: "💬", label: "Active Contributor" },
              ].map((badge) => (
                <div key={badge.label} className="text-center p-4 rounded-lg border hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-4xl mb-2">{badge.emoji}</div>
                  <p className="text-xs font-medium">{badge.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
