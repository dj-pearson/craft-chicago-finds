-- Bootstrap: grant admin role to the specified user if not present
-- Replace with your user id if needed
DO $$
DECLARE
  target_user uuid := 'cc51f69b-b5b6-4916-869c-1c594af9b34d';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user AND role = 'admin'::app_role AND is_active = true
  ) THEN
    INSERT INTO public.user_roles (user_id, role, is_active)
    VALUES (target_user, 'admin'::app_role, true);
  END IF;
END $$;