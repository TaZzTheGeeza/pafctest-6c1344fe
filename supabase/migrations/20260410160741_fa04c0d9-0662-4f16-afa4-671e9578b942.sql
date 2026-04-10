
-- Create table for message reactions
CREATE TABLE public.hub_message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.hub_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable RLS
ALTER TABLE public.hub_message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can view reactions on messages they can see (team members)
CREATE POLICY "Team members can view reactions"
ON public.hub_message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM hub_messages m
    JOIN hub_channels c ON c.id = m.channel_id
    WHERE m.id = hub_message_reactions.message_id
    AND (c.team_slug IS NULL OR is_team_member(auth.uid(), c.team_slug) OR has_role(auth.uid(), 'admin'))
  )
);

-- Users can add their own reactions
CREATE POLICY "Users can add reactions"
ON public.hub_message_reactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own reactions
CREATE POLICY "Users can remove own reactions"
ON public.hub_message_reactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.hub_message_reactions;

-- Index for fast lookups
CREATE INDEX idx_hub_message_reactions_message_id ON public.hub_message_reactions(message_id);
