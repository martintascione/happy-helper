-- Reviewing all tables for building_id filter
-- posts: verified (has building_id)
-- parking_spots: verified (has building_id)
-- units: verified (has building_id)
-- profiles: verified (has building_id)
-- parking_bookings: Needs verification. It references parking_spots.
-- comments/reactions: reference posts (which have building_id).

-- Enhancing RLS for parking_bookings to be strictly building-bound
DROP POLICY IF EXISTS "Users can view bookings for their own spots" ON public.parking_bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.parking_bookings;

CREATE POLICY "Users can view relevant bookings in their building"
ON public.parking_bookings FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parking_spots ps
        WHERE ps.id = spot_id
        AND ps.building_id IN (
            SELECT building_id FROM public.profiles WHERE id = auth.uid()
        )
    )
);

-- Ensure profiles are strictly building-bound for reading other neighbors
DROP POLICY IF EXISTS "Neighbors can view profiles in their building" ON public.profiles;
CREATE POLICY "Neighbors can view profiles in their building"
ON public.profiles FOR SELECT
TO authenticated
USING (
    building_id IN (
        SELECT p.building_id FROM public.profiles p WHERE p.id = auth.uid()
    )
);

-- Ensure all functions are search_path safe
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;
ALTER FUNCTION public.check_parking_availability_overlap() SET search_path = public;
ALTER FUNCTION public.check_parking_booking_validity() SET search_path = public;
