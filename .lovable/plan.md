# Direct Links for All Correspondence

## Goal
Make every in-app notification, push alert, and action email open the precise team, fixture, report, lineup, meeting, payment, order, registration, event, or message it describes.

## Changes
- Audit every current sender across the app and scheduled notification functions.
- Standardise destination links so the same exact destination is used for in-app, push, and email delivery.
- Add record identifiers and team context to links where available, rather than landing users on generic Hub or list pages.
- Update receiving pages to recognise those identifiers and automatically show or focus the relevant item where needed.
- Keep safe fallbacks for old notifications that lack identifiers, while improving their team-specific destination.
- Correct known inconsistencies, including meeting reminders, match-report reminders, team chat, availability, payment, lineup, order, registration, presentation, contact, and shop correspondence.

## Technical details
- Extend the shared notification helper to derive one canonical destination and pass an absolute version into email template data.
- Update email templates to accept a destination URL and render a clear action button.
- Use the existing public domain for email links and relative same-origin paths for in-app and push links.
- Fix push payload call sites that currently send `body`/`url` instead of the function's expected `message`/`link` fields.
- Include stable query parameters or route IDs, then make destination views consume them without exposing private information.
- Deploy changed notification/email functions and verify the affected links, build, and current preview health.
