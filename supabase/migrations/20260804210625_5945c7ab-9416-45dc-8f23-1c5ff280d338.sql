ALTER TABLE public.pitch_map_layout
  ADD COLUMN IF NOT EXISTS show_label boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_sub_text boolean NOT NULL DEFAULT true;