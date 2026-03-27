
CREATE TABLE public.safeguarding_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number text NOT NULL UNIQUE,
  is_anonymous boolean NOT NULL DEFAULT false,
  reporter_name text,
  reporter_email text,
  reporter_phone text,
  category text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  people_involved text,
  incident_date date,
  user_id uuid,
  status text NOT NULL DEFAULT 'new',
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.safeguarding_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit a report
CREATE POLICY "Anyone can submit safeguarding reports"
ON public.safeguarding_reports
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view/manage reports
CREATE POLICY "Admins can manage safeguarding reports"
ON public.safeguarding_reports
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Reporters can view their own report by reference (if logged in)
CREATE POLICY "Users can view own reports"
ON public.safeguarding_reports
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Generate reference number function
CREATE OR REPLACE FUNCTION public.generate_report_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.reference_number := 'SG-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(NEW.id::text, 1, 6);
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_report_reference
BEFORE INSERT ON public.safeguarding_reports
FOR EACH ROW
EXECUTE FUNCTION public.generate_report_reference();
