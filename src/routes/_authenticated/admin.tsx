import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Check, X, Share2, Copy, Building2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    if (context.userRole !== "admin" && context.userRole !== "super_admin") {
      throw redirect({ to: "/_authenticated/muro" });
    }
  },
  component: AdminPage,
});

function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [building, setBuilding] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get admin's building
    const { data: profile } = await supabase
      .from("profiles")
      .select("building_id")
      .eq("id", user.id)
      .single();

    if (profile?.building_id) {
      // Get building details
      const { data: buildingData } = await supabase
        .from("buildings")
        .select("*")
        .eq("id", profile.building_id)
        .single();
      setBuilding(buildingData);

      // Get all profiles in the building
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*, unit:units(*)")
        .eq("building_id", profile.building_id)
        .order("status", { ascending: false }); // pendientes first typically (p > a) or custom sort
      
      // Custom sort: pendiente first
      const sorted = (profilesData || []).sort((a, b) => {
        if (a.status === "pendiente" && b.status !== "pendiente") return -1;
        if (a.status !== "pendiente" && b.status === "pendiente") return 1;
        return 0;
      });
      
      setProfiles(sorted);
    }
    setLoading(false);
  }

  const handleUpdateStatus = async (profileId: string, newStatus: "aprobado" | "pendiente") => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", profileId);

    if (error) {
      toast.error("Error al actualizar estado");
    } else {
      toast.success(newStatus === "aprobado" ? "Vecino aprobado" : "Estado actualizado");
      
      // Also join chat channel if approved (the trigger handles this, but we refresh local data)
      fetchData();
    }
  };

  const copyInviteCode = () => {
    if (!building?.invite_code) return;
    navigator.clipboard.writeText(building.invite_code);
    toast.success("Código copiado");
  };

  const shareInvite = () => {
    if (!building) return;
    const text = `¡Hola! Sumate a la app de nuestro edificio "${building.name}".\n\n1. Descargá la app\n2. Ingresá el código: ${building.invite_code}\n3. Seleccioná tu unidad.\n\n¡Nos vemos ahí!`;
    navigator.clipboard.writeText(text);
    toast.success("Invitación copiada para WhatsApp");
  };

  if (loading) return <div className="p-8 font-bold text-slate-400">Cargando administración...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-12 pb-32">
      <header className="px-1">
        <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Administración</h1>
        <p className="text-muted-foreground font-medium text-lg">Gestión de edificio y vecinos</p>
      </header>

      {/* Wallet Style Building Card */}
      <div className="premium-card p-10 bg-primary text-primary-foreground shadow-premium relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[100px]" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[11px]">{building?.name}</p>
            <h2 className="text-6xl font-bold tracking-tight">{building?.invite_code}</h2>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full text-[12px] font-bold uppercase tracking-widest border border-white/10">
              Código de Invitación
            </div>
          </div>
          
          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button 
              onClick={copyInviteCode}
              className="flex-1 py-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
            >
              <Copy size={16} /> Copiar
            </button>
            <button 
              onClick={shareInvite}
              className="flex-1 py-4 bg-accent text-white rounded-[1.5rem] font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              <Share2 size={16} /> Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Section Pending (Wallet Logic) */}
      {profiles.some(p => p.status === 'pendiente') && (
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pendientes de aprobación</h3>
          <div className="space-y-2">
            {profiles.filter(p => p.status === 'pendiente').map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-[24px] shadow-soft border border-slate-50 flex items-center justify-between gap-4 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-none mb-1">{p.full_name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.unit?.floor}-{p.unit?.apartment}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateStatus(p.id, "aprobado")} className="px-4 py-2 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider active:scale-95">Aprobar</button>
                  <button className="px-4 py-2 border border-red-100 text-red-400 rounded-full text-[10px] font-black uppercase tracking-wider active:scale-95">X</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Neighbors List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comunidad ({profiles.length})</h3>
        </div>

        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white p-5 rounded-[24px] shadow-soft border border-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{p.full_name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  Piso {p.unit?.floor} - Depto {p.unit?.apartment}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.status === "pendiente" ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(p.id, "aprobado")}
                      className="px-5 py-2.5 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg shadow-green-500/20 active:scale-90 transition-all"
                    >
                      Aprobar
                    </button>
                    <button 
                      className="px-5 py-2.5 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-wider active:scale-90 transition-all"
                    >
                      Rechazar
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-black text-green-600 bg-green-50 px-4 py-2 rounded-full uppercase tracking-wider">
                    Aprobado
                  </span>
                )}
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[24px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No hay vecinos registrados aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
