ALTER TABLE public.pitch_map_layout
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS fill_opacity numeric NOT NULL DEFAULT 0.3,
  ADD COLUMN IF NOT EXISTS label_text text,
  ADD COLUMN IF NOT EXISTS sub_text text,
  ADD COLUMN IF NOT EXISTS label_color text,
  ADD COLUMN IF NOT EXISTS font_size numeric NOT NULL DEFAULT 17,
  ADD COLUMN IF NOT EXISTS use_status_color boolean NOT NULL DEFAULT true;