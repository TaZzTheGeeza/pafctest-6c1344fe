
CREATE TABLE public.player_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'general',
  file_url text,
  notes text,
  expiry_date date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  uploaded_by uuid
);

ALTER TABLE public.player_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and coaches can manage player documents"
  ON public.player_documents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'coach'::app_role));

CREATE POLICY "Users can view own documents"
  ON public.player_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
