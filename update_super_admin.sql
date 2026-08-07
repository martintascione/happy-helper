-- Update roles to include super_admin if not already there
-- We need to check if 'super_admin' exists in app_role enum
-- Actually, the context summary says 'vecino' | 'admin' | 'super_admin' was implemented.

UPDATE public.profiles
SET role = 'super_admin', status = 'aprobado'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'tascione32@gmail.com'
);

-- Grant select on user_roles just in case, though the system uses profiles.role usually
-- Based on the context summary, roles are in the profiles table.
