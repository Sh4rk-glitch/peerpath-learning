import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Calendar, LayoutDashboard, Library, User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-6">
        <Link to="/home" className="flex items-center gap-2 font-semibold text-xl">
          <BookOpen className="h-6 w-6 text-primary" />
          <span>PeerPath</span>
        </Link>

        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search subjects, lessons, tutors..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e: any) => {
              try {
                // store last click position for theme wave origin
                (window as any).__lastThemeToggleX = e.clientX;
                (window as any).__lastThemeToggleY = e.clientY;
              } catch (err) {}
              toggle();
            }}
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          {user ? (
            <>
              <Link to="/subjects">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Library className="h-4 w-4" />
                  Subjects
                </Button>
              </Link>
              <Link to="/schedule">
                <Button variant="ghost" size="sm" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Schedule
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="ml-auto">
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
