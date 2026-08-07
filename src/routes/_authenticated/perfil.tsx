import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, User, DoorOpen, Shield, FileText, ChevronRight, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Route as AuthRoute } from "./route";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: PerfilPage,
});

function PerfilPage() {
  const navigate = useNavigate();
  const { userRole, isSuperAdmin } = AuthRoute.useRouteContext();
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
    <div className="p-6 max-w-sm mx-auto space-y-8 pb-32">
      <header className="px-1 flex flex-col items-center text-center space-y-4 pt-4">
        <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center relative overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={56} className="text-slate-300" />
          )}
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{profile.full_name}</h1>
          <div className="flex items-center gap-2 justify-center">
            <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-wider">
              {building?.name || "Sin edificio"}
            </span>
            <span className="px-3 py-1 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase tracking-wider">
              Piso {unit?.floor || "-"} - Depto {unit?.apartment || "-"}
            </span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[28px] shadow-soft overflow-hidden border border-slate-50">
        <Link to="/perfil/editar" className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
          <span className="font-semibold text-slate-900">Mis Datos</span>
          <ChevronRight size={20} className="text-slate-300" />
        </Link>
        <Link to="/perfil/pagos" className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
          <span className="font-semibold text-slate-900">Mis Pagos</span>
          <ChevronRight size={20} className="text-slate-300" />
        </Link>
        
        {isSuperAdmin && (
          <Link to="/admin-global" className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors border-b border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-black" />
              <span className="font-bold text-black">Panel de Control</span>
            </div>
            <ChevronRight size={20} className="text-slate-400" />
          </Link>
        )}

        <Link to="/terminos" className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors border-b border-slate-50">
          <span className="font-semibold text-slate-900">Legales</span>
          <ChevronRight size={20} className="text-slate-300" />
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-5 hover:bg-red-50/50 transition-colors text-red-600"
        >
          <span className="font-semibold">Cerrar sesión</span>
          <ChevronRight size={20} className="text-red-300" />
        </button>
      </div>
    </div>
  );
}