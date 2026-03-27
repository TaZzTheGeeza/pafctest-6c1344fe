
-- Allow users to update their own messages
CREATE POLICY "Users can update own messages"
ON public.hub_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
