import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface ProgressCardProps {
  subject: string;
  mastery: number;
  skillsCompleted: number;
  totalSkills: number;
  recentGain: number;
  category: "science" | "math" | "humanities" | "language" | "arts";
}

const categoryColors = {
  science: "text-subject-science",
  math: "text-subject-math",
  humanities: "text-subject-humanities",
  language: "text-subject-language",
  arts: "text-subject-arts",
};

const ProgressCard = ({
  subject,
  mastery,
  skillsCompleted,
  totalSkills,
  recentGain,
  category,
}: ProgressCardProps) => {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className={`font-semibold text-lg ${categoryColors[category]}`}>{subject}</h3>
          <p className="text-sm text-muted-foreground">
            {skillsCompleted} of {totalSkills} skills
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          +{recentGain}%
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Mastery</span>
          <span className="font-semibold">{mastery}%</span>
        </div>
        <Progress value={mastery} className="h-2" />
      </div>
    </Card>
  );
};

export default ProgressCard;
