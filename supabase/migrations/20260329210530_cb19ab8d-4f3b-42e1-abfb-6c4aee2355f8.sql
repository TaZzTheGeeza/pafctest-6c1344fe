
-- Table for admin replies to contact enquiries
CREATE TABLE public.enquiry_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enquiry_replies ENABLE ROW LEVEL SECURITY;

-- Admins can manage replies
CREATE POLICY "Admins can manage enquiry replies"
  ON public.enquiry_replies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Users can view replies to their own submissions (matched by email)
CREATE POLICY "Users can view replies to own enquiries"
  ON public.enquiry_replies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.contact_submissions cs
      JOIN public.profiles p ON p.email = cs.email
      WHERE cs.id = enquiry_replies.submission_id
        AND p.id = auth.uid()
    )
  );
