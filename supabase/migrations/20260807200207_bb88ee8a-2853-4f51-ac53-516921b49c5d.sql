-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.buildings(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('directa', 'general')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversation members table
CREATE TABLE public.conversation_members (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT ON public.messages TO authenticated;

GRANT ALL ON public.conversations TO service_role;
GRANT ALL ON public.conversation_members TO service_role;
GRANT ALL ON public.messages TO service_role;

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Conversations: Only members can see them
CREATE POLICY "Members can see conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = conversations.id
    AND user_id = auth.uid()
  ) OR type = 'general'
);

-- Members: Only members can see who else is in the conversation
CREATE POLICY "Members can see other members"
ON public.conversation_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members AS internal
    WHERE internal.conversation_id = conversation_members.conversation_id
    AND internal.user_id = auth.uid()
  )
);

-- Messages: Only members of the conversation can see messages
CREATE POLICY "Members can read messages"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can insert messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_members
    WHERE conversation_id = messages.conversation_id
    AND user_id = auth.uid()
  )
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Trigger to create/join general channel for new approved neighbors
CREATE OR REPLACE FUNCTION public.handle_general_channel_join()
RETURNS TRIGGER AS $$
DECLARE
    gen_conv_id UUID;
BEGIN
    -- Only for approved neighbors
    IF NEW.status = 'aprobado' AND (OLD.status IS NULL OR OLD.status != 'aprobado') THEN
        -- Find or create general conversation for this building
        SELECT id INTO gen_conv_id FROM public.conversations 
        WHERE building_id = NEW.building_id AND type = 'general' LIMIT 1;
        
        IF gen_conv_id IS NULL THEN
            INSERT INTO public.conversations (building_id, type)
            VALUES (NEW.building_id, 'general')
            RETURNING id INTO gen_conv_id;
        END IF;
        
        -- Add user to the general conversation
        INSERT INTO public.conversation_members (conversation_id, user_id)
        VALUES (gen_conv_id, NEW.id)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_join_general_channel
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_general_channel_join();
