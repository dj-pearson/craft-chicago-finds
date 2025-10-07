-- Add digital product categories for national marketplace
-- These categories are city-agnostic (city_id is NULL) and perfect for digital products

INSERT INTO categories (name, slug, description, image_url, city_id, is_active, sort_order)
VALUES
  (
    'Digital Templates',
    'digital-templates',
    'Spreadsheets, planners, business templates, and productivity tools',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
    NULL,
    true,
    1
  ),
  (
    'Digital Printables',
    'digital-printables',
    'Wall art, planners, calendars, and printable designs',
    'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800',
    NULL,
    true,
    2
  ),
  (
    'Digital Stickers',
    'digital-stickers',
    'Digital sticker packs for GoodNotes, Notability, and digital planning',
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
    NULL,
    true,
    3
  ),
  (
    'Digital Art Prints',
    'digital-art-prints',
    'Downloadable artwork, illustrations, and photography prints',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800',
    NULL,
    true,
    4
  ),
  (
    'Digital Greeting Cards',
    'digital-greeting-cards',
    'E-cards, printable greeting cards, and digital invitations',
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800',
    NULL,
    true,
    5
  ),
  (
    'Digital Patterns',
    'digital-patterns',
    'Sewing patterns, knitting patterns, crochet patterns, and craft templates',
    'https://images.unsplash.com/photo-1515405295579-ba7b45403062?w=800',
    NULL,
    true,
    6
  ),
  (
    'Digital Fonts & Graphics',
    'digital-fonts-graphics',
    'Custom fonts, SVG files, clipart, and design elements',
    'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800',
    NULL,
    true,
    7
  );