-- First, check if the building and unit exist to link the profile
DO $$
DECLARE
    v_building_id uuid;
    v_unit_id uuid;
    v_user_id uuid;
BEGIN
    -- Get user id
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'tascione32@gmail.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Get any building and unit as fallback
        SELECT id INTO v_building_id FROM public.buildings LIMIT 1;
        SELECT id INTO v_unit_id FROM public.units LIMIT 1;

        -- Upsert profile for the super admin
        INSERT INTO public.profiles (id, full_name, role, status, building_id, unit_id)
        VALUES (v_user_id, 'Super Admin', 'super_admin', 'aprobado', v_building_id, v_unit_id)
        ON CONFLICT (id) DO UPDATE 
        SET role = 'super_admin', status = 'aprobado', 
            building_id = COALESCE(profiles.building_id, EXCLUDED.building_id),
            unit_id = COALESCE(profiles.unit_id, EXCLUDED.unit_id);
    END IF;
END $$;