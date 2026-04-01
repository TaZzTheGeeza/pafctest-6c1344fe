
-- Add news_editor to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'news_editor';

-- Create news_articles table
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image_url TEXT,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;

-- Anyone can view published articles
CREATE POLICY "Anyone can view published articles"
  ON public.news_articles
  FOR SELECT
  TO public
  USING (is_published = true);

-- News editors can view all articles (including drafts)
CREATE POLICY "News editors can view all articles"
  ON public.news_articles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'news_editor') OR has_role(auth.uid(), 'admin'));

-- News editors can create articles
CREATE POLICY "News editors can create articles"
  ON public.news_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'news_editor') OR has_role(auth.uid(), 'admin'));

-- News editors can update own articles, admins can update any
CREATE POLICY "News editors can update articles"
  ON public.news_articles
  FOR UPDATE
  TO authenticated
  USING (
    (has_role(auth.uid(), 'news_editor') AND author_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    (has_role(auth.uid(), 'news_editor') AND author_id = auth.uid())
    OR has_role(auth.uid(), 'admin')
  );

-- Only admins can delete articles
CREATE POLICY "Admins can delete articles"
  ON public.news_articles
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));
