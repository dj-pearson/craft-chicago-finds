-- Update launch dates for Detroit and Milwaukee
UPDATE cities 
SET launch_date = '2025-12-01'
WHERE slug = 'detroit';

UPDATE cities 
SET launch_date = '2026-01-01'
WHERE slug = 'milwaukee';