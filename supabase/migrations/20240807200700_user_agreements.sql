CREATE TABLE public.user_agreements (
    id uuid CHARACTER VARYING DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agreement_key text NOT NULL,
    version integer NOT NULL DEFAULT 1,
    accepted_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(user_id, agreement_key, version)
);

GRANT SELECT, INSERT ON public.user_agreements TO authenticated;
GRANT ALL ON public.user_agreements TO service_role;

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own agreements"
    ON public.user_agreements
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agreements"
    ON public.user_agreements
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all agreements"
    ON public.user_agreements
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
