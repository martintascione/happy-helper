-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('vecino', 'admin', 'super_admin');

-- 2. Create tables
CREATE TABLE public.buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
    floor TEXT NOT NULL,
    apartment TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role public.app_role DEFAULT 'vecino' NOT NULL,
    avatar_url TEXT,
    status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Grant Data API access (REQUIRED for Supabase Data API)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buildings TO authenticated;
GRANT ALL ON public.buildings TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.units TO authenticated;
GRANT ALL ON public.units TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 4. Enable Row Level Security
ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Create Security Definer Function for role check
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- 6. RLS Policies

-- Buildings: Everyone in building can see their building, admins can manage
CREATE POLICY "Users can see their own building"
ON public.buildings
FOR SELECT
TO authenticated
USING (
    id IN (SELECT building_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage buildings"
ON public.buildings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Units: Everyone in building can see units of that building
CREATE POLICY "Users can see units in their building"
ON public.units
FOR SELECT
TO authenticated
USING (
    building_id IN (SELECT building_id FROM public.profiles WHERE id = auth.uid())
);

-- Profiles: Users can see profiles in their building, but only edit their own
CREATE POLICY "Users can see profiles in their building"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    building_id IN (SELECT building_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their building"
ON public.profiles
FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), 'admin') AND 
    building_id IN (SELECT building_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
    public.has_role(auth.uid(), 'admin') AND 
    building_id IN (SELECT building_id FROM public.profiles WHERE id = auth.uid())
);

-- Initial profiles insert: allow anyone to insert their own profile during signup
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- 7. Seed Data
INSERT INTO public.buildings (name, address, invite_code)
VALUES ('Torre Libertador 1500', 'Av. del Libertador 1500, Buenos Aires', 'TORRE2026')
ON CONFLICT (invite_code) DO NOTHING;

DO $$
DECLARE
    libertador_id UUID;
BEGIN
    SELECT id INTO libertador_id FROM public.buildings WHERE invite_code = 'TORRE2026';
    
    IF libertador_id IS NOT NULL THEN
        -- Seed Units if they don't exist
        IF NOT EXISTS (SELECT 1 FROM public.units WHERE building_id = libertador_id) THEN
            INSERT INTO public.units (building_id, floor, apartment) VALUES 
                (libertador_id, '1', 'A'),
                (libertador_id, '1', 'B'),
                (libertador_id, '2', 'A'),
                (libertador_id, '2', 'B'),
                (libertador_id, '3', 'A');
        END IF;
    END IF;
END $$;
