-- Make author_id nullable for system-generated blog articles
ALTER TABLE blog_articles 
ALTER COLUMN author_id DROP NOT NULL;