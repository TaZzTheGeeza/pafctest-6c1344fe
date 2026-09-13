# Match Day Kit Requests

A simple way for parents to ask for kit, and a full record of who has had what and when.

## What parents see

A new "Kit" page (linked from the Player Zone in the Hub and from My Profile):

- The kit list with a photo of each item: gold match shirt, black shorts, black and white socks, plus goalkeeper shirt, shorts and socks.
- Pick the child, pick the item, pick a size.
- A built in size helper from the Macron guide (child's age or height suggests the size, with the chest and height ranges shown), because Macron runs small.
- A required reason box - they must explain why new kit is needed (outgrown, damaged, lost, goalkeeper, never received). Free text is required on top of the reason type.
- "My kit" list showing every item their child has already been given, with the date, so parents can see their own history before asking.
- Status of each request: Pending, Approved, Ready to collect, Handed out, or Declined, with the admin's note.

## What admins see

A "Kit" section on the dashboard:

- Incoming requests with child, team, item, size, reason and what that child has already had (so a second pair of socks in a month is obvious).
- Approve, decline (with a reason) or mark as handed out.
- When approving, admins can tick "chargeable" and set an amount - the first item is free, replacements can carry a cost. The cost shows on the parent's request.
- Kit register: every item ever issued, filterable by team, child, item and date, with a CSV export.
- Admins can add a handout directly without a request (for kit given out at training).
- Manage the kit list itself: add or retire items, photos, available sizes.

## Starting data

Every registered player is recorded as already having one match day kit set, dated from their registration, marked "Initial kit". That way the history is complete from day one and repeat requests are visible straight away.

## Notifications

- New request notifies admins in the Hub with a direct link to it.
- Approve, decline or hand out notifies the parent in the Hub and by push, linked to their kit page.

## Technical notes

- Three new tables: `kit_items` (catalogue), `kit_requests` (the ask, its reason, status, chargeable flag and amount) and `kit_issues` (the permanent register of what was handed out, linked to a request when there was one).
- Row level security: parents read and create their own requests and read their own children's issued items (matched through `guardians` and `player_registrations`); admins have full access; the catalogue is readable by any signed in user.
- Item photos uploaded as CDN assets and stored as URLs on `kit_items`.
- Sizes stored per item as an array, with the Macron junior and adult guide held in a shared front end config used by the size helper.
- Notifications use the existing Hub notification and push helpers, with deep links in the established format.
