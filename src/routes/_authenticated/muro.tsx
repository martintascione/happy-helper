import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, ArrowRight, MessageSquare, Car, AlertTriangle, X, Image as ImageIcon, Send, User } from "lucide-react";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from("profiles").select("building_id").eq("id", user.id).single();
    
    if (profile?.building_id) {
      const [postsRes, bookingsRes] = await Promise.all([
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
          .limit(2)
      ]);

      setData({
        posts: postsRes.data || [],
        bookings: bookingsRes.data || [],
        loading: false
      });
    } else {
      setData(prev => ({ ...prev, loading: false }));
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <header className="px-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunidad</h1>
        <p className="text-slate-500 font-medium">Torre Libertador 1500</p>
      </header>

      {/* Resumen */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tu resumen</h2>
        
        {data.loading ? (
          <div className="h-32 bg-slate-100 rounded-[2rem] animate-pulse" />
        ) : data.bookings.length > 0 ? (
          <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group active:scale-[0.98] transition-all">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-pink-500/20 rounded-full blur-2xl group-hover:scale-110 transition-transform" />
            <h3 className="text-[10px] font-bold text-pink-300 uppercase mb-3 flex items-center gap-2 tracking-widest">
              <Calendar size={12} /> Próxima cochera
            </h3>
            <p className="text-2xl font-black mb-1">{data.bookings[0].spot?.identifier}</p>
            <p className="text-sm font-medium opacity-70">
              {format(new Date(data.bookings[0].start_date), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ) : (
          <button 
            onClick={() => navigate({ to: "/_authenticated/cocheras" })}
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

      {/* Comunicados */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Últimos comunicados</h2>
        {data.loading ? (
          <div className="space-y-4">
            <div className="h-24 bg-slate-100 rounded-[2rem] animate-pulse" />
            <div className="h-24 bg-slate-100 rounded-[2rem] animate-pulse" />
          </div>
        ) : data.posts.length > 0 ? (
          data.posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-soft border border-white hover:border-slate-100 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-[9px] font-black uppercase rounded-full tracking-wider">
                    Oficial
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    {format(new Date(post.created_at), "d MMM", { locale: es })}
                  </span>
                </div>
                {post.author && (
                  <button 
                    onClick={() => navigate({ to: "/_authenticated/chat", search: { startDirect: post.author_id } } as any)}
                    className="text-[9px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1"
                  >
                    Por {post.author.full_name} <MessageSquare size={10} />
                  </button>
                )}
              </div>
              <h3 className="font-black text-xl text-slate-900 mb-2 leading-tight">{post.title}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed">{post.body}</p>
            </div>
          ))
        ) : (
          <div className="bg-white p-10 rounded-[2rem] border-2 border-dashed border-slate-100 text-center space-y-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto">
              <MessageSquare size={24} />
            </div>
            <div>
              <p className="text-slate-400 font-bold">No hay novedades oficiales</p>
              <p className="text-xs font-medium text-slate-300">Te avisaremos cuando el admin publique algo.</p>
            </div>
          </div>
        )}
      </div>

      {/* Action Button for Neighbor Posts */}
      <div className="fixed bottom-24 right-6 z-20">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-14 h-14 rounded-full bg-black text-white shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all">
              <Plus size={24} />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Nueva publicación</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-6">
              <InfoBanner 
                variant="info" 
                text="Tu publicación la van a ver todos los vecinos del edificio. No está permitido contenido ofensivo o discriminatorio, ni publicidad de negocios ajenos al edificio. La administración puede quitar publicaciones que incumplan las normas." 
              />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Título</label>
                  <Input placeholder="¿De qué trata tu aviso?" className="rounded-2xl h-12 bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Mensaje</label>
                  <Textarea placeholder="Escribí acá los detalles..." className="rounded-2xl min-h-[120px] bg-slate-50 border-none font-medium p-4" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full bg-black text-white h-14 rounded-2xl font-black">Publicar aviso</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
