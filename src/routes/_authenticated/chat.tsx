import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Search, User, Hash, Clock, ArrowLeft, ShieldAlert, Shield, X } from "lucide-react";
import { InfoBanner } from "@/components/InfoBanner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSecurityWarning, setShowSecurityWarning] = useState(true);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);
  const { startDirect } = Route.useSearch() as { startDirect?: string };
  const navigate = useNavigate();

  useEffect(() => {
    initChat();
  }, [startDirect]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channelId = `chat:${selectedConversation.id}-${Math.random().toString(36).substring(2, 9)}`;
      const channel = supabase.channel(channelId);
      
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${selectedConversation.id}`
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
    return () => {};
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function initChat() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Get building_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("building_id")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    // If startDirect is present, check/create direct conversation
    if (startDirect && startDirect !== user.id) {
      // Find if conversation exists
      const { data: existingMembers } = await supabase
        .from("conversation_members" as any)
        .select("conversation_id")
        .eq("user_id", user.id);

      const convIds = (existingMembers || []).map((m: any) => m.conversation_id);

      if (convIds.length > 0) {
        const { data: commonConv } = await supabase
          .from("conversation_members" as any)
          .select("conversation_id")
          .eq("user_id", startDirect)
          .in("conversation_id", convIds)
          .maybeSingle();

        if (commonConv) {
          // Check if it's "directa"
          const { data: convData } = await supabase
            .from("conversations" as any)
            .select("type")
            .eq("id", (commonConv as any).conversation_id)
            .single();
          
          if ((convData as any)?.type === 'directa') {
            // It exists, we'll select it later
          }
        } else {
          // Create new direct conversation
          const { data: newConv } = await supabase
            .from("conversations" as any)
            .insert({ building_id: profile.building_id, type: 'directa' })
            .select()
            .single();

          if (newConv) {
            await supabase
              .from("conversation_members" as any)
              .insert([
                { conversation_id: (newConv as any).id, user_id: user.id },
                { conversation_id: (newConv as any).id, user_id: startDirect }
              ]);
          }
        }
      } else {
        // Create new direct conversation (first one)
        const { data: newConv } = await supabase
          .from("conversations" as any)
          .insert({ building_id: profile.building_id, type: 'directa' })
          .select()
          .single();

        if (newConv) {
          await supabase
            .from("conversation_members" as any)
            .insert([
              { conversation_id: (newConv as any).id, user_id: user.id },
              { conversation_id: (newConv as any).id, user_id: startDirect }
            ]);
        }
      }
      
      // Clear search param to avoid re-creation
      navigate({ to: "/_authenticated/chat", search: {} as any, replace: true });
    }

    // Fetch conversations
    const { data: membersData } = await supabase
      .from("conversation_members" as any)
      .select(`
        conversation_id,
        conversation:conversations (
          id,
          type,
          building_id
        )
      `)
      .eq("user_id", user.id);

    if (membersData) {
      const convs = await Promise.all((membersData as any[]).map(async (m: any) => {
        const conv = m.conversation;
        if (!conv) return null;
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages" as any)
          .select("body, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get other member if direct
        let otherMember = null;
        if (conv.type === 'directa') {
          const { data: memberData } = await supabase
            .from("conversation_members" as any)
            .select(`
              user:profiles!conversation_members_user_id_fkey (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id)
            .maybeSingle();
          otherMember = (memberData as any)?.user;
        }

        return {
          ...conv,
          lastMessage: lastMsg,
          otherMember
        };
      }));

      const filteredConvs = convs.filter(c => c !== null);

      // Sort by last message time
      filteredConvs.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || a.created_at;
        const timeB = b.lastMessage?.created_at || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setConversations(filteredConvs);
    }
    setLoading(false);
  }

  async function fetchMessages(conversationId: string) {
    const { data } = await supabase
      .from("messages" as any)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    
    if (data) setMessages(data);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const messageBody = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase
      .from("messages" as any)
      .insert({
        conversation_id: selectedConversation.id,
        sender_id: currentUserId,
        body: messageBody
      });

    if (error) {
      console.error("Error sending message:", error);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center animate-pulse">
        <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-4" />
        <p className="text-slate-400 font-bold">Abriendo chats...</p>
      </div>
    );
  }

  if (selectedConversation) {
    return (
      <div className="flex flex-col h-[calc(100vh-80px)] bg-white max-w-2xl mx-auto overflow-hidden relative">
        {/* Chat Header */}
        <header className="p-6 border-b border-slate-50 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedConversation(null)}
              className="p-2 hover:bg-slate-50 rounded-full transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-900" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden">
                {selectedConversation.type === 'general' ? (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-900">
                    <Hash size={20} />
                  </div>
                ) : selectedConversation.otherMember?.avatar_url ? (
                  <img src={selectedConversation.otherMember.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-bold text-slate-900 leading-none flex items-center gap-2">
                  {selectedConversation.type === 'general' ? 'Canal General' : selectedConversation.otherMember?.full_name}
                  {selectedConversation.type === 'general' && (
                    <span className="px-2 py-0.5 bg-slate-100 text-[9px] font-bold text-slate-500 rounded-full uppercase tracking-wider">Edificio</span>
                  )}
                </h3>
                <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-widest">
                  {selectedConversation.type === 'general' ? 'Toda la comunidad' : 'Chat privado'}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowSecurityWarning(true)}
            className={`p-2.5 rounded-full transition-all ${showSecurityWarning ? 'bg-red-50 text-red-500' : 'text-slate-300 hover:text-slate-900'}`}
          >
            <Shield size={20} strokeWidth={2} />
          </button>
        </header>

        {/* Security Warning - Tint Error Compact */}
        {showSecurityWarning && (
          <div className="mx-6 mt-4 animate-in slide-in-from-top-2 duration-300">
            <div className="tint-error p-4 rounded-[20px] flex gap-3 relative border border-red-200/20">
              <div className="shrink-0 mt-0.5">
                <ShieldAlert size={16} className="text-red-600" />
              </div>
              <p className="text-xs font-medium leading-relaxed pr-6">
                No compartas contraseñas ni datos bancarios. Los pagos se hacen siempre dentro de la app.
              </p>
              <button 
                onClick={() => {
                  setShowSecurityWarning(false);
                  setHasSeenWarning(true);
                }} 
                className="absolute top-4 right-4 text-red-400 hover:text-red-600"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 no-scrollbar overflow-x-hidden">
          {messages.map((msg, idx) => {
            const isMine = msg.sender_id === currentUserId;
            const showTime = idx === messages.length - 1 || 
              new Date(messages[idx+1].created_at).getTime() - new Date(msg.created_at).getTime() > 300000;

            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-[22px] ${
                  isMine 
                    ? 'bg-black text-white shadow-xl shadow-black/5' 
                    : 'bg-white text-slate-900 shadow-[0_4px_15px_rgba(0,0,0,0.04)] border border-slate-50'
                }`}>
                  <p className="text-[15px] font-medium leading-relaxed">{msg.body}</p>
                </div>
                {showTime && (
                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter px-2">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Message Input */}
        <div className="p-6 bg-transparent pointer-events-none sticky bottom-0">
          <form onSubmit={sendMessage} className="bg-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 p-2 flex gap-2 pointer-events-auto items-center max-w-lg mx-auto">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribí un mensaje..."
              className="flex-1 bg-transparent border-none px-4 py-2 text-sm font-medium outline-none"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-11 h-11 bg-accent text-white rounded-full flex items-center justify-center shadow-lg shadow-accent/20 active:scale-90 disabled:opacity-30 transition-all shrink-0"
            >
              <Send size={18} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32 overflow-x-hidden">
      <header className="px-1 space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Chat</h1>
        <p className="text-slate-400 font-medium">Conversá con tus vecinos</p>
      </header>

      {/* Search/New Chat */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input 
          type="text" 
          placeholder="Buscar conversación..." 
          className="w-full bg-white border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium shadow-soft outline-none focus:border-slate-300 transition-all"
        />
      </div>

      {/* Conversations List */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tus chats</h2>
        
        {conversations.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border border-white text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-200">
              <MessageCircle size={32} />
            </div>
            <div>
              <p className="text-slate-500 font-bold">No tenés chats todavía</p>
              <p className="text-xs text-slate-400 font-medium">Saludá a tus vecinos en el canal general.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="w-full bg-white p-5 rounded-[24px] hover:bg-slate-50 flex items-center gap-4 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 relative overflow-hidden">
                  {conv.type === 'general' ? (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-900">
                      <Hash size={24} />
                    </div>
                  ) : conv.otherMember?.avatar_url ? (
                    <img src={conv.otherMember.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                  {/* Status Indicator Example - Dot for unread/active */}
                  {conv.type === 'general' && (
                    <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900 truncate flex items-center gap-2">
                      {conv.type === 'general' ? 'Canal General' : conv.otherMember?.full_name}
                      {conv.type === 'general' && (
                        <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-bold text-slate-400 rounded-full uppercase tracking-wider">Edificio</span>
                      )}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-[10px] font-medium text-slate-400 shrink-0">
                        {format(new Date(conv.lastMessage.created_at), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-slate-500 font-medium truncate pr-4">
                      {conv.lastMessage?.body || "Iniciá la conversación..."}
                    </p>
                    {/* Unread Dot Example */}
                    {Math.random() > 0.7 && (
                      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}