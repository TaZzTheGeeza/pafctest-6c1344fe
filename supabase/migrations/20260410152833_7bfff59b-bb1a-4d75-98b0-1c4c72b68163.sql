
-- Normalize team_members: merge old slugs into canonical slugs with "s" suffix
-- First delete duplicates where user already exists under the canonical slug
DELETE FROM team_members WHERE team_slug = 'u7' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u7s');
DELETE FROM team_members WHERE team_slug = 'u8-black' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u8s-black');
DELETE FROM team_members WHERE team_slug = 'u8-gold' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u8s-gold');
DELETE FROM team_members WHERE team_slug = 'u9' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u9s');
DELETE FROM team_members WHERE team_slug = 'u10' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u10s');
DELETE FROM team_members WHERE team_slug = 'u11-black' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u11s-black');
DELETE FROM team_members WHERE team_slug = 'u11-gold' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u11s-gold');
DELETE FROM team_members WHERE team_slug = 'u13-black' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u13s-black');
DELETE FROM team_members WHERE team_slug = 'u13-gold' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u13s-gold');
DELETE FROM team_members WHERE team_slug = 'u14' AND user_id IN (SELECT user_id FROM team_members WHERE team_slug = 'u14s');

-- Now update remaining old slugs to canonical
UPDATE team_members SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE team_members SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE team_members SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE team_members SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE team_members SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE team_members SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE team_members SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE team_members SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE team_members SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE team_members SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Also normalize guardians table
DELETE FROM guardians WHERE team_slug = 'u7' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u7s');
DELETE FROM guardians WHERE team_slug = 'u8-black' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u8s-black');
DELETE FROM guardians WHERE team_slug = 'u8-gold' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u8s-gold');
DELETE FROM guardians WHERE team_slug = 'u9' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u9s');
DELETE FROM guardians WHERE team_slug = 'u10' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u10s');
DELETE FROM guardians WHERE team_slug = 'u11-black' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u11s-black');
DELETE FROM guardians WHERE team_slug = 'u11-gold' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u11s-gold');
DELETE FROM guardians WHERE team_slug = 'u13-black' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u13s-black');
DELETE FROM guardians WHERE team_slug = 'u13-gold' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u13s-gold');
DELETE FROM guardians WHERE team_slug = 'u14' AND parent_user_id IN (SELECT parent_user_id FROM guardians WHERE team_slug = 'u14s');

UPDATE guardians SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE guardians SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE guardians SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE guardians SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE guardians SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE guardians SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE guardians SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE guardians SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE guardians SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE guardians SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Normalize fixture_availability table
UPDATE fixture_availability SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE fixture_availability SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE fixture_availability SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE fixture_availability SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE fixture_availability SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE fixture_availability SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE fixture_availability SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE fixture_availability SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE fixture_availability SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE fixture_availability SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Normalize hub_channels table
UPDATE hub_channels SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE hub_channels SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE hub_channels SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE hub_channels SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE hub_channels SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE hub_channels SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE hub_channels SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE hub_channels SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE hub_channels SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE hub_channels SET team_slug = 'u14s' WHERE team_slug = 'u14';

-- Normalize carpool tables
UPDATE carpool_offers SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE carpool_offers SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE carpool_offers SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE carpool_offers SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE carpool_offers SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE carpool_offers SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE carpool_offers SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE carpool_offers SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE carpool_offers SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE carpool_offers SET team_slug = 'u14s' WHERE team_slug = 'u14';

UPDATE carpool_requests SET team_slug = 'u7s' WHERE team_slug = 'u7';
UPDATE carpool_requests SET team_slug = 'u8s-black' WHERE team_slug = 'u8-black';
UPDATE carpool_requests SET team_slug = 'u8s-gold' WHERE team_slug = 'u8-gold';
UPDATE carpool_requests SET team_slug = 'u9s' WHERE team_slug = 'u9';
UPDATE carpool_requests SET team_slug = 'u10s' WHERE team_slug = 'u10';
UPDATE carpool_requests SET team_slug = 'u11s-black' WHERE team_slug = 'u11-black';
UPDATE carpool_requests SET team_slug = 'u11s-gold' WHERE team_slug = 'u11-gold';
UPDATE carpool_requests SET team_slug = 'u13s-black' WHERE team_slug = 'u13-black';
UPDATE carpool_requests SET team_slug = 'u13s-gold' WHERE team_slug = 'u13-gold';
UPDATE carpool_requests SET team_slug = 'u14s' WHERE team_slug = 'u14';
