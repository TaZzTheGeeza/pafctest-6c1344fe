import { Video, Calendar, Clock, Users, X } from "lucide-react";
import { format } from "date-fns";
import { MeetingRSVP } from "./MeetingRSVP";

export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  room_code: string;
  status: string;
  created_by: string;
  created_at: string;
  invite_type: string;
}

interface MeetingCardProps {
  meeting: Meeting;
  isAdmin: boolean;
  inviteeCount?: number;
  onJoin: () => void;
  onDelete: () => void;
}

export function MeetingCard({ meeting, isAdmin, inviteeCount, onJoin, onDelete }: MeetingCardProps) {
  const isLive = meeting.status === "live";
  const scheduledDate = new Date(meeting.scheduled_at);
  const isStartingSoon = scheduledDate.getTime() - Date.now() < 15 * 60 * 1000;

  return (
    <div
      className={`relative p-4 bg-card border rounded-xl transition-all ${
        isLive
          ? "border-emerald-500/50 shadow-lg shadow-emerald-500/10"
          : "border-border hover:border-primary/30"
      }`}
    >
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-display font-bold text-emerald-400 tracking-wider uppercase">Live</span>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-display font-bold text-foreground tracking-wide">
            {meeting.title}
          </h3>
          {meeting.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(scheduledDate, "EEE dd MMM yyyy")}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {format(scheduledDate, "HH:mm")} · {meeting.duration_minutes} min
            </span>
            {meeting.invite_type !== "everyone" && inviteeCount !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                {inviteeCount} invited
              </span>
            )}
            {meeting.invite_type === "everyone" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                Everyone
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(isLive || isStartingSoon || isAdmin) && (
            <button
              onClick={onJoin}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-display tracking-wider transition-colors ${
                isLive
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <Video className="h-3.5 w-3.5" />
              {isLive ? "Join Now" : isAdmin ? "Start" : "Join"}
            </button>
          )}
          {isAdmin && !isLive && (
            <button
              onClick={onDelete}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete meeting"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Attendance RSVP */}
      <MeetingRSVP meetingId={meeting.id} />
    </div>
  );
}
