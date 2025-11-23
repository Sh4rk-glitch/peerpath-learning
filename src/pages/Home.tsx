import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import SubjectCard from "@/components/SubjectCard";
import Reveal from "@/components/Reveal";
import HeroClip from "@/components/HeroClip";
import { useRef } from "react";
import useParallaxEffect from "@/hooks/useParallaxEffect";
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
    {
      title: "Statistics",
      category: "math" as const,
      nextSession: "Today 6:00 PM",
      activeUsers: 142,
      icon: <Target className="h-6 w-6" />,
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

  const subjectsAnchorRef = useRef<HTMLElement | null>(null);
  const subjectsBgRef = useRef<HTMLDivElement | null>(null);
  useParallaxEffect(subjectsAnchorRef, subjectsBgRef, 0.12);

  return (
    <div className="min-h-screen bg-background">
      <Reveal anim="fade">
        <Navigation />
      </Reveal>
      
      {/* Hero Section */}
      <HeroClip />

      <section className="relative overflow-hidden bg-gradient-hero py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <Reveal anim="up">
              <h1 className="text-balance">
                Learn with friends.
                <br />
                <span className="text-primary">Teach and share.</span>
              </h1>
            </Reveal>

            <Reveal anim="fade">
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                PeerPath is where students collaborate, build skills through interactive pathways, 
                and grow together through peer mentoring.
              </p>
            </Reveal>

            <div className="flex flex-wrap gap-4 justify-center">
              <Reveal anim="up">
                <Link to="/schedule">
                  <Button size="lg" className="gap-2">
                    Find Study Sessions
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </Reveal>
              <Reveal anim="up">
                <Link to="/schedule">
                  <Button size="lg" variant="outline">
                    Create a Room
                  </Button>
                </Link>
              </Reveal>
            </div>

            <Reveal anim="fade">
              <div className="flex flex-wrap gap-6 justify-center text-sm text-muted-foreground pt-4 reveal-stagger">
                <div style={{ ["--reveal-index" as any]: 0 }}>
                  <Reveal anim="up">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span><strong className="text-foreground">1,247</strong> active learners</span>
                    </div>
                  </Reveal>
                </div>
                <div style={{ ["--reveal-index" as any]: 1 }}>
                  <Reveal anim="up">
                    <div>
                      <strong className="text-foreground">45</strong> sessions today
                    </div>
                  </Reveal>
                </div>
                <div style={{ ["--reveal-index" as any]: 2 }}>
                  <Reveal anim="up">
                    <div>
                      <strong className="text-foreground">89%</strong> satisfaction rate
                    </div>
                  </Reveal>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      {/* Explore Subjects with parallax background */}
      <section className="py-16 md:py-24 relative" ref={subjectsAnchorRef}>
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div id="subjects-bg" ref={subjectsBgRef} className="h-full w-full bg-gradient-to-b from-primary/6 via-transparent to-transparent opacity-80 will-change-transform" />
        </div>

        <div className="container">
          <div className="mb-12">
            <h2 className="mb-4">Explore Subjects</h2>
            <p className="text-xl text-muted-foreground">
              Join live sessions and progress through interactive skill trees
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 reveal-stagger">
            {subjects.map((subject, i) => (
              <div key={subject.title} style={{ ["--reveal-index" as any]: i }}>
                <Reveal anim="up">
                  <SubjectCard {...subject} />
                </Reveal>
              </div>
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

          <div className="grid gap-8 md:grid-cols-3 reveal-stagger">
            {howItWorks.map((step, index) => (
              <div key={index} style={{ ["--reveal-index" as any]: index }}>
                <Reveal anim="up">
                  <Card className="p-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      {step.icon}
                    </div>
                    <h3 className="text-xl">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </Card>
                </Reveal>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Reveal anim="up">
            <Card className="p-12 text-center bg-gradient-card">
              <h2 className="mb-4">Ready to start learning?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of students mastering skills together
              </p>
              <Link to="/auth">
                <Button size="lg">Get Started Free</Button>
              </Link>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-4 reveal-stagger">
            <div style={{ ["--reveal-index" as any]: 0 }}>
              <Reveal anim="up">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 font-semibold">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>PeerPath</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Empowering students through collaborative learning
                  </p>
                </div>
              </Reveal>
            </div>

            <div style={{ ["--reveal-index" as any]: 1 }}>
              <Reveal anim="up">
                <div>
                  <h4 className="font-semibold mb-3">Platform</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/subjects" className="hover:text-foreground transition-colors">Subjects</Link></li>
                    <li><Link to="/schedule" className="hover:text-foreground transition-colors">Schedule</Link></li>
                    <li><Link to="/resources" className="hover:text-foreground transition-colors">Resources</Link></li>
                  </ul>
                </div>
              </Reveal>
            </div>

            <div style={{ ["--reveal-index" as any]: 2 }}>
              <Reveal anim="up">
                <div>
                  <h4 className="font-semibold mb-3">Support</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                    <li><Link to="/community" className="hover:text-foreground transition-colors">Community</Link></li>
                    <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                  </ul>
                </div>
              </Reveal>
            </div>

            <div style={{ ["--reveal-index" as any]: 3 }}>
              <Reveal anim="up">
                <div>
                  <h4 className="font-semibold mb-3">Legal</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
                    <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link></li>
                    <li><Link to="/accessibility" className="hover:text-foreground transition-colors">Accessibility</Link></li>
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>© 2025 PeerPath. Built for FBLA Competition.</p>
            <p className="mt-2">Site built by: Shourya Mishra, Ali Taqir, and Maykel Silalihi</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
