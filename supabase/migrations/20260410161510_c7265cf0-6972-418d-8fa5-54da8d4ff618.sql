
ALTER TABLE public.hub_messages
ADD COLUMN reply_to UUID REFERENCES public.hub_messages(id) ON DELETE SET NULL;
