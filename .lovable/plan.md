# Pitch Booking System

Interactive SVG map of the PAFC ground (Pitches 1–6) where coaches request slots and admins/Fixture Secretary approve. Visible to hub members only. FA home fixtures auto-block slots.

## What gets built

### 1. New role: Fixture Secretary
- Added via existing `custom_roles` system (name `fixture_secretary`, gold/amber colour)
- New permissions: `page.pitch_bookings_admin`, `action.approve_pitch_bookings`, `action.manage_pitch_bookings`
- Coaches get submit rights; admins inherit full control

### 2. Database
- `pitches` — seed 6 rows matching the map (Pitch 1 7v7, Pitch 2 5v5, Pitch 3 7v7, Pitch 4 5v5, Pitch 5 9v9, Pitch 6 11v11) with format + suggested age groups
- `pitch_bookings` — pitch_id, requested_by, start_time, end_time, purpose (match/training/friendly/cup), age_group, opponent, notes, status (pending/approved/declined/cancelled), decided_by, decided_at, decline_reason, fa_fixture_id (nullable, for auto-imported)
- RLS: hub members read approved + own pending; coaches insert own; admin/fixture_secretary update any
- Conflict-detection function `check_pitch_conflict(pitch_id, start, end, exclude_id)` used by both client preview and server validation trigger

### 3. FA fixture auto-block
- Edge function `sync-fa-home-fixtures` (scheduled hourly) reads home fixtures from the existing FA Full-Time integration and upserts them as **approved** `pitch_bookings` with `fa_fixture_id` set
- Auto-matches age group → pitch size (U7/U8 → 5v5, U9/U10 → 7v7, U11/U12 → 9v9, U13+ → 11v11); when multiple pitches match, admin can reassign
- Coaches see FA slots as locked (grey/red)

### 4. Coach-facing page `/pitch-bookings`
- **Hub-members only** (RoleGate authenticated + hub check)
- Layout mirroring the uploaded image using an SVG (same pattern as `PitchLayoutSVG`):
  ```text
  [Pitch 1]        [Pitch 6]        [Pitch 3]
             [Pitch 5]
  [Pitch 2]                         [Pitch 4]
  ```
- Colour states per pitch: green = free, amber = pending request, red = confirmed booking, grey = FA locked
- Date picker above map (defaults today); status reflects that date
- Click pitch → side panel shows day timeline (hour blocks) + "Request this pitch" form
  - Fields: start/end time, purpose, age group (pre-fills from user's team), opponent, notes
  - Live conflict warning; suggests alternative pitches of same format if clash
- "My bookings" tab: coach sees own requests + status
- Weekly summary strip below map: 7-day mini heatmap per pitch

### 5. Admin approval queue `/pitch-bookings-admin`
- Restricted to admin + fixture_secretary
- Pending queue with approve/decline (with reason) buttons
- Full ground calendar view (all pitches, week/month)
- Ability to create bookings directly, edit any, and cancel with reason
- Cancelled/declined bookings trigger a hub_notification + email to the requester (reusing existing notification system)

### 6. Notifications
- On new request → notify all admins + fixture secretaries (hub_notification + email)
- On approve/decline → notify the requesting coach (hub_notification + email + push if subscribed)
- Uses existing `hub_notifications` table + email queue

### 7. Dashboard integration
- Admin dashboard tile: "Pending pitch bookings (N)"
- Coach Panel: "My pitch bookings" quick link
- Navigation: add Pitch Bookings entry under the Hub sidebar (hub members only)

## Technical notes
- New tables: `pitches`, `pitch_bookings` — both get GRANTs to authenticated + service_role, RLS enabled
- `check_pitch_conflict` as SECURITY DEFINER SQL function with `search_path=public`
- BEFORE INSERT/UPDATE trigger on `pitch_bookings` rejects overlaps against approved bookings (skipped for admin overrides via a flag column)
- Realtime enabled on `pitch_bookings` so the map updates live for everyone viewing it
- SVG pitch component reuses the visual style of `PitchLayoutSVG` and matches uploaded ground layout
- Times stored UTC, displayed in UK local (Europe/London) — same pattern as tournament fixtures

## Out of scope for v1 (can add later)
- Recurring/series bookings (season-long slot)
- Public availability page (no-login view)
- iCal feed export
- Cost tracking / groundsman billing
- Weather cancellation shortcut

Approve this and I'll build it end to end.
