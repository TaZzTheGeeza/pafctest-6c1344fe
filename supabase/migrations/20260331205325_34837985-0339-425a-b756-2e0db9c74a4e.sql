
-- Migrate old team_slug values to canonical ones (with 's' suffix)
UPDATE public.team_members SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE public.team_members SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE public.team_members SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE public.team_members SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE public.team_members SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE public.team_members SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE public.team_members SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE public.team_members SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE public.team_members SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE public.team_members SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Also fix guardians table
UPDATE public.guardians SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE public.guardians SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE public.guardians SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE public.guardians SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE public.guardians SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE public.guardians SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE public.guardians SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE public.guardians SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE public.guardians SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE public.guardians SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Also fix fixture_availability table
UPDATE public.fixture_availability SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE public.fixture_availability SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE public.fixture_availability SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE public.fixture_availability SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE public.fixture_availability SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE public.fixture_availability SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE public.fixture_availability SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE public.fixture_availability SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE public.fixture_availability SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE public.fixture_availability SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Also fix hub_channels table
UPDATE public.hub_channels SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE public.hub_channels SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE public.hub_channels SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE public.hub_channels SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE public.hub_channels SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE public.hub_channels SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE public.hub_channels SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE public.hub_channels SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE public.hub_channels SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE public.hub_channels SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Also fix user_age_groups table
UPDATE public.user_age_groups SET age_group = 'u7s' WHERE age_group = 'u7';
UPDATE public.user_age_groups SET age_group = 'u8s-black' WHERE age_group = 'u8-black';
UPDATE public.user_age_groups SET age_group = 'u8s-gold' WHERE age_group = 'u8-gold';
UPDATE public.user_age_groups SET age_group = 'u9s' WHERE age_group = 'u9';
UPDATE public.user_age_groups SET age_group = 'u10s' WHERE age_group = 'u10';
UPDATE public.user_age_groups SET age_group = 'u11s-black' WHERE age_group = 'u11-black';
UPDATE public.user_age_groups SET age_group = 'u11s-gold' WHERE age_group = 'u11-gold';
UPDATE public.user_age_groups SET age_group = 'u13s-black' WHERE age_group = 'u13-black';
UPDATE public.user_age_groups SET age_group = 'u13s-gold' WHERE age_group = 'u13-gold';
UPDATE public.user_age_groups SET age_group = 'u14s' WHERE age_group = 'u14';
