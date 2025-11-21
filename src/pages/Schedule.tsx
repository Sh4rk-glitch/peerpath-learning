import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import SessionCard from "@/components/SessionCard";
import { Calendar, Filter, Plus } from "lucide-react";

const Schedule = () => {
  const [view, setView] = useState<"list" | "calendar">("list");

  const sessions = [
    {
      title: "Cellular Respiration Deep Dive",
      host: "Sarah Chen",
      hostRating: 4.8,
      time: "Today 2:30 PM",
      duration: 45,
      capacity: 20,
      spotsLeft: 5,
      subject: "AP Biology",
    },
    {
      title: "Calculus Problem Solving",
      host: "Mike Johnson",
      hostRating: 4.9,
      time: "Today 4:00 PM",
      duration: 60,
      capacity: 15,
      spotsLeft: 8,
      subject: "Calculus",
    },
    {
      title: "Spanish Conversation Practice",
      host: "Elena Rodriguez",
      hostRating: 4.7,
      time: "Today 5:15 PM",
      duration: 30,
      capacity: 12,
      spotsLeft: 3,
      subject: "Spanish",
    },
    {
      title: "World War II Discussion",
      host: "David Kim",
      hostRating: 4.9,
      time: "Tomorrow 3:00 PM",
      duration: 50,
      capacity: 25,
      spotsLeft: 15,
      subject: "History",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2">Live Sessions</h1>
          <p className="text-xl text-muted-foreground">
            Browse and book study sessions with peers
          </p>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex-1 min-w-[300px]">
            <Input placeholder="Search sessions..." />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            
            <div className="flex rounded-lg border border-border overflow-hidden">
              <Button
                variant={view === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("list")}
                className="rounded-none"
              >
                List
              </Button>
              <Button
                variant={view === "calendar" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setView("calendar")}
                className="rounded-none"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
            
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>
        </div>

        {/* Filter Tags */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <Badge variant="secondary" className="cursor-pointer">All</Badge>
          <Badge variant="outline" className="cursor-pointer">Science</Badge>
          <Badge variant="outline" className="cursor-pointer">Math</Badge>
          <Badge variant="outline" className="cursor-pointer">Humanities</Badge>
          <Badge variant="outline" className="cursor-pointer">Language</Badge>
          <Badge variant="outline" className="cursor-pointer">Today</Badge>
          <Badge variant="outline" className="cursor-pointer">This Week</Badge>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <SessionCard key={index} {...session} />
          ))}
        </div>

        {/* Empty State for Calendar View */}
        {view === "calendar" && (
          <div className="mt-8 p-12 border-2 border-dashed rounded-lg text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Calendar View</h3>
            <p className="text-muted-foreground">
              Calendar integration coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
