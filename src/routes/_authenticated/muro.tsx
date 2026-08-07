import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, ArrowRight, MessageSquare, Car, AlertTriangle, X, Image as ImageIcon, Send, User, Bell, Heart } from "lucide-react";
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
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32 bg-background">
      <header className="px-1 space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Comunidad</h1>
        <p className="text-slate-400 font-medium">Torre Libertador 1500</p>
      </header>

      {/* Resumen */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tu resumen</h2>
        
        {data.loading ? (
          <div className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />
        ) : data.bookings.length > 0 ? (
          <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-accent/10 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <h3 className="text-[10px] font-bold text-accent uppercase mb-3 flex items-center gap-2 tracking-widest">
              <Calendar size={12} /> Próxima cochera
            </h3>
            <p className="text-2xl font-black mb-1">{data.bookings[0].spot?.identifier}</p>
            <p className="text-sm font-medium opacity-70">
              {format(new Date(data.bookings[0].start_date), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => navigate({ to: "/_authenticated/cocheras" as any })}
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

      {/* Comunicados Oficiales */}
      <div className="space-y-4">
        {data.posts.map((post) => (
          <div key={post.id} className="tint-insight card-dashed p-6 rounded-[24px] space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                  <Bell size={16} />
                </div>
                <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.1em]">Comunicado Oficial</span>
              </div>
              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">
                {format(new Date(post.created_at), "d MMM", { locale: es })}
              </span>
            </div>
            <div className="space-y-2 relative z-10">
              <h3 className="font-bold text-xl text-slate-900 leading-tight">{post.title}</h3>
              <p className="text-sm text-slate-700 font-medium leading-relaxed">{post.body}</p>
            </div>
            {post.author && (
              <div className="flex justify-end pt-2 relative z-10">
                <p className="text-[10px] font-bold text-violet-400/70 uppercase">Administración • {post.author.full_name}</p>
              </div>
            )}
          </div>
        ))}
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
