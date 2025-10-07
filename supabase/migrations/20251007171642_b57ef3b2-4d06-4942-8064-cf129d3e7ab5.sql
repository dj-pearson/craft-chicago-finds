-- Create public storage bucket for ChatGPT widgets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chatgpt-widgets',
  'chatgpt-widgets',
  true,
  10485760, -- 10MB limit
  ARRAY['application/javascript', 'text/javascript']
);

-- Allow public read access to widgets
CREATE POLICY "Public can read widgets"
ON storage.objects FOR SELECT
USING (bucket_id = 'chatgpt-widgets');

-- Allow admins to upload/update widgets
CREATE POLICY "Admins can upload widgets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chatgpt-widgets' AND
  is_admin(auth.uid())
);

CREATE POLICY "Admins can update widgets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'chatgpt-widgets' AND
  is_admin(auth.uid())
);

CREATE POLICY "Admins can delete widgets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chatgpt-widgets' AND
  is_admin(auth.uid())
);