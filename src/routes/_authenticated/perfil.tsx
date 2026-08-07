import { createFileRoute, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, User, DoorOpen, Shield, FileText, ChevronRight, Settings } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Route as AuthRoute } from "./route";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

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
  const [showEdit, setShowEdit] = useState(false);

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
      setShowEdit(false);
    }
    setLoading(false);
  };

  if (!profile) {
    return (
      <div className="p-5 max-w-sm mx-auto pt-10 space-y-6">
        <div className="w-24 h-24 bg-white/70 rounded-full mx-auto animate-pulse" />
        <div className="h-5 w-40 bg-white/70 rounded-full mx-auto animate-pulse" />
        <div className="h-64 bg-white/70 rounded-[24px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-5 max-w-sm mx-auto space-y-8 pb-36">
      <header className="px-1 flex flex-col items-center text-center space-y-4 pt-6">
        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center relative overflow-hidden shadow-subtle">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={44} className="text-slate-300" strokeWidth={1.5} />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-[24px] font-bold text-foreground tracking-tight">{profile.full_name}</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="px-3 py-1 bg-white shadow-subtle text-[12px] font-semibold text-slate-500 rounded-full">
              {building?.name || "Sin edificio"}
            </span>
            <span className="px-3 py-1 bg-white shadow-subtle text-[12px] font-semibold text-slate-500 rounded-full">
              Piso {unit?.floor || "-"} · {unit?.apartment || "-"}
            </span>
          </div>
        </div>
      </header>

      <div className="bg-white rounded-[24px] shadow-subtle overflow-hidden">
        <button onClick={() => setShowEdit(true)} className="w-full flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors border-b border-black/[0.04] text-left">
          <span className="font-semibold text-foreground text-[15px]">Mis datos</span>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
        <Link to="/cocheras" className="flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors border-b border-black/[0.04]">
          <span className="font-semibold text-foreground text-[15px]">Mis pagos</span>
          <ChevronRight size={18} className="text-slate-300" />
        </Link>

        {isSuperAdmin && (
          <Link to="/admin-global" className="flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors border-b border-black/[0.04]">
            <div className="flex items-center gap-3">
              <Shield size={18} className="text-primary" />
              <span className="font-semibold text-primary tracking-tight text-[15px]">Panel de control</span>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </Link>
        )}

        <Link to="/terminos" className="flex items-center justify-between p-5 hover:bg-black/[0.01] transition-colors border-b border-black/[0.04]">
          <div>
            <span className="font-semibold text-foreground text-[15px] block">Legales</span>
            {agreement && (
              <span className="text-[12px] font-medium text-slate-400">
                Términos aceptados el {new Date(agreement.accepted_at).toLocaleDateString('es-AR')}
              </span>
            )}
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between p-5 hover:bg-red-50/50 transition-colors text-red-500"
        >
          <span className="font-semibold text-[15px]">Cerrar sesión</span>
          <ChevronRight size={18} className="text-red-300" />
        </button>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="rounded-[28px] border-none sm:max-w-[400px] p-7">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-bold tracking-tight">Mis datos</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-500 ml-1">Nombre completo</label>
              <input
                type="text"
                value={profile.full_name || ""}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full p-4 bg-[#F5F5F3] rounded-[18px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-500 ml-1">Teléfono</label>
              <input
                type="tel"
                value={profile.phone || ""}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="11 1234 5678"
                className="w-full p-4 bg-[#F5F5F3] rounded-[18px] border-none focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-black text-white rounded-full font-semibold text-[15px] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}