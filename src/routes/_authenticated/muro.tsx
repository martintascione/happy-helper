import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, MessageCircle, Star, Calendar, ArrowRight } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/muro")({
  component: MuroPage,
});

function MuroPage() {
  const [data, setData] = useState({ posts: [], bookings: [], loading: true });
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch official announcements (last 7 days) and user's upcoming confirmed bookings
    const { data: profile } = await supabase.from("profiles").select("building_id").eq("id", user.id).single();
    
    if (profile) {
      const [postsRes, bookingsRes] = await Promise.all([
        supabase
          .from("posts")
          .select("*, author:profiles(full_name)")
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
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunidad</h1>
        <p className="text-slate-500 font-medium">Torre Libertador 1500</p>
      </header>

      {/* Resumen */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Tu resumen</h2>
        
        {data.bookings.length > 0 ? (
          <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl">
            <h3 className="text-xs font-bold text-pink-300 uppercase mb-3 flex items-center gap-2">
              <Calendar size={14} /> Próxima cochera
            </h3>
            <p className="text-xl font-black mb-1">{data.bookings[0].spot.identifier}</p>
            <p className="text-sm font-medium opacity-80">
              {format(new Date(data.bookings[0].start_date), "d 'de' MMMM", { locale: es })}
            </p>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Calendar size={20} />
              </div>
              <p className="font-bold text-slate-700">Sin reservas próximas</p>
            </div>
            <button onClick={() => navigate({ to: "/_authenticated/cocheras" })} className="p-2 bg-slate-900 text-white rounded-full">
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Comunicados */}
      <div className="space-y-4">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Comunicados</h2>
        {data.loading ? (
          <div className="text-center py-12 text-slate-400 font-bold">Cargando...</div>
        ) : data.posts.length > 0 ? (
          data.posts.map((post: any) => (
            <div key={post.id} className="bg-white p-6 rounded-[2rem] shadow-soft border border-slate-50">
              <p className="text-[10px] font-black text-pink-500 uppercase mb-2">Oficial</p>
              <h3 className="font-black text-lg mb-1">{post.title}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-2">{post.body}</p>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-[2rem] border border-dashed border-slate-200 text-center text-slate-400 font-bold">
            No hay comunicados oficiales
          </div>
        )}
      </div>
    </div>
  );
}
