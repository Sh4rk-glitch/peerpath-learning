import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SubjectCardProps {
  title: string;
  category: "science" | "math" | "humanities" | "language" | "arts" | "tech" | "health";
  nextSession?: string;
  activeUsers?: number;
  icon: React.ReactNode;
}

const categoryColors = {
  science: "bg-subject-science/10 text-subject-science border-subject-science/20",
  math: "bg-subject-math/10 text-subject-math border-subject-math/20",
  humanities: "bg-subject-humanities/10 text-subject-humanities border-subject-humanities/20",
  language: "bg-subject-language/10 text-subject-language border-subject-language/20",
  arts: "bg-subject-arts/10 text-subject-arts border-subject-arts/20",
  tech: "bg-subject-tech/10 text-subject-tech border-subject-tech/20",
  health: "bg-subject-health/10 text-subject-health border-subject-health/20",
};

const SubjectCard = ({ title, category, nextSession, activeUsers, icon }: SubjectCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    const slug = encodeURIComponent(title.replace(/\s+/g, "-").toLowerCase());
    navigate(`/subjects/${slug}`);
  };

  return (
    <Card onClick={handleClick} className="group relative overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
      <div className="p-6">
        <div className={`inline-flex p-3 rounded-lg mb-4 ${categoryColors[category]}`}>
          {icon}
        </div>
        
        <h3 className="font-semibold text-xl mb-2">{title}</h3>
        
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          {nextSession && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Next: {nextSession}</span>
            </div>
          )}
          {activeUsers && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{activeUsers} learning now</span>
            </div>
          )}
        </div>

        <Badge className="mt-4" variant="secondary">
          Explore
        </Badge>
        <div className="mt-3">
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/schedule?subject=${encodeURIComponent(title)}`); }}>
            Sessions for {title}
          </Button>
        </div>
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </Card>
  );
};

export default SubjectCard;
