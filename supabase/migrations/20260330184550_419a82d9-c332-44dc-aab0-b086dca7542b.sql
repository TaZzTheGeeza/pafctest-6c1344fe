
-- Meeting invitees table
CREATE TABLE public.meeting_invitees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.club_meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

ALTER TABLE public.meeting_invitees ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitees
CREATE POLICY "Admins can manage meeting invitees"
ON public.meeting_invitees FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::text))
WITH CHECK (has_role(auth.uid(), 'admin'::text));

-- Users can see their own invites
CREATE POLICY "Users can view own invites"
ON public.meeting_invitees FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Add invite_type column to club_meetings to know if it's open or invite-only
ALTER TABLE public.club_meetings ADD COLUMN invite_type TEXT NOT NULL DEFAULT 'everyone';
