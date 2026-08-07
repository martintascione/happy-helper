-- Create parking_bookings table
CREATE TABLE public.parking_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spot_id UUID NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'confirmada', 'en_curso', 'finalizada', 'cancelada')),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_booking_range CHECK (start_date <= end_date)
);

-- Grant access to parking_bookings
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_bookings TO authenticated;
GRANT ALL ON public.parking_bookings TO service_role;

-- Enable RLS on parking_bookings
ALTER TABLE public.parking_bookings ENABLE ROW LEVEL SECURITY;

-- Policies for parking_bookings
CREATE POLICY "Users can view bookings for their own spots"
    ON public.parking_bookings FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.parking_spots ps
            WHERE ps.id = spot_id
            AND ps.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own bookings"
    ON public.parking_bookings FOR SELECT
    TO authenticated
    USING (renter_id = auth.uid());

CREATE POLICY "Users can create bookings"
    ON public.parking_bookings FOR INSERT
    TO authenticated
    WITH CHECK (
        renter_id = auth.uid() AND
        NOT EXISTS (
            SELECT 1 FROM public.parking_spots ps
            WHERE ps.id = spot_id
            AND ps.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own bookings"
    ON public.parking_bookings FOR UPDATE
    TO authenticated
    USING (renter_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.parking_spots ps
        WHERE ps.id = spot_id
        AND ps.owner_id = auth.uid()
    ));

-- Trigger function for booking overlap validation and availability check
CREATE OR REPLACE FUNCTION public.check_parking_booking_validity()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Check if the spot is available in the requested range
    IF NOT EXISTS (
        SELECT 1 FROM public.parking_availability
        WHERE spot_id = NEW.spot_id
        AND start_date <= NEW.start_date
        AND end_date >= NEW.end_date
    ) THEN
        RAISE EXCEPTION 'La cochera no está disponible en el rango seleccionado.';
    END IF;

    -- 2. Check for overlapping CONFIRMED or SOLICITADA bookings
    IF EXISTS (
        SELECT 1 FROM public.parking_bookings
        WHERE spot_id = NEW.spot_id
        AND id <> NEW.id
        AND status IN ('solicitada', 'confirmada', 'en_curso')
        AND (
            (NEW.start_date >= start_date AND NEW.start_date <= end_date) OR
            (NEW.end_date >= start_date AND NEW.end_date <= end_date) OR
            (NEW.start_date <= start_date AND NEW.end_date >= end_date)
        )
    ) THEN
        RAISE EXCEPTION 'Ya existe una reserva para estas fechas.';
    END IF;

    -- 3. Check if renter is the owner
    IF EXISTS (
        SELECT 1 FROM public.parking_spots
        WHERE id = NEW.spot_id
        AND owner_id = NEW.renter_id
    ) THEN
        RAISE EXCEPTION 'No podés reservar tu propia cochera.';
    END IF;

    -- 4. Check if start_date is in the past (only for new bookings)
    IF TG_OP = 'INSERT' AND NEW.start_date < CURRENT_DATE THEN
        RAISE EXCEPTION 'No se pueden realizar reservas para fechas pasadas.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parking_booking_validity_trigger
BEFORE INSERT OR UPDATE ON public.parking_bookings
FOR EACH ROW EXECUTE FUNCTION public.check_parking_booking_validity();

-- Revoke execute from public to address security warning
REVOKE EXECUTE ON FUNCTION public.check_parking_booking_validity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_parking_booking_validity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_parking_booking_validity() TO service_role;
ALTER FUNCTION public.check_parking_booking_validity() SET search_path = public;
