CREATE TABLE public.homework_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.homework_tasks(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  question_type text NOT NULL DEFAULT 'written',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.homework_questions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.homework_questions TO authenticated;
GRANT ALL ON public.homework_questions TO service_role;
ALTER TABLE public.homework_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read homework questions" ON public.homework_questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Coaches manage homework questions" ON public.homework_questions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'));

CREATE TABLE public.homework_question_keys (
  question_id uuid PRIMARY KEY REFERENCES public.homework_questions(id) ON DELETE CASCADE,
  correct_answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_question_keys TO authenticated;
GRANT ALL ON public.homework_question_keys TO service_role;
ALTER TABLE public.homework_question_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage homework answer keys" ON public.homework_question_keys
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'));

CREATE TABLE public.homework_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.homework_submissions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.homework_questions(id) ON DELETE CASCADE,
  answer jsonb,
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework_answers TO authenticated;
GRANT ALL ON public.homework_answers TO service_role;
ALTER TABLE public.homework_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parents manage their own homework answers" ON public.homework_answers
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.homework_submissions s WHERE s.id = homework_answers.submission_id AND s.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.homework_submissions s WHERE s.id = homework_answers.submission_id AND s.user_id = auth.uid()));
CREATE POLICY "Coaches read all homework answers" ON public.homework_answers
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'coach'));

CREATE OR REPLACE FUNCTION public.mark_homework_answer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  qtype text;
  key jsonb;
BEGIN
  SELECT q.question_type, k.correct_answers
    INTO qtype, key
  FROM public.homework_questions q
  LEFT JOIN public.homework_question_keys k ON k.question_id = q.id
  WHERE q.id = NEW.question_id;

  IF key IS NULL OR jsonb_array_length(key) = 0 OR qtype = 'written' THEN
    NEW.is_correct := NULL;
    RETURN NEW;
  END IF;

  IF NEW.answer IS NULL THEN
    NEW.is_correct := false;
    RETURN NEW;
  END IF;

  IF jsonb_typeof(NEW.answer) = 'array' THEN
    NEW.is_correct := (
      SELECT coalesce(array_agg(v ORDER BY v), '{}') FROM jsonb_array_elements_text(NEW.answer) v
    ) = (
      SELECT coalesce(array_agg(v ORDER BY v), '{}') FROM jsonb_array_elements_text(key) v
    );
  ELSE
    NEW.is_correct := EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(key) v
      WHERE lower(trim(v)) = lower(trim(NEW.answer #>> '{}'))
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER mark_homework_answer_trg
BEFORE INSERT OR UPDATE ON public.homework_answers
FOR EACH ROW EXECUTE FUNCTION public.mark_homework_answer();

CREATE TRIGGER update_homework_questions_updated_at
BEFORE UPDATE ON public.homework_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_homework_questions_task ON public.homework_questions(task_id, position);
CREATE INDEX idx_homework_answers_submission ON public.homework_answers(submission_id);