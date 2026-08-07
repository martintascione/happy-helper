import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Landmark, Percent, DollarSign, Save, FileText, Check, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [activeTab, setActiveTab] = useState<"config" | "pagos" | "liquidaciones" | "resumen">("config");
  const [settings, setSettings] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  async function fetchData() {
    setLoading(true);
    if (activeTab === "config") {
      const { data } = await supabase.from("platform_settings" as any).select("*").single();
      if (data) setSettings(data);
    } else if (activeTab === "pagos") {
      const { data } = await supabase
        .from("parking_payments" as any)
        .select(`
          *,
          booking:parking_bookings(
            id,
            total_price,
            renter:profiles!renter_id(full_name),
            spot:parking_spots(identifier)
          )
        `)
        .eq("status", "en_revision")
        .order("created_at", { ascending: true });
      setPendingPayments(data || []);
    } else if (activeTab === "liquidaciones") {
      const { data } = await supabase
        .from("parking_payouts" as any)
        .select(`
          *,
          booking:parking_bookings(
            id,
            total_price,
            owner_amount,
            platform_fee,
            spot:parking_spots(identifier)
          ),
          owner:profiles!owner_id(
            full_name,
            payout_accounts:payout_accounts(holder_name, document_number, cbu_or_alias)
          )
        `)
        .eq("status", "pendiente")
        .order("created_at", { ascending: true });
      setPendingPayouts(data || []);
    } else if (activeTab === "resumen") {
      const { data: bookings } = await supabase
        .from("parking_bookings" as any)
        .select("total_price, owner_amount, platform_fee, created_at")
        .eq("status", "confirmada") // Solo las pagadas/confirmadas
        .or("status.eq.finalizada");
      
      if (bookings) {
        const stats = (bookings as any[]).reduce((acc, curr) => {
          const date = new Date(curr.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) {
            acc[monthKey] = { month: monthKey, total: 0, owner_sum: 0, profit: 0 };
          }
          
          acc[monthKey].total += Number(curr.total_price);
          acc[monthKey].owner_sum += Number(curr.owner_amount);
          acc[monthKey].profit += Number(curr.platform_fee);
          
          return acc;
        }, {} as Record<string, any>);
        
        setFinancialStats(Object.values(stats).sort((a: any, b: any) => b.month.localeCompare(a.month)));
      }
    }
    setLoading(false);
  }

  async function handleReviewPayment(paymentId: string, status: 'aprobado' | 'rechazado', reason?: string) {
    setLoading(true);
    const { error } = await supabase
      .from("parking_payments" as any)
      .update({ 
        status, 
        reject_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq("id", paymentId);

    if (error) {
      toast.error("Error al procesar pago");
    } else {
      toast.success(status === 'aprobado' ? "Pago aprobado" : "Pago rechazado");
      fetchData();
    }
    setLoading(false);
  }

  async function handleReviewPayout(payoutId: string, status: 'pagado') {
    setLoading(true);
    const { error } = await supabase
      .from("parking_payouts" as any)
      .update({ 
        status, 
        paid_at: new Date().toISOString()
      })
      .eq("id", payoutId);

    if (error) {
      toast.error("Error al procesar liquidación");
    } else {
      toast.success("Liquidación marcada como pagada");
      fetchData();
    }
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

  if (!settings && loading && activeTab === 'config') return <div className="p-8 font-bold text-slate-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel Global</h1>
        <p className="text-slate-500 font-medium">Configuración maestra de la plataforma</p>
      </div>

      <div className="flex p-1 bg-gray-200 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: "config", label: "Configuración", icon: Settings },
          { id: "pagos", label: "Pagos", icon: FileText },
          { id: "liquidaciones", label: "Liquidaciones", icon: Landmark },
          { id: "resumen", label: "Resumen", icon: DollarSign }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-fit px-4 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase rounded-xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.id === 'pagos' && pendingPayments.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingPayments.length}
              </span>
            )}
            {tab.id === 'liquidaciones' && pendingPayouts.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingPayouts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "config" ? (
        <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300">
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
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {pendingPayments.length === 0 ? (
            <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Check size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Todo al día</h3>
              <p className="text-slate-500 font-medium">No hay comprobantes pendientes de revisión.</p>
            </div>
          ) : (
            pendingPayments.map((payment) => (
              <div key={payment.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-lg text-slate-900">{payment.booking?.renter?.full_name}</h4>
                    <p className="text-sm font-medium text-slate-500">
                      Reserva en {payment.booking?.spot?.identifier} • ${Number(payment.amount).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <a 
                    href={supabase.storage.from('payment-receipts').getPublicUrl(payment.receipt_url).data.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-50 rounded-xl text-black hover:bg-slate-100 transition-colors"
                    title="Ver comprobante"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={() => handleReviewPayment(payment.id, 'aprobado')}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-bold h-12 flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    <Check size={18} /> Aprobar
                  </Button>
                  <Button 
                    onClick={() => {
                      const reason = window.prompt("Motivo del rechazo:");
                      if (reason) handleReviewPayment(payment.id, 'rechazado', reason);
                    }}
                    variant="ghost" 
                    className="flex-1 text-red-500 hover:bg-red-50 rounded-2xl font-bold h-12 flex items-center justify-center gap-2"
                  >
                    <X size={18} /> Rechazar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
