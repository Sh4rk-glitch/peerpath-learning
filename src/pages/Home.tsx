import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import { Microscope, Calculator, BookText, Languages, Palette, Users, Target, Sparkles, ArrowRight, BookOpen } from "lucide-react";

const Home = () => {
  const subjects = [
    {
      title: "AP Biology",
      category: "science" as const,
      nextSession: "2:30 PM today",
      activeUsers: 234,
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
      title: "World History",
      category: "humanities" as const,
      nextSession: "Tomorrow 3:00 PM",
      activeUsers: 156,
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
      title: "Digital Art",
      category: "arts" as const,
      nextSession: "Tomorrow 1:00 PM",
      activeUsers: 124,
      icon: <Palette className="h-6 w-6" />,
    },
  ];

  const howItWorks = [
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "Join or Host",
      description: "Find study sessions that match your needs or create your own micro-tutorials",
    },
    {
      icon: <Target className="h-8 w-8 text-primary" />,
      title: "Learn Together",
      description: "Collaborate in real-time with notes, quizzes, and interactive whiteboards",
    },
    {
      icon: <Sparkles className="h-8 w-8 text-primary" />,
      title: "Track Progress",
      description: "Build your skill tree, earn badges, and export your learning portfolio",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center space-y-8 animate-in">
            <h1 className="text-balance">
              Learn with friends.
              <br />
              <span className="text-primary">Teach and share.</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
              PeerPath is where students collaborate, build skills through interactive pathways, 
              and grow together through peer mentoring.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gap-2">
                Find Study Sessions
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Create a Room
              </Button>
            </div>

            <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span><strong className="text-foreground">1,247</strong> active learners</span>
              </div>
              <div>
                <strong className="text-foreground">45</strong> sessions today
              </div>
              <div>
                <strong className="text-foreground">89%</strong> satisfaction rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-12">
            <h2 className="mb-4">Explore Subjects</h2>
            <p className="text-xl text-muted-foreground">
              Join live sessions and progress through interactive skill trees
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <SubjectCard key={subject.title} {...subject} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <h2 className="mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to supercharge your learning
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <Card key={index} className="p-8 text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {step.icon}
                </div>
                <h3 className="text-xl">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="p-12 text-center bg-gradient-card">
            <h2 className="mb-4">Ready to start learning?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of students mastering skills together
            </p>
            <Button size="lg">Get Started Free</Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-semibold">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>PeerPath</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Empowering students through collaborative learning
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Subjects</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Schedule</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Resources</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Accessibility</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 PeerPath. Built for FBLA Competition.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
