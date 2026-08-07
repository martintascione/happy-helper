-- 1. Insert building
INSERT INTO public.buildings (name, address, invite_code)
VALUES ('Edificio Moldes 850', 'Moldes 850', 'MOLDES850')
ON CONFLICT (invite_code) DO UPDATE SET name = EXCLUDED.name, address = EXCLUDED.address
RETURNING id;

-- 2. Insert unit (we'll need the building ID from step 1, but I can use a subquery if I do it in one turn or just do it separately)
INSERT INTO public.units (building_id, floor, apartment)
SELECT id, '1', 'A' FROM public.buildings WHERE invite_code = 'MOLDES850'
ON CONFLICT DO NOTHING;

-- 3. Update super admin profile
UPDATE public.profiles 
SET 
    building_id = (SELECT id FROM public.buildings WHERE invite_code = 'MOLDES850'),
    unit_id = (SELECT u.id FROM public.units u JOIN public.buildings b ON u.building_id = b.id WHERE b.invite_code = 'MOLDES850' LIMIT 1),
    status = 'aprobado',
    role = 'super_admin'
WHERE id = '46dc48e4-8821-4de1-9ea4-d7141f7bafa9';
