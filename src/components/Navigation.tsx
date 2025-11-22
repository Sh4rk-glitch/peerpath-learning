import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, BookOpen, Calendar, LayoutDashboard, Library, User, LogOut, Moon, Sun } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import useTheme from "@/hooks/useTheme";
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const performSearch = async (q: string) => {
    if (!q || q.trim().length === 0) return;
    const term = q.trim();
    try {
      // Try to find a subject by name via Supabase first
      const { data, error } = await supabase.from('subjects').select('id,name,title').ilike('name', `%${term}%`).limit(1).maybeSingle();
      if (!error && data && (data as any).name) {
        const title = (data as any).name || (data as any).title || term;
        const slug = encodeURIComponent(String(title).replace(/\s+/g, '-').toLowerCase());
        navigate(`/subjects/${slug}`);
        return;
      }
    } catch (e) {
      // ignore supabase lookup errors and fallback to subjects search page
    }

    // fallback: navigate to subjects page with a search param
    navigate(`/subjects?search=${encodeURIComponent(term)}`);
  };

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
              value={query}
              onChange={(e:any) => setQuery(e.target.value)}
              onKeyDown={(e:any) => { if (e.key === 'Enter') { performSearch(query); } }}
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

