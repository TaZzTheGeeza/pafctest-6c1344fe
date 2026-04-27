UPDATE public.announcements
SET message = '🏆 Presentation Evening — Fri 5 June 2026 at Holiday Inn, Thorpe Wood. Tap here to claim your family tickets — admins will allocate seats: /presentation'
WHERE is_active = true
  AND message ILIKE '%Presentation Evening%';