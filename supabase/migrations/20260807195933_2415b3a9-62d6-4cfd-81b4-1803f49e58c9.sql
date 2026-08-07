-- Create payouts table
CREATE TABLE public.parking_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.parking_bookings(id) ON DELETE CASCADE NOT NULL,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
    paid_at TIMESTAMPTZ,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE ON public.parking_payouts TO authenticated;
GRANT ALL ON public.parking_payouts TO service_role;

-- Enable RLS
ALTER TABLE public.parking_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Owners can see their payouts"
ON public.parking_payouts FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Super admins can see all payouts"
ON public.parking_payouts FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Trigger to auto-create payout when booking is finalized
CREATE OR REPLACE FUNCTION public.on_booking_status_change_payout()
RETURNS TRIGGER AS $$
BEGIN
    -- When booking becomes 'finalizada' and was 'confirmada'
    IF NEW.status = 'finalizada' AND OLD.status = 'confirmada' THEN
        INSERT INTO public.parking_payouts (booking_id, owner_id, amount)
        VALUES (NEW.id, NEW.owner_id, NEW.owner_amount);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_payout
AFTER UPDATE ON public.parking_bookings
FOR EACH ROW
EXECUTE FUNCTION public.on_booking_status_change_payout();

-- Function to update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at_payouts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payouts_updated_at
BEFORE UPDATE ON public.parking_payouts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at_payouts();
