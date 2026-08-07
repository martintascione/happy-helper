import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, Search, User, Hash, Clock, ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    initChat();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      const channel = supabase
        .channel(`chat:${selectedConversation.id}`)
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
      const convs = await Promise.all(membersData.map(async (m: any) => {
        const conv = m.conversation;
        
        // Get last message
        const { data: lastMsg } = await supabase
          .from("messages" as any)
          .select("body, created_at")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Get other member if direct
        let otherMember = null;
        if (conv.type === 'directa') {
          const { data: memberData } = await supabase
            .from("conversation_members" as any)
            .select(`
              user:profiles!user_id (
                id,
                full_name,
                avatar_url
              )
            `)
            .eq("conversation_id", conv.id)
            .neq("user_id", user.id)
            .single();
          otherMember = memberData?.user;
        }

        return {
          ...conv,
          lastMessage: lastMsg,
          otherMember
        };
      }));

      // Sort by last message time
      convs.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || a.created_at;
        const timeB = b.lastMessage?.created_at || b.created_at;
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setConversations(convs);
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
      <div className="flex flex-col h-[calc(100vh-80px)] bg-white max-w-2xl mx-auto overflow-hidden">
        {/* Chat Header */}
        <header className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white sticky top-0 z-10">
          <button 
            onClick={() => setSelectedConversation(null)}
            className="p-2 hover:bg-slate-50 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
              {selectedConversation.type === 'general' ? (
                <Hash size={20} className="text-pink-500" />
              ) : selectedConversation.otherMember?.avatar_url ? (
                <img src={selectedConversation.otherMember.avatar_url} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </div>
            <div>
              <h3 className="font-black text-slate-900 leading-none">
                {selectedConversation.type === 'general' ? 'Canal General' : selectedConversation.otherMember?.full_name}
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {selectedConversation.type === 'general' ? 'Toda la comunidad' : 'Chat privado'}
              </p>
            </div>
          </div>
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isMine = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-[1.5rem] shadow-sm ${
                  isMine ? 'bg-black text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  <p className="text-sm font-medium leading-relaxed">{msg.body}</p>
                  <p className={`text-[9px] mt-1 font-bold uppercase tracking-tighter ${isMine ? 'text-white/50' : 'text-slate-400'}`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribí un mensaje..."
            className="flex-1 bg-slate-50 border-none rounded-2xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-black outline-none transition-all"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/10 active:scale-90 disabled:opacity-30 transition-all"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <header className="px-1 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chat</h1>
          <p className="text-slate-500 font-medium">Conversá con tus vecinos</p>
        </div>
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
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tus chats</h2>
        
        {conversations.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-4 shadow-soft">
            <div className="w-16 h-16 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-200 mx-auto">
              <MessageCircle size={32} />
            </div>
            <div>
              <p className="text-slate-500 font-bold">No tenés chats todavía</p>
              <p className="text-xs text-slate-400 font-medium">Saludá a tus vecinos en el canal general.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className="w-full bg-white p-4 rounded-[2rem] shadow-soft border border-transparent hover:border-slate-100 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 relative">
                  {conv.type === 'general' ? (
                    <div className="w-full h-full bg-pink-50 rounded-2xl flex items-center justify-center text-pink-400">
                      <Hash size={24} />
                    </div>
                  ) : conv.otherMember?.avatar_url ? (
                    <img src={conv.otherMember.avatar_url} className="w-full h-full rounded-2xl object-cover" />
                  ) : (
                    <User size={24} />
                  )}
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-black text-slate-900 truncate">
                      {conv.type === 'general' ? 'Canal General' : conv.otherMember?.full_name}
                    </h3>
                    {conv.lastMessage && (
                      <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 shrink-0 uppercase">
                        <Clock size={8} /> {format(new Date(conv.lastMessage.created_at), 'HH:mm')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {conv.lastMessage?.body || "Iniciá la conversación..."}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}