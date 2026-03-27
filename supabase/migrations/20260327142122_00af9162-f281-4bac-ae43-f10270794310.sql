
ALTER TABLE public.player_registrations
  ADD COLUMN address text,
  ADD COLUMN fa_fan_number text,
  ADD COLUMN relationship_to_child text,
  ADD COLUMN emergency_contact_name text,
  ADD COLUMN emergency_contact_relationship text,
  ADD COLUMN emergency_contact_phone text,
  ADD COLUMN known_to_social_services boolean DEFAULT false,
  ADD COLUMN social_services_details text,
  ADD COLUMN foster_care_details text,
  ADD COLUMN consent_medical boolean DEFAULT false,
  ADD COLUMN consent_photography boolean DEFAULT false,
  ADD COLUMN declaration_confirmed boolean DEFAULT false;
