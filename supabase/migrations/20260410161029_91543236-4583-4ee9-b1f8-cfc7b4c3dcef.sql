
CREATE TABLE public.hub_message_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.hub_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.hub_message_reads ENABLE ROW LEVEL SECURITY;

-- Team members can view read receipts on messages in their channels
CREATE POLICY "Team members can view read receipts"
ON public.hub_message_reads
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hub_messages m
    JOIN hub_channels c ON c.id = m.channel_id
    WHERE m.id = hub_message_reads.message_id
    AND (c.team_slug IS NULL OR is_team_member(auth.uid(), c.team_slug) OR has_role(auth.uid(), 'admin'))
  )
);

-- Users can insert their own read receipts
CREATE POLICY "Users can mark messages as read"
ON public.hub_message_reads
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_hub_message_reads_message_id ON public.hub_message_reads(message_id);
CREATE INDEX idx_hub_message_reads_user_id ON public.hub_message_reads(user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_message_reads;
