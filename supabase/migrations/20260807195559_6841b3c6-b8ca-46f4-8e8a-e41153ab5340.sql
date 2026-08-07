-- Create payments table
CREATE TABLE public.parking_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES public.parking_bookings(id) ON DELETE CASCADE NOT NULL,
    method text NOT NULL CHECK (method IN ('transferencia', 'mercadopago')),
    amount numeric NOT NULL,
    receipt_url text,
    mp_preference_id text,
    mp_payment_id text,
    status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_revision', 'aprobado', 'rechazado')),
    reject_reason text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Ensure only one approved payment per booking
CREATE UNIQUE INDEX unique_approved_payment_per_booking ON public.parking_payments (booking_id) WHERE status = 'aprobado';

GRANT SELECT, INSERT, UPDATE ON public.parking_payments TO authenticated;
GRANT ALL ON public.parking_payments TO service_role;

ALTER TABLE public.parking_payments ENABLE ROW LEVEL SECURITY;

-- RLS: Renter can see their own payments, Owner can see payments for their spots, SuperAdmin sees all
CREATE POLICY "Users can see relevant payments" ON public.parking_payments
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parking_bookings b
        JOIN public.parking_spots s ON b.spot_id = s.id
        WHERE b.id = parking_payments.booking_id
        AND (b.renter_id = auth.uid() OR s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'))
    )
);

CREATE POLICY "Renters can create payments" ON public.parking_payments
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.parking_bookings b
        WHERE b.id = booking_id AND b.renter_id = auth.uid()
    )
);

CREATE POLICY "Renters can update their pending payments" ON public.parking_payments
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parking_bookings b
        WHERE b.id = booking_id AND b.renter_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.parking_bookings b
        WHERE b.id = booking_id AND b.renter_id = auth.uid()
    )
);

-- Update bookings status logic if needed (handled in app logic usually, but let's add a trigger for MP auto-confirm)
CREATE OR REPLACE FUNCTION public.on_payment_status_change()
RETURNS trigger AS $$
BEGIN
    IF NEW.status = 'aprobado' THEN
        UPDATE public.parking_bookings SET status = 'confirmada' WHERE id = NEW.booking_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_payment_status_change
AFTER UPDATE OF status ON public.parking_payments
FOR EACH ROW
EXECUTE FUNCTION public.on_payment_status_change();
