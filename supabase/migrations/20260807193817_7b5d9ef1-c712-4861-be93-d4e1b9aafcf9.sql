-- First, check if the type already exists to avoid errors
DO '
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''post_type'') THEN
        CREATE TYPE public.post_type AS ENUM (''oficial'', ''vecinal'');
    END IF;
END
';

CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type public.post_type NOT NULL DEFAULT 'vecinal',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    UNIQUE (post_id, user_id, emoji)
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;

-- RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- Policies for Posts
CREATE POLICY "Users can select posts in their building"
ON public.posts FOR SELECT TO authenticated
USING (building_id = (SELECT building_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert posts in their building"
ON public.posts FOR INSERT TO authenticated
WITH CHECK (
    building_id = (SELECT building_id FROM public.profiles WHERE id = auth.uid()) AND
    (
        type = 'vecinal' OR 
        public.has_role(auth.uid(), 'admin') OR 
        public.has_role(auth.uid(), 'super_admin')
    )
);

CREATE POLICY "Authors and admins can update their posts"
ON public.posts FOR UPDATE TO authenticated
USING (
    author_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Authors and admins can delete their posts"
ON public.posts FOR DELETE TO authenticated
USING (
    author_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

-- Policies for Comments
CREATE POLICY "Users can select comments in their building"
ON public.comments FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.posts p 
        JOIN public.profiles pr ON pr.building_id = p.building_id
        WHERE p.id = post_id AND pr.id = auth.uid()
    )
);

CREATE POLICY "Users can insert comments in their building"
ON public.comments FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts p 
        JOIN public.profiles pr ON pr.building_id = p.building_id
        WHERE p.id = post_id AND pr.id = auth.uid()
    )
);

CREATE POLICY "Authors and admins can delete comments"
ON public.comments FOR DELETE TO authenticated
USING (
    author_id = auth.uid() OR 
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
);

-- Policies for Reactions
CREATE POLICY "Users can manage their own reactions"
ON public.reactions FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Storage Policies
DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'post-images');

DROP POLICY IF EXISTS "Authors can delete their post images" ON storage.objects;
CREATE POLICY "Authors can delete their post images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'post-images' AND (auth.uid() = owner));
