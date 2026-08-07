import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, ArrowRight, MessageSquare, Car, AlertTriangle, X, Image as ImageIcon, Send, User, Bell, Heart, Shield, ShieldCheck } from "lucide-react";
import { InfoBanner } from "@/components/InfoBanner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/muro")({
  component: MuroPage,
});

interface MuroData {
  posts: any[];
  bookings: any[];
  loading: boolean;
}

function MuroPage() {
  const [data, setData] = useState<MuroData>({ posts: [], bookings: [], loading: true });
  const [neighborPosts, setNeighborPosts] = useState<any[]>([]);
  const { userRole, userId } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("building_id").eq("id", user.id).single();
    
    if (profile?.building_id) {
      const [officialRes, bookingsRes, neighborsRes] = await Promise.all([
        supabase
          .from("posts")
          .select("*, author:profiles!author_id(full_name)")
          .eq("building_id", profile.building_id)
          .eq("type", "oficial")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("parking_bookings")
          .select("*, spot:parking_spots(identifier)")
          .eq("renter_id", user.id)
          .eq("status", "confirmada")
          .gte("start_date", new Date().toISOString().split('T')[0])
          .order("start_date", { ascending: true })
          .limit(2),
        supabase
          .from("posts")
          .select("*, author:profiles!author_id(full_name, avatar_url, unit:units(floor, apartment))")
          .eq("building_id", profile.building_id)
          .eq("type", "vecinal")
          .order("created_at", { ascending: false })
      ]);

      setData({
        posts: officialRes.data || [],
        bookings: bookingsRes.data || [],
        loading: false
      });
      setNeighborPosts(neighborsRes.data || []);
    } else {
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  const [postType, setPostType] = useState<"vecinal" | "oficial">("vecinal");
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postTitle, setPostTitle] = useState("");

  const handleCreatePost = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !postContent) return;

    const { data: profile } = await supabase.from("profiles").select("building_id").eq("id", user.id).single();

    const { error } = await supabase.from("posts").insert({
      title: postTitle || (postType === 'oficial' ? 'Comunicado Oficial' : 'Aviso Vecinal'),
      body: postContent,
      author_id: user.id,
      building_id: profile?.building_id || '',
      type: postType
    });

    if (error) {
      toast.error("Error al publicar");
    } else {
      toast.success("Publicado correctamente");
      setIsComposerOpen(false);
      setPostContent("");
      setPostTitle("");
      fetchData();
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-12 pb-32 bg-background overflow-x-hidden relative">
      <header className="px-1">
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Comunidad</h1>
        <p className="text-muted-foreground font-medium text-lg">Edificio Libertador</p>
      </header>

      {/* Resumen */}
      <div className="space-y-4">
        <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-1 opacity-60">Tu resumen</h2>
        
        {data.loading ? (
          <div className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />
        ) : data.bookings.length > 0 ? (
          <div className="premium-card p-10 bg-primary text-primary-foreground shadow-premium relative group active:scale-[0.99] transition-all">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-[90px] group-hover:scale-125 transition-transform duration-1000" />
            <div className="flex flex-col gap-6 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[10px] font-bold text-white uppercase tracking-[0.15em]">Próxima cochera</span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold tracking-tight uppercase">{data.bookings[0].spot?.identifier}</p>
                <div className="flex items-center gap-2 text-white/50">
                  <Calendar size={16} />
                  <p className="text-sm font-bold uppercase tracking-widest">
                    {format(new Date(data.bookings[0].start_date), "d 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => navigate({ to: "/_authenticated/cocheras" } as any)}
            className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-soft hover:border-slate-200 active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <Car size={24} />
              </div>
              <div>
                <p className="font-black text-slate-800">Sin reservas próximas</p>
                <p className="text-xs font-medium text-slate-400">¡Alquilá una cochera ahora!</p>
              </div>
            </div>
            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center">
              <ArrowRight size={20} />
            </div>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <button 
          onClick={() => navigate({ to: "/_authenticated/cocheras" } as any)}
          className="premium-card p-8 flex flex-col items-center gap-4 bg-white active:scale-95 transition-all shadow-subtle border border-black/[0.02]"
        >
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center shadow-inner-glow">
            <Car size={28} strokeWidth={2.5} className="text-primary" />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-foreground">Cocheras</span>
        </button>
        <button 
          onClick={() => navigate({ to: "/_authenticated/chat" } as any)}
          className="premium-card p-8 flex flex-col items-center gap-4 bg-white active:scale-95 transition-all shadow-subtle border border-black/[0.02]"
        >
          <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center shadow-inner-glow">
            <MessageSquare size={28} strokeWidth={2.5} className="text-primary" />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-foreground">Chat</span>
        </button>
      </div>

      {/* Comunicados Oficiales */}
      <div className="space-y-4">
        {data.posts.length > 0 ? data.posts.map((post) => (
          <div key={post.id} className="premium-card p-10 bg-white space-y-8 relative overflow-hidden group shadow-subtle border-black/[0.03]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tint-insight/40 rounded-full blur-[60px]" />
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center text-primary shadow-inner-glow">
                  <Bell size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-foreground uppercase tracking-[0.2em] block">Comunicado Oficial</span>
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                    {format(new Date(post.created_at), "d MMM", { locale: es })}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              <h3 className="font-bold text-3xl text-foreground tracking-tight leading-[1.1]">{post.title}</h3>
              <p className="text-[17px] text-muted-foreground font-medium leading-relaxed">{post.body}</p>
            </div>
            {post.author && (
              <div className="flex justify-between items-center pt-6 relative z-10 border-t border-black/[0.03]">
                <p className="text-[12px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={16} className="text-accent" /> {post.author.full_name}
                </p>
                <div className="px-4 py-1.5 bg-accent/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-accent border border-accent/10">
                  Prioridad
                </div>
              </div>
            )}
          </div>
        )) : (
          <div className="tint-insight card-dashed p-8 rounded-[2.8rem] text-center border-dashed">
            <p className="text-violet-600 font-black uppercase tracking-widest text-xs">Sin comunicados nuevos</p>
          </div>
        )}
      </div>

      {/* Muro Vecinal */}
      <div className="space-y-6">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Comunidad</h2>
        
        {neighborPosts.length > 0 ? (
          neighborPosts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100">
                  {post.author?.avatar_url ? (
                    <img src={post.author.avatar_url} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-slate-300" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 leading-none">{post.author?.full_name}</h4>
                  <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                    Piso {post.author?.unit?.floor || '-'} • {post.author?.unit?.apartment || '-'}
                  </p>
                </div>
                <span className="ml-auto text-[10px] font-medium text-slate-300">
                  {format(new Date(post.created_at), "HH:mm", { locale: es })}
                </span>
              </div>
              
              <div className="space-y-3">
                <p className="text-[15px] text-slate-700 leading-relaxed font-medium">{post.body}</p>
                {post.image_url && (
                  <div className="rounded-[20px] overflow-hidden border border-slate-50 shadow-sm">
                    <img src={post.image_url} className="w-full h-auto" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                  <Heart size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2</span>
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                  <MessageSquare size={14} className="text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Comentar</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-12 rounded-[24px] border border-white text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto">
              <MessageSquare size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 font-bold">No hay avisos vecinales</p>
              <p className="text-xs font-medium text-slate-300">Sé el primero en compartir algo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-28 right-6 z-[60]">
        <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
          <DialogTrigger asChild>
            <button className="w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform">
              <Plus size={28} strokeWidth={2.5} />
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-t-[28px] rounded-b-none border-none sm:max-w-[425px] p-8 top-auto bottom-0 translate-y-0 duration-300">
            <div className="space-y-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold tracking-tight text-slate-900">Nueva publicación</h3>
                  <button onClick={() => setIsComposerOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPostType("vecinal")}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                      postType === "vecinal" ? "bg-black text-white" : "bg-slate-50 text-slate-400"
                    }`}
                  >
                    Aviso vecinal
                  </button>
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <button 
                      onClick={() => setPostType("oficial")}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                        postType === "oficial" ? "bg-black text-white" : "bg-slate-50 text-slate-400"
                      }`}
                    >
                      Comunicado oficial
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {postType === 'oficial' && (
                  <input
                    placeholder="Título del comunicado"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full text-lg font-bold placeholder:text-slate-300 outline-none"
                  />
                )}
                <textarea
                  placeholder="¿Qué querés compartir con tus vecinos?"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  className="w-full min-h-[160px] text-[17px] font-medium placeholder:text-slate-300 outline-none resize-none no-scrollbar"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="p-4 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors">
                  <ImageIcon size={24} />
                </button>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!postContent}
                  className="flex-1 h-14 bg-black text-white rounded-[20px] font-bold text-lg active:scale-95 transition-all disabled:opacity-30"
                >
                  Publicar ahora
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
