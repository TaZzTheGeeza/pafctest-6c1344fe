INSERT INTO tournaments (name, description, status, tournament_date, venue, entry_fee_cents, rules)
VALUES (
  'PAFC Tourney 2026',
  'Welcome to the PAFC Tourney 2026! Two weekends of competitive youth football across 8 age groups at Itter Park, Peterborough.',
  'active',
  '2026-06-13',
  'Itter Park, Itter Crescent, Peterborough, PE4 6SW',
  4000,
  E'1. All group matches are played on the same pitch\n2. Two 7-minute halves with strict 1-minute half time\n3. 5v5 for U7 & U8, 7v7 for U9-U14\n4. Max squad size: 10 players per team\n5. No player may play for more than one team\n6. Max 2 guest players allowed per team (proof of age required)\n7. Roll-on, roll-off substitutions (unlimited)\n8. No offside rule\n9. All free kicks are direct\n10. Back pass rule in place for all age groups\n11. U7-U10: Kick ins or dribble ins, no deliberate heading, retreat to halfway on opposition goal kicks\n12. Kit clashes: Away team wears bibs\n13. Home team supplies match ball (Size 3 for U7-U10, Size 4 for U11-U14)\n14. Shin pads mandatory\n15. Top 2 from each group proceed to Semi-Finals\n16. If teams level on points: goal difference, then penalties (3 each)\n17. No 3rd/4th place play-off\n18. Yellow/red card system in place\n19. FA Respect and Safeguarding Codes of Conduct apply\n20. No refunds if tournament cancelled or abandoned'
)
RETURNING id;