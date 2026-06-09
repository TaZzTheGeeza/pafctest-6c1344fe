# World Cup 2026 Sweepstake — Full Build (Option B)

Builds on the existing raffle system. Adds team mapping, tournament progress tracking, prize tiers, and a "My Team" view. No changes to GoCardless flow or core raffle tables.

## What the user gets

- A dedicated sweepstake raffle (48 tickets, £5 each) using the existing raffle engine + GoCardless checkout.
- Public **Sweepstake page** at `/world-cup-sweepstake`:
  - Visual 48-cell grid. Each cell shows the number, and (once assigned) the country flag + name.
  - Before team assignment: "Mystery Team" placeholders to drive early sales.
  - Live group-stage table view once the admin assigns teams to groups.
  - Tournament progress: teams visually marked as Advanced / Eliminated / Champion / Runner-up / 3rd / Golden Boot.
  - Prize tier panel ("Winner £X, Runner-up £Y, 3rd £Z, Golden Boot £W").
- **"My Team" view** — logged-in buyers see their assigned country, current status, and potential prize.
- **Admin panel** (extends `RaffleAdminPage`) with a new "Sweepstake" tab:
  - Bulk-assign 48 teams to ticket numbers (manual or "shuffle randomly" button).
  - Set group letter (A–L), flag emoji, country name per ticket.
  - Mark teams as advanced / eliminated / champion / runner-up / third / golden_boot_winner.
  - Set prize amounts per tier.
  - Email blast button: "Reveal teams to buyers" (uses existing transactional email infra).

## Technical Details

### New table: `sweepstake_team_assignments`

```
id uuid pk
raffle_id uuid fk -> raffles
ticket_number int
country_name text
flag_emoji text
group_letter text (A–L, nullable)
status text default 'active'   -- active | advanced | eliminated | champion | runner_up | third | golden_boot
created_at, updated_at
unique (raffle_id, ticket_number)
```

GRANTs: SELECT for anon/authenticated (public reveal); INSERT/UPDATE/DELETE admin-only via RLS using `has_role(auth.uid(), 'admin')`. service_role full.

### Extend `raffles` table

Add nullable columns (no migration to existing rows needed):
- `sweepstake_mode boolean default false`
- `prize_winner_pence int` / `prize_runner_up_pence` / `prize_third_pence` / `prize_golden_boot_pence`
- `teams_revealed boolean default false`

### Frontend

- New page `src/pages/WorldCupSweepstakePage.tsx` — route `/world-cup-sweepstake`.
  - Reuses `NumberPicker` for buying, augmented to show team chips on already-revealed grids.
  - Group-stage grouped view (A–L with 4 teams each, post-expansion 12 groups of 4 → 48 teams ✓).
  - Status badges with PAFC gold/black palette.
- New admin tab in `RaffleAdminPage.tsx`:
  - "Sweepstake Manager" — table editor for 48 rows, status dropdowns, prize inputs.
  - "Reveal Teams" button calls existing transactional email queue.
- `MyProfilePage` — extend purchases tab to show assigned country + status for sweepstake tickets.

### Reuse (unchanged)

- `create-raffle-checkout` edge function (GoCardless).
- `verify-raffle-payment`.
- `RaffleDraw` component (not used for sweepstake — winner determined by tournament outcome, not a drawn number, but kept available).
- `get_taken_ticket_numbers` RPC.

### Visual style

- Black/gold PAFC palette. Oswald headings.
- Country grid: 12 group cards (A–L), each with 4 ticket cells showing flag + number + buyer name (if revealed).
- Status overlays: green check for advanced, red strike for eliminated, gold trophy for champion.

## Phasing (single PR, but staged UX)

1. Today: launch page in "blind sale" mode — 48 mystery tickets, drives buzz.
2. Mar 31 2026: admin assigns teams, hits "Reveal" — buyers get email.
3. Jun 11 – Jul 19: admin updates status as tournament progresses; site auto-shows winners.

## Out of scope (can add later)

- Auto-scraping FIFA results to set status (manual updates for v1).
- Predictor tiebreaker question.
- Public bracket visualisation.

---

Ready to build. Shall I proceed?
