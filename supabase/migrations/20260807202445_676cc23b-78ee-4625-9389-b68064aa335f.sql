-- Ensure at least one building exists
INSERT INTO public.buildings (name, address, invite_code)
SELECT 'Edificio Central', 'Av. del Libertador 1000', 'TOWER123'
WHERE NOT EXISTS (SELECT 1 FROM public.buildings LIMIT 1);

-- Ensure at least one unit exists for the first building
INSERT INTO public.units (building_id, floor, apartment)
SELECT id, '1', 'A'
FROM public.buildings
WHERE NOT EXISTS (SELECT 1 FROM public.units LIMIT 1)
LIMIT 1;

-- Grant permissions on these tables to authenticated just in case
GRANT SELECT ON public.buildings TO authenticated;
GRANT SELECT ON public.units TO authenticated;
