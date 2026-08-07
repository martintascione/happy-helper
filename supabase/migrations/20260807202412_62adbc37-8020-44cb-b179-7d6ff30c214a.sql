INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'
FROM auth.users
WHERE email = 'tascione32@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update the profile status just in case
UPDATE public.profiles
SET status = 'aprobado', role = 'super_admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'tascione32@gmail.com');