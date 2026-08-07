import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Landmark, Percent, DollarSign, Save } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-global")({
  beforeLoad: async ({ context }) => {
    if (context.userRole !== "super_admin") {
      throw redirect({ to: "/_authenticated/muro" });
    }
  },
  component: GlobalAdminPage,
});

function GlobalAdminPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);
    const { data } = await supabase.from("platform_settings" as any).select("*").single();
    if (data) setSettings(data);
    setLoading(false);
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from("platform_settings" as any)
      .update(settings)
      .eq("id", 1 as any);

    if (error) {
      toast.error("Error al guardar configuración");
    } else {
      toast.success("Configuración actualizada");
    }
    setLoading(false);
  };

  if (!settings && loading) return <div className="p-8 font-bold text-slate-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel Global</h1>
        <p className="text-slate-500 font-medium">Configuración maestra de la plataforma</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profit Margin Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Percent className="text-slate-400" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900">Margen de Ganancia</h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tipo de Margen</label>
              <select
                value={settings?.margin_type || "porcentaje"}
                onChange={(e) => setSettings({ ...settings, margin_type: e.target.value })}
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-bold"
              >
                <option value="porcentaje">Porcentaje (%)</option>
                <option value="fijo">Monto Fijo ($)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Valor</label>
              <div className="relative">
                <input
                  type="number"
                  value={settings?.margin_value || 0}
                  onChange={(e) => setSettings({ ...settings, margin_value: parseFloat(e.target.value) })}
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-bold"
                />
                <span className="absolute right-4 top-4 text-slate-400 font-bold">
                  {settings?.margin_type === 'porcentaje' ? '%' : '$'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Company Bank Account Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Landmark className="text-slate-400" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900">Datos Bancarios (Empresa)</h2>
          </div>
          
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Titular de la Cuenta</label>
              <input
                type="text"
                value={settings?.transfer_holder_name || ""}
                onChange={(e) => setSettings({ ...settings, transfer_holder_name: e.target.value })}
                placeholder="Comunidad Tower S.A."
                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CBU</label>
                <input
                  type="text"
                  value={settings?.transfer_cbu || ""}
                  onChange={(e) => setSettings({ ...settings, transfer_cbu: e.target.value })}
                  placeholder="22 dígitos"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Alias</label>
                <input
                  type="text"
                  value={settings?.transfer_alias || ""}
                  onChange={(e) => setSettings({ ...settings, transfer_alias: e.target.value })}
                  placeholder="ejemplo.torre.pago"
                  className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-black/5 transition-all font-medium"
                />
              </div>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-black text-white rounded-[2rem] font-bold shadow-xl shadow-black/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
        >
          <Save size={22} />
          {loading ? "Guardando..." : "Guardar Configuración"}
        </button>
      </form>
    </div>
  );
}
