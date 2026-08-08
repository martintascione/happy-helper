import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, ArrowRight, MessageSquare, Car, AlertTriangle, X, Image as ImageIcon, Send, User, Bell, Heart, Shield, ShieldCheck, Zap, Activity, TrendingUp, MoreHorizontal } from "lucide-react";
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
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const { userRole, userId } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase.from("profiles").select("full_name, avatar_url, building_id").eq("id", user.id).single();
    
    if (profileData) {
      setProfile({ full_name: profileData.full_name, avatar_url: profileData.avatar_url });
      
      if (profileData.building_id) {
        const [officialRes, bookingsRes, neighborsRes] = await Promise.all([
          supabase
            .from("posts")
            .select("*, author:profiles!author_id(full_name)")
            .eq("building_id", profileData.building_id)
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
            .eq("building_id", profileData.building_id)
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
    <div className="px-5 pt-8 max-w-2xl mx-auto space-y-7 pb-36 bg-background overflow-x-hidden relative">
      <header className="px-1 flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate({ to: "/_authenticated/perfil" } as any)}
            className="w-10 h-10 rounded-full overflow-hidden active:scale-95 transition-all bg-white shadow-subtle border border-white flex items-center justify-center"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-slate-400" />
            )}
          </button>
          <div className="flex flex-col">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Bienvenido</p>
            <h1 className="text-[20px] font-bold text-foreground tracking-tight leading-none">
              {profile?.full_name?.split(' ')[0] || 'Vecino'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {format(new Date(), "d MMM", { locale: es })}
          </p>
        </div>
      </header>

      {/* Wellness / Quick Actions Highlight */}
      <div className="bg-black text-white rounded-[32px] p-6 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer shadow-premium">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-colors" />
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Zap size={22} className="text-yellow-400 fill-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">Comunidad Premium</h3>
              <p className="text-xs font-medium text-white/50">Tu edificio al día</p>
            </div>
          </div>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black">
            <ArrowRight size={18} />
          </div>
        </div>
      </div>

      {/* Resumen */}
      {/* Dynamic Activity Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cochera Highlight */}
        <div 
          onClick={() => navigate({ to: "/_authenticated/cocheras" } as any)}
          className="bg-white p-5 rounded-[28px] shadow-subtle border border-white flex flex-col gap-4 active:scale-95 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-slate-900">Cochera</h4>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-slate-900">
                {data.bookings.length > 0 ? data.bookings[0].spot?.identifier : "0"}
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reservas</span>
            </div>
            <div className="w-full h-10 flex items-end gap-0.5 pb-1">
              {[30, 45, 25, 60, 40, 70, 50].map((h, i) => (
                <div key={i} className="flex-1 bg-slate-100 rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>

        {/* Community Health / Reports */}
        <div 
          onClick={() => navigate({ to: "/_authenticated/reportes" } as any)}
          className="bg-white p-5 rounded-[28px] shadow-subtle border border-white flex flex-col gap-4 active:scale-95 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-bold text-slate-900">Actividad</h4>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span className="text-xl font-black text-slate-900">+12%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Esta semana</p>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                <User size={10} className="text-slate-400" />
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
              +5
            </div>
          </div>
        </div>
      </div>

      {/* Main Tool Grid (Horizontal Scroll Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[17px] font-bold text-slate-900">Herramientas</h2>
          <button className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ver todo</button>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Cocheras", icon: Car, to: "/_authenticated/cocheras", color: "bg-blue-50 text-blue-600" },
            { label: "Chat", icon: MessageSquare, to: "/_authenticated/chat", color: "bg-emerald-50 text-emerald-600" },
            { label: "Reportes", icon: AlertTriangle, to: "/_authenticated/reportes", color: "bg-rose-50 text-rose-600" },
          ].map(({ label, icon: Icon, to, color }) => (
            <button
              key={label}
              onClick={() => navigate({ to } as any)}
              className="bg-white rounded-[28px] p-5 flex flex-col items-center gap-3 shadow-subtle border border-white active:scale-95 transition-all"
            >
              <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center`}>
                <Icon size={22} strokeWidth={2.5} />
              </div>
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Post Section Header */}
      <div className="flex items-center justify-between px-1 pt-2">
        <h2 className="text-[17px] font-bold text-slate-900">Última actividad</h2>
        <MoreHorizontal size={20} className="text-slate-400" />
      </div>

      {/* Comunicados Oficiales */}
      <div className="space-y-4">
        {data.posts.length > 0 ? data.posts.map((post) => (
          <div key={post.id} className="premium-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-black flex items-center justify-center shrink-0">
                  <Bell size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Oficial</p>
                  <p className="text-[12px] font-bold text-slate-900">Administración</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {format(new Date(post.created_at), "d MMM", { locale: es })}
              </span>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-[19px] text-slate-900 tracking-tight leading-tight">{post.title}</h3>
              <p className="text-[14px] text-slate-500 font-medium leading-relaxed">{post.body}</p>
            </div>
            
            <button className="w-full py-3 bg-slate-50 rounded-2xl text-[12px] font-bold text-slate-900 active:scale-95 transition-all">
              Leer comunicado completo
            </button>
          </div>
        )) : null}
      </div>

      {/* Muro Vecinal */}
      <div className="space-y-3">
        <h2 className="text-[17px] font-bold text-slate-900 px-1">Muro vecinal</h2>
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
                  <h4 className="font-semibold text-[14px] text-slate-900 leading-none">{post.author?.full_name}</h4>
                  <p className="text-[12px] font-medium text-slate-400 mt-1">
                    Piso {post.author?.unit?.floor || '-'} · {post.author?.unit?.apartment || '-'}
                  </p>
                </div>
                <span className="ml-auto text-[12px] font-medium text-slate-300">
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

              <div className="flex items-center gap-2 pt-1">
                <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F7F5F1] hover:bg-[#F0EDE6] rounded-full transition-colors">
                  <Heart size={14} className="text-slate-500" />
                  <span className="text-[12px] font-semibold text-slate-500">Me gusta</span>
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 bg-[#F7F5F1] hover:bg-[#F0EDE6] rounded-full transition-colors">
                  <MessageSquare size={14} className="text-slate-500" />
                  <span className="text-[12px] font-semibold text-slate-500">Comentar</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white p-10 rounded-[24px] shadow-subtle text-center space-y-3">
            <div className="w-14 h-14 bg-[#F4F1EB] rounded-full flex items-center justify-center text-slate-300 mx-auto">
              <MessageSquare size={26} />
            </div>
            <div className="space-y-0.5">
              <p className="text-slate-600 font-semibold text-[14px]">Todavía no hay avisos vecinales</p>
              <p className="text-[12px] font-medium text-slate-400">Sé el primero en compartir algo</p>
            </div>
          </div>
        )}
      </div>

      {/* Floating Create Button */}
      <div className="fixed bottom-28 right-5 z-40">
        <Dialog open={isComposerOpen} onOpenChange={setIsComposerOpen}>
          <DialogTrigger asChild>
            <button className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-premium flex items-center justify-center active:scale-90 transition-all">
              <Plus size={26} strokeWidth={2.25} />
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
                    className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                      postType === "vecinal" ? "bg-black text-white" : "bg-[#F4F1EB] text-slate-500"
                    }`}
                  >
                    Aviso vecinal
                  </button>
                  {(userRole === 'admin' || userRole === 'super_admin') && (
                    <button
                      onClick={() => setPostType("oficial")}
                      className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all ${
                        postType === "oficial" ? "bg-black text-white" : "bg-[#F4F1EB] text-slate-500"
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
