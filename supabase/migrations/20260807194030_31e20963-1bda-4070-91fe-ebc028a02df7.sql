-- Create parking_spots table
CREATE TABLE public.parking_spots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    identifier TEXT NOT NULL,
    description TEXT,
    price_per_day NUMERIC(10, 2) NOT NULL CHECK (price_per_day > 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grant access to parking_spots
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_spots TO authenticated;
GRANT ALL ON public.parking_spots TO service_role;

-- Enable RLS on parking_spots
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;

-- Policies for parking_spots
CREATE POLICY "Users can view parking spots in their building"
    ON public.parking_spots FOR SELECT
    TO authenticated
    USING (
        building_id IN (
            SELECT building_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own parking spots"
    ON public.parking_spots FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Create parking_availability table
CREATE TABLE public.parking_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);

-- Grant access to parking_availability
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_availability TO authenticated;
GRANT ALL ON public.parking_availability TO service_role;

-- Enable RLS on parking_availability
ALTER TABLE public.parking_availability ENABLE ROW LEVEL SECURITY;

-- Policies for parking_availability
CREATE POLICY "Users can view availability of spots in their building"
    ON public.parking_availability FOR SELECT
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

CREATE POLICY "Users can manage availability of their own spots"
    ON public.parking_availability FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.parking_spots ps
            WHERE ps.id = spot_id
            AND ps.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.parking_spots ps
            WHERE ps.id = spot_id
            AND ps.owner_id = auth.uid()
        )
    );

-- Trigger function for overlap validation
CREATE OR REPLACE FUNCTION public.check_parking_availability_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.parking_availability
        WHERE spot_id = NEW.spot_id
        AND id <> NEW.id
        AND (
            (NEW.start_date >= start_date AND NEW.start_date <= end_date) OR
            (NEW.end_date >= start_date AND NEW.end_date <= end_date) OR
            (NEW.start_date <= start_date AND NEW.end_date >= end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Overlap detected for parking spot availability.';
    END IF;

    IF NEW.start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'Cannot create availability for past dates.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parking_availability_overlap_trigger
BEFORE INSERT OR UPDATE ON public.parking_availability
FOR EACH ROW EXECUTE FUNCTION public.check_parking_availability_overlap();
