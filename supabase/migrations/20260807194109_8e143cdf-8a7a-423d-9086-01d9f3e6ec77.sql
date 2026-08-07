-- Fix security warning for check_parking_availability_overlap
REVOKE EXECUTE ON FUNCTION public.check_parking_availability_overlap() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_parking_availability_overlap() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_parking_availability_overlap() TO service_role;

-- Fix search path for functions
ALTER FUNCTION public.check_parking_availability_overlap() SET search_path = public;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
