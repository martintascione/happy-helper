UPDATE public.profiles
SET role = 'super_admin', status = 'aprobado'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'tascione32@gmail.com'
);