import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useState, useEffect } from 'react';
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
  onDelete?: (sessionId: string) => Promise<void> | void;
  onEdit?: (sessionId: string) => Promise<void> | void;
  onViewAttendees?: (sessionId: string) => Promise<void> | void;
  isHost?: boolean;
  isJoined?: boolean;
  // when this counter increments, the card should ensure its host dialog is closed
  closeHostDialogTrigger?: number;
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
  onDelete,
  onEdit,
  onViewAttendees,
  isHost,
  isJoined,
  closeHostDialogTrigger,
}: SessionCardProps) => {
  const isFilling = spotsLeft <= capacity * 0.3;
  const [hostDialogOpen, setHostDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // close host dialog when parent signals via trigger
  useEffect(() => {
    if (typeof closeHostDialogTrigger !== 'undefined') {
      setHostDialogOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeHostDialogTrigger]);

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
              <div className="flex-1">
                {/* Host controls dialog */}
                <Dialog open={hostDialogOpen} onOpenChange={setHostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">Host Controls</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Host Controls</DialogTitle>
                      <DialogDescription>Manage this session. Deleting will remove it for all participants.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-3">
                      <div className="flex flex-col gap-2">
                        <Button variant="destructive" disabled={isDeleting} onClick={async () => {
                          if (!sessionId || !onDelete) return;
                          try {
                            setIsDeleting(true);
                            await onDelete(sessionId);
                          } catch (e) {
                            // swallow — parent shows toast
                            console.error('onDelete error', e);
                          } finally {
                            setIsDeleting(false);
                            setHostDialogOpen(false);
                          }
                        }}>
                          {isDeleting ? 'Deleting...' : 'Delete Session'}
                        </Button>
                        <Button variant="outline" disabled={isDeleting} onClick={() => {
                          // close controls then trigger edit
                          setHostDialogOpen(false);
                          if (sessionId && onEdit) onEdit(sessionId);
                        }}>
                          Edit Session
                        </Button>
                        <Button variant="ghost" disabled={isDeleting} onClick={() => {
                          setHostDialogOpen(false);
                          if (sessionId && onViewAttendees) onViewAttendees(sessionId);
                        }}>
                          View Attendees
                        </Button>
                      </div>
                    </div>
                    <DialogFooter className="mt-4">
                      <DialogClose asChild>
                        <Button variant="outline">Close</Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            <Button variant="outline" onClick={() => onDetails && onDetails()}>Details</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default SessionCard;
