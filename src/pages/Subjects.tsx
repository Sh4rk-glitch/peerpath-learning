import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import { Microscope, Calculator, BookText, Languages, Palette, Music, Dumbbell, Code } from "lucide-react";

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
      icon: <Microscope className="h-6 w-6" />,
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
      category: "science" as const,
      nextSession: "Tomorrow 10:00 AM",
      activeUsers: 267,
      icon: <Code className="h-6 w-6" />,
    },
    {
      title: "Physical Education",
      category: "arts" as const,
      nextSession: "Tomorrow 9:00 AM",
      activeUsers: 156,
      icon: <Dumbbell className="h-6 w-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="mb-2">All Subjects</h1>
          <p className="text-xl text-muted-foreground">
            Explore subjects and start building your skill tree
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allSubjects.map((subject) => (
            <SubjectCard key={subject.title} {...subject} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subjects;
