
-- Club-wide documents table
CREATE TABLE public.club_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  file_url text,
  document_category text NOT NULL DEFAULT 'general',
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.club_documents ENABLE ROW LEVEL SECURITY;

-- Permission table for users allowed to upload club documents
CREATE TABLE public.document_upload_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.document_upload_permissions ENABLE ROW LEVEL SECURITY;

-- RLS for club_documents: anyone authenticated can view, admins + permitted users can manage
CREATE POLICY "Anyone can view club documents"
  ON public.club_documents FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage club documents"
  ON public.club_documents FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Permitted users can insert club documents"
  ON public.club_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.document_upload_permissions WHERE user_id = auth.uid())
  );

CREATE POLICY "Permitted users can delete own club documents"
  ON public.club_documents FOR DELETE
  TO authenticated
  USING (
    uploaded_by = auth.uid() AND EXISTS (SELECT 1 FROM public.document_upload_permissions WHERE user_id = auth.uid())
  );

-- RLS for document_upload_permissions: only admins manage, users can check own
CREATE POLICY "Admins can manage upload permissions"
  ON public.document_upload_permissions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own permission"
  ON public.document_upload_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
