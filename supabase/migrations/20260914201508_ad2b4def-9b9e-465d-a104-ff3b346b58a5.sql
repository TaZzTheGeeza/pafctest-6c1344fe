ALTER TABLE public.kit_requests ADD COLUMN IF NOT EXISTS care_agreed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.kit_requests ADD COLUMN IF NOT EXISTS care_agreed_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.kit_requests.care_agreed IS 'Parent confirmed they agree to follow the kit care instructions';
COMMENT ON COLUMN public.kit_requests.care_agreed_at IS 'When the parent agreed to the kit care instructions';