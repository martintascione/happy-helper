-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link_to TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated; -- Allow system triggers/functions to insert
GRANT ALL ON public.notifications TO service_role;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- 1. Helper function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    _user_id UUID,
    _type TEXT,
    _title TEXT,
    _body TEXT,
    _link_to TEXT
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link_to)
    VALUES (_user_id, _type, _title, _body, _link_to);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger for profile approval
CREATE OR REPLACE FUNCTION public.notify_on_profile_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'aprobado' AND (OLD.status IS NULL OR OLD.status != 'aprobado') THEN
        PERFORM public.create_notification(
            NEW.id,
            'perfil_aprobado',
            '¡Cuenta aprobada!',
            'Ya podés empezar a usar todas las funciones de Comunidad Tower.',
            '/_authenticated/muro'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_profile_approval
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_profile_approval();

-- 3. Trigger for parking bookings (requested, accepted, rejected, confirmed)
CREATE OR REPLACE FUNCTION public.notify_on_booking_change()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    renter_id UUID;
    spot_name TEXT;
BEGIN
    -- Get owner and spot info
    SELECT s.owner_id, s.identifier INTO owner_id, spot_name
    FROM public.parking_spots s
    WHERE s.id = NEW.spot_id;

    -- Case: New booking requested (Notify owner)
    IF TG_OP = 'INSERT' AND NEW.status = 'solicitada' THEN
        PERFORM public.create_notification(
            owner_id,
            'reserva_solicitada',
            'Nueva solicitud de reserva',
            'Alguien quiere reservar ' || spot_name || '.',
            '/_authenticated/cocheras'
        );
    END IF;

    -- Case: Status update (Notify renter)
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        IF NEW.status = 'confirmada' THEN
            PERFORM public.create_notification(
                NEW.renter_id,
                'reserva_confirmada',
                '¡Reserva confirmada!',
                'Tu pago para ' || spot_name || ' fue aprobado.',
                '/_authenticated/cocheras'
            );
        ELSIF NEW.status = 'aceptada' THEN
            PERFORM public.create_notification(
                NEW.renter_id,
                'reserva_aceptada',
                'Solicitud aceptada',
                'El dueño aceptó tu pedido para ' || spot_name || '. Ya podés pagar.',
                '/_authenticated/cocheras'
            );
        ELSIF NEW.status = 'rechazada' THEN
            PERFORM public.create_notification(
                NEW.renter_id,
                'reserva_rechazada',
                'Solicitud rechazada',
                'Lamentablemente, el dueño rechazó tu pedido para ' || spot_name || '.',
                '/_authenticated/cocheras'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_booking_change
AFTER INSERT OR UPDATE ON public.parking_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_booking_change();

-- 4. Trigger for payment review (receipt approved/rejected)
CREATE OR REPLACE FUNCTION public.notify_on_payment_review()
RETURNS TRIGGER AS $$
DECLARE
    renter_id UUID;
    booking_id UUID;
BEGIN
    IF OLD.status != NEW.status AND NEW.status IN ('aprobado', 'rechazado') THEN
        -- Get booking renter
        SELECT b.renter_id, b.id INTO renter_id, booking_id
        FROM public.parking_bookings b
        WHERE b.id = NEW.booking_id;

        IF NEW.status = 'aprobado' THEN
             PERFORM public.create_notification(
                renter_id,
                'pago_aprobado',
                'Pago aprobado',
                'Tu comprobante de transferencia fue validado exitosamente.',
                '/_authenticated/cocheras'
            );
        ELSE
            PERFORM public.create_notification(
                renter_id,
                'pago_rechazado',
                'Comprobante rechazado',
                'Tu comprobante fue rechazado. Motivo: ' || COALESCE(NEW.reject_reason, 'No especificado'),
                '/_authenticated/cocheras'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_payment_review
AFTER UPDATE ON public.parking_payments
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_payment_review();

-- 5. Trigger for payouts (paid)
CREATE OR REPLACE FUNCTION public.notify_on_payout_paid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pagado' AND OLD.status != 'pagado' THEN
        PERFORM public.create_notification(
            NEW.owner_id,
            'payout_liquidado',
            'Liquidación realizada',
            'Te enviamos el pago por una de tus cocheras. Revisá tus cobros.',
            '/_authenticated/cocheras'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_payout_paid
AFTER UPDATE ON public.parking_payouts
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_payout_paid();

-- 6. Trigger for official announcements (posts)
CREATE OR REPLACE FUNCTION public.notify_on_official_post()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.type = 'oficial' THEN
        -- Notify all approved users in the building
        INSERT INTO public.notifications (user_id, type, title, body, link_to)
        SELECT id, 'comunicado_oficial', 'Nuevo comunicado oficial', NEW.title, '/_authenticated/muro'
        FROM public.profiles
        WHERE building_id = NEW.building_id AND status = 'aprobado';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_official_post
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_official_post();
