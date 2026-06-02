# End-of-Season Promotion: 25/26 → 26/27

This renames every age group +1 year across the entire system (data + code). Player rosters stay intact — only labels change.

## Promotion mapping

Per your answers:

| Old | → | New |
|---|---|---|
| U6 | → | U7 |
| U7 | → | U8 |
| U8 Black | → | U9 Black |
| U8 Gold | → | U9 Gold |
| U9 | → | U10 |
| U10 | → | U11 |
| U11 Black | → | U12 Black *(new group)* |
| U11 Gold | → | U12 Gold *(new group)* |
| U13 Black | → | U14 Black |
| U13 Gold | → | U14 Gold |
| U14 | → | U15 |

Slug equivalents: `u6s→u7s`, `u7s→u8s`, `u8s-black→u9s-black`, `u8s-gold→u9s-gold`, `u9s→u10s`, `u10s→u11s`, `u11s-black→u12s-black`, `u11s-gold→u12s-gold`, `u13s-black→u14s-black`, `u13s-gold→u14s-gold`, `u14s→u15s`.

## Critical: order of operations

Because old/new labels collide (e.g. promoted U7 clashes with existing U7), every UPDATE must run in **reverse age order** (U14 first, U6 last) inside a single transaction. Done correctly there are no collisions.

## What changes

### 1. Database — rename all rows (one migration, transactional)

Update `age_group` / `team_slug` / `team_name` / `team` / `preferred_age_group` columns across these tables:

- `player_stats`, `user_age_groups`, `match_reports`, `player_of_the_match`, `live_matches`, `match_player_stats`, `team_selections`, `training_notes`
- `team_members`, `team_invites`, `team_requests`, `guardians`
- `hub_channels`, `hub_availability_events`, `hub_notifications`, `hub_payment_requests`, `fixture_availability`
- `carpool_offers`, `carpool_requests`
- `presentation_allocations`, `presentation_tables`, `presentation_award_settings`, `presentation_award_votes`
- `club_events.team`, `player_registrations.preferred_age_group`
- `tournament_age_groups`, `tournament_photos`, `tournament_teams` (team_name only if it embeds an age group)

### 2. Database — update canonical helper functions

`public.canonical_team_slug()` and `public.canonical_age_group()` currently hard-code the old labels. Both functions will be rewritten to reflect the new ladder (U7, U8, U9 B/G, U10, U11, U12 B/G, U13, U14 B/G, U15) plus legacy aliases.

### 3. Code — hard-coded age-group lists

Updated in:

- `src/lib/faFixtureConfig.ts` — rename each entry's `team` + `slug`. **FA Full-Time `fixtureUrl` query params will be blanked** for promoted teams (they point to last season's FA team IDs which will not match new-season fixtures). You'll re-paste the new FA URLs per team once the league publishes them.
- `src/hooks/useTeamRoster.ts` — `ageGroupMap`
- `src/hooks/useUserAgeGroups.ts` — `SLUG_VARIANTS`
- `src/components/PlayerStatsForm.tsx` — `ageGroups` constant
- `src/pages/HubPage.tsx`, `DashboardPage.tsx`, `CoachPanelPage.tsx`, `TeamsPage.tsx`, `AuthPage.tsx`, `PresentationAwardsAdminPage.tsx`, `PlayerRegistrationPage.tsx`, `PlayerShowcaseDemo.tsx`, `PafcTvPage.tsx`, `TournamentPage.tsx`
- `src/components/ResultsSection.tsx`, `FixturesSection.tsx`, `YouTubeSection.tsx`
- `src/components/presentation/SeatingPlan.tsx`, `TheatreBlock.tsx`
- `src/components/hub/TeamAccessRequest.tsx`, `AwardsVoting.tsx`
- `src/components/dashboard/TeamRequestsManager.tsx`, `AdminNotificationComposer.tsx`
- `src/lib/shopify.ts`, `src/lib/tournamentAgeOrder.ts` (if needed)
- `supabase/functions/sync-photo-purchases/index.ts`, `shopify-orders/index.ts`, `export-council-fixtures/index.ts`, `_shared/transactional-email-templates/availability-event-added.tsx`

### 4. Memory + brand

Update `mem://structure/age-group-naming` with the new ladder.

## What this does NOT change

- Player rows, photos, stats history, hub messages, GoCardless mandates, Shopify products, raffle data — all preserved. Only the age-group label moves with them.
- Past `match_reports`, `player_of_the_match`, fixtures — these will also be relabelled, since you said "everything". If you'd rather keep last season's results stamped with the OLD label (so the U13 Gold trophy still says "U13 Gold"), say so and I'll exclude historical/match tables from the rename.
- FA Full-Time URLs — replaced with empty strings; you provide the new season's URLs when ready.

## Risks

- **Irreversible without a restore.** I'll wrap everything in a single transaction so a mid-migration failure rolls back cleanly, but once committed the only undo is a chat revert + DB restore.
- **Active subscriptions / GoCardless mandates** are unaffected (they're linked by user_id, not age group).
- **Notifications already sent** with old labels are not retroactively edited.

## Confirm before I build

1. **Historical match data** (`match_reports`, `player_of_the_match`, `match_player_stats`): rename to new labels, or keep stamped with the old season's label?
2. **U6**: no current U6 promotes into nothing — but new U6 intake for 26/27 will use the existing U6 group. The empty U6 stays. OK?

Reply with answers and I'll execute.
