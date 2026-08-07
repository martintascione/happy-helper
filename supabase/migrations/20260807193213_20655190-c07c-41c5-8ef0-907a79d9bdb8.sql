-- Restrict execution of has_role to only the service_role
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon;

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO service_role;
-- We need to keep it executable by authenticated if we use it in RLS policies 
-- that run in the context of authenticated users, but it's a SECURITY DEFINER 
-- so we should be careful. Actually, RLS policies for authenticated users 
-- will need to execute this.
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
