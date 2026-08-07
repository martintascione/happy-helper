import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, User, DoorOpen, Shield, FileText, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [building, setBuilding] = useState<any>(null);
  const [unit, setUnit] = useState<any>(null);
  const [agreement, setAgreement] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, building:buildings(*), unit:units(*)")
      .eq("id", user.id)
      .single();


    if (profileData) {
      setProfile(profileData);
      setBuilding(profileData.building);
      setUnit(profileData.unit);
      
      // Fetch terms agreement
      const { data: agreementData } = await supabase
        .from("user_agreements" as any)
        .select("*")
        .eq("user_id", user.id)
        .eq("agreement_key", "terminos")
        .order("accepted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setAgreement(agreementData);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        phone: profile.phone,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Error al actualizar perfil");
    } else {
      toast.success("Perfil actualizado");
    }
    setLoading(false);
  };

  if (!profile) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 max-w-md mx-auto space-y-8 pb-32">
      <header className="px-1 space-y-1">
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Mi Perfil</h1>
        <p className="text-slate-400 font-medium">Gestioná tu cuenta y datos</p>
      </header>

      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center text-primary relative overflow-hidden border border-slate-100 shadow-sm">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={48} />
          )}
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-slate-900">{profile.full_name}</h1>
          <p className="text-sm text-slate-400 font-medium capitalize">{profile.role}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4 text-slate-600">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Edificio</p>
            <p className="font-medium">{building?.name || "No asignado"}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-600">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
            <DoorOpen size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidad</p>
            <p className="font-medium">
              Piso {unit?.floor || "-"} - Depto {unit?.apartment || "-"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
            <input
              type="text"
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Teléfono</label>
            <input
              type="tel"
              value={profile.phone || ""}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Ej: +54 9 11..."
              className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>

      <div className="space-y-4">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legales</h2>
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <Link to="/terminos" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors border-b border-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <FileText size={20} />
              </div>
              <span className="font-bold text-slate-700">Términos y Condiciones</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
          <Link to="/privacidad" className="flex items-center justify-between p-5 hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                <Shield size={20} />
              </div>
              <span className="font-bold text-slate-700">Política de Privacidad</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        </div>
        {agreement && (
          <p className="text-[10px] font-bold text-slate-400 text-center px-4">
            Aceptaste los términos el {format(new Date(agreement.accepted_at), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-2xl transition-all"
      >
        Cerrar sesión
      </button>
    </div>
  );
}