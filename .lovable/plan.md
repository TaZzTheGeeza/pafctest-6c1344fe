# Interactive Coaching for Fixtures

Two connected tools, both accessed from a fixture card in the Coach Panel (and mirrored on the fixture detail in the Hub for view-only sharing to players/parents once published).

The existing `team_selections` table already stores `formation`, `players`, and `notes` — we extend it rather than adding new tables where possible.

---

## 1. Visual Formation & Squad Selector (pre-match)

Replace the current text-based formation dropdown in `TeamSelectionTab.tsx` with a **drag-and-drop pitch**.

**Coach flow**
- Pick format (auto from age group: 5v5, 7v7, 9v9, 11v11).
- Pick formation from presets that match the format (e.g. 7v7 → 2-3-1, 3-2-1, 2-2-2; 9v9 → 3-2-3, 3-3-2; 11v11 → 4-3-3, 4-4-2, 3-5-2).
- Roster appears as player chips on a bench below the pitch. Drag chip onto a position slot to assign. Drag between slots to swap. Drag off pitch to unassign.
- Mark a captain (armband icon) and vice-captain.
- Assign subs bench (any selected player not on the pitch).
- Add per-player role notes ("track back", "stay wide") via long-press / click on a placed chip.
- Save as **Draft** (only coach sees) or **Publish** (visible to team on Hub + optional push notification).

**"Show the team" moment**
- A **Reveal** button opens a full-screen presentation mode: black background, gold pitch, players fade in position-by-position with their photo + name (dramatic walkout feel — reuses the walkout aesthetic already in `Player Showcase`).
- Works nicely on a phone held up in the changing room.

**Ideas worth including**
- **Multiple lineups per fixture**: starting XI, second half, penalty takers order.
- **Availability aware**: greys out players marked Unavailable in Fixtures & Events; warns if selected.
- **Auto-suggest** from most-recent published lineup for the same team (one-tap "copy last week").
- **Opposition formation** field so coach can prep against a shape.

---

## 2. Interactive Tactics Whiteboard (in-game / half-time)

A touch-first tactics board designed for a phone/tablet on the touchline.

**Core canvas**
- SVG pitch (full or half). Toggle full ↔ attacking-half ↔ defending-half.
- Drag player tokens (numbered discs, or photos if lineup published) and opposition tokens (red discs).
- Draw with finger: arrows (runs), dashed arrows (passes), zig-zag (dribble), zones (shaded rectangles/circles).
- Colour palette limited to 3 (attack / defence / neutral) to keep it fast on the field.
- Undo / clear / eraser.

**Live coaching modes**
- **Freeze frame**: snapshot the current board as an image, save to the fixture — builds a library of "moments" the coach can flick through at half-time.
- **Animate**: record a short sequence (positions at t=0 → t=1 → t=2), then play back as a looping animation to show a movement pattern. Store keyframes as JSON.
- **Cast to big screen**: a shareable read-only URL/QR the coach can open on a tablet propped against a bag so subs can watch.

**Reusable playbook**
- Save any board as a named **Play** ("Corner routine A", "High press trigger"). Playbook is per-team, reusable across fixtures.
- Starter pack of 5–6 templates per format so it's useful on day one.

**Field-friendly polish**
- High-contrast mode toggle (sunlight readable).
- Landscape lock on the whiteboard route.
- Wake-lock so the screen doesn't sleep mid-talk.
- Big touch targets, no small buttons.

---

## Where it lives

- **Coach Panel → fixture row**: existing `TeamSelectionTab` becomes tab-set: **Squad**, **Tactics Board**, **Playbook**.
- **Hub → Fixtures & Events → fixture detail**: when a lineup is published, players/parents see the formation + starting XI + subs (read-only, no tactics board — that stays coach-only).
- **Presentation "Reveal" mode**: standalone `/fixture/:id/reveal` route for full-screen use.

---

## Technical details

- Extend `team_selections`:
  - `players jsonb` → `[{ player_id, position: {x,y}, role: 'starter'|'sub', is_captain, is_vice, notes }]` (backward compatible read via migration).
  - Add `formation_format text` (5v5/7v7/9v9/11v11), `status text` ('draft'|'published'), `opposition_formation text`, `published_at timestamptz`.
- New table `tactics_boards` (coach + admin RLS only):
  - `id`, `team_slug`, `fixture_id nullable`, `name`, `board_data jsonb` (tokens + drawings + keyframes), `is_template bool`, `created_by`, timestamps.
  - Standard GRANTs + RLS: coaches/admins of that age group read/write, everyone else no access.
- SVG-based renderer for both pitch + whiteboard. `@dnd-kit/core` for drag-and-drop (already in the project ecosystem; confirm before install). Drawing done with SVG paths captured from pointer events — no extra library needed.
- Reveal mode uses `framer-motion` (already used elsewhere e.g. matchday programme).
- Screen wake-lock via the standard `navigator.wakeLock` API, feature-detected.
- Notifications on publish reuse `notifyTeamMembers` — triple-delivery per existing memory.

---

## Suggested build order

1. Formation builder + published lineup view + Hub read-only card. (biggest coach win, ships first)
2. Reveal / walkout screen.
3. Tactics whiteboard MVP (draw + drag, save snapshots).
4. Playbook + animated sequences.

Which of these ideas do you want in scope for v1? I'd recommend starting with **1 + 2** and adding the whiteboard as a fast follow-up.
