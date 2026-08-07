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
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Administración</h1>
        <p className="text-slate-500 font-medium">Gestioná tu edificio y vecinos</p>
      </div>

      {/* Building Card */}
      <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <Building2 className="text-accent" size={24} />
            <h2 className="text-xl font-bold">{building?.name}</h2>
          </div>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/10 p-4 rounded-2xl border border-white/10">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código de invitación</p>
              <p className="text-2xl font-mono font-bold tracking-tighter">{building?.invite_code}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={copyInviteCode}
                className="flex-1 sm:flex-none p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                title="Copiar código"
              >
                <Copy size={20} />
              </button>
              <button 
                onClick={shareInvite}
                className="flex-1 sm:flex-none px-4 py-3 bg-accent text-accent-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                <Share2 size={18} /> Compartir
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Neighbors List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Users className="text-slate-400" size={20} />
          <h2 className="text-lg font-extrabold text-slate-900">Vecinos</h2>
          <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full ml-auto">
            {profiles.length} total
          </span>
        </div>

        <div className="space-y-3">
          {profiles.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-[1.5rem] shadow-soft flex items-center gap-4 border border-transparent hover:border-slate-100 transition-colors">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0 overflow-hidden">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User size={24} />}
              </div>
              <div className="flex-1 min-w-0">
                <button 
                  onClick={() => Route.useNavigate()({ to: "/_authenticated/chat", search: { startDirect: p.id } } as any)}
                  className="font-bold text-slate-900 truncate hover:text-pink-500 transition-colors block text-left w-full"
                >
                  {p.full_name}
                </button>
                <p className="text-xs text-slate-500 font-medium">
                  Piso {p.unit?.floor} - {p.unit?.apartment}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {p.status === "pendiente" ? (
                  <>
                    <button 
                      onClick={() => handleUpdateStatus(p.id, "aprobado")}
                      className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20 active:scale-90 transition-transform"
                      title="Aprobar"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <button 
                      className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                      title="Rechazar"
                    >
                      <X size={20} strokeWidth={3} />
                    </button>
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                    Aprobado
                  </span>
                )}
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <p className="text-slate-400 font-medium">No hay vecinos registrados aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
