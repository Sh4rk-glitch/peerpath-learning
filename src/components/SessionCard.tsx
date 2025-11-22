import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Users, Star } from "lucide-react";

interface SessionCardProps {
  title: string;
  host: string;
  hostRating: number;
  time: string;
  duration: number;
  capacity: number;
  spotsLeft: number;
  subject: string;
  sessionId?: string;
  onJoin?: (sessionId: string) => Promise<void> | void;
  onDetails?: () => void;
  isHost?: boolean;
  isJoined?: boolean;
}

const SessionCard = ({
  title,
  host,
  hostRating,
  time,
  duration,
  capacity,
  spotsLeft,
  subject,
  sessionId,
  onJoin,
  onDetails,
  isHost,
  isJoined,
}: SessionCardProps) => {
  const isFilling = spotsLeft <= capacity * 0.3;

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{host.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-3">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg leading-tight">{title}</h3>
              <Badge variant="outline">{subject}</Badge>
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{host}</span>
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-warning text-warning" />
                {hostRating.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{time} • {duration} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{spotsLeft} spots left</span>
              {isFilling && <Badge variant="destructive" className="ml-1">Filling fast</Badge>}
            </div>
          </div>

          <div className="flex gap-2">
            {!isHost && (
              <Button className="flex-1" onClick={() => sessionId && onJoin && onJoin(sessionId)}>
                {isJoined ? 'Cancel Reservation' : 'Reserve Spot'}
              </Button>
            )}
            {isHost && (
              <Button className="flex-1" variant="outline">Host Controls</Button>
            )}
            <Button variant="outline" onClick={() => onDetails && onDetails()}>Details</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SessionCard;
