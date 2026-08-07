import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Settings, Landmark, Percent, DollarSign, Save, FileText, Check, X, ExternalLink, Plus, Building2, Users, Calendar, Megaphone, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  const [activeTab, setActiveTab] = useState<"config" | "pagos" | "liquidaciones" | "resumen" | "edificios" | "vecinos">("config");
  const [settings, setSettings] = useState<any>(null);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [financialStats, setFinancialStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const [buildings, setBuildings] = useState<any[]>([]);
  const [showNewBuildingModal, setShowNewBuildingModal] = useState(false);
  const [globalNeighbors, setGlobalNeighbors] = useState<any[]>([]);
  const [selectedNeighborAgreements, setSelectedNeighborAgreements] = useState<any[]>([]);
  const [showAgreementsModal, setShowAgreementsModal] = useState(false);

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
    } else if (activeTab === "edificios") {
      const { data } = await supabase
        .from("buildings")
        .select(`
          *,
          neighbors:profiles(count),
          reservas:parking_bookings(count),
          publicaciones:posts(count)
        `);
      setBuildings(data || []);
    } else if (activeTab === "vecinos") {
      const { data } = await supabase
        .from("profiles")
        .select(`
          *,
          building:buildings(name),
          unit:units(floor, apartment)
        `)
        .order("created_at", { ascending: false });
      setGlobalNeighbors(data || []);
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
      <div className="space-y-1 px-1">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Panel Global</h1>
        <p className="text-slate-500 font-medium">Configuración y auditoría</p>
      </div>

      {activeTab === "resumen" && financialStats && (
        <section className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-black text-white p-8 rounded-[28px] shadow-2xl shadow-black/20 space-y-2 relative overflow-hidden">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] relative z-10">Total cobrado este mes</p>
            <h2 className="text-5xl font-black tracking-tight relative z-10">${financialStats[0]?.total.toLocaleString('es-AR') || 0}</h2>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10">
              Disponible: ${financialStats[0]?.profit.toLocaleString('es-AR') || 0}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Comprobantes", icon: FileText, id: "pagos" },
              { label: "Liquidaciones", icon: Landmark, id: "liquidaciones" },
              { label: "Edificios", icon: Building2, id: "edificios" },
              { label: "Configuración", icon: Settings, id: "config" }
            ].map((action) => (
              <button 
                key={action.id}
                onClick={() => setActiveTab(action.id as any)}
                className="flex flex-col items-center gap-3 p-6 bg-white rounded-[24px] shadow-soft border border-slate-50 hover:bg-slate-50 transition-all text-center"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-black">
                  <action.icon size={20} />
                </div>
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest leading-none">{action.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Tabs */}
      <div className="flex p-1.5 bg-slate-100 rounded-[22px] overflow-x-auto no-scrollbar">
        {[
          { id: "resumen", label: "Resumen" },
          { id: "pagos", label: "Pagos" },
          { id: "liquidaciones", label: "Liquids" },
          { id: "edificios", label: "Edificios" },
          { id: "vecinos", label: "Vecinos" },
          { id: "config", label: "Config" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-fit px-5 py-3 text-[10px] font-black uppercase rounded-[16px] transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
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
      ) : activeTab === "pagos" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {pendingPayments.length === 0 ? (
            <EmptyState title="Todo al día" description="No hay comprobantes pendientes de revisión." />
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
      ) : activeTab === "resumen" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {(!financialStats || financialStats.length === 0) ? (
            <EmptyState title="Sin datos" description="Aún no hay reservas confirmadas para mostrar estadísticas." />
          ) : (
            financialStats.map((stat: any) => (
              <div key={stat.month} className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-xl text-slate-900 capitalize">
                    {format(new Date(stat.month + '-02'), 'MMMM yyyy', { locale: es })}
                  </h4>
                  <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Profit: ${stat.profit.toLocaleString('es-AR')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cobrado Vecinos</p>
                    <p className="font-black text-xl text-slate-900">${stat.total.toLocaleString('es-AR')}</p>
                  </div>
                  <div className="bg-slate-50 p-5 rounded-[1.5rem] space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Dueños</p>
                    <p className="font-black text-xl text-slate-900">${stat.owner_sum.toLocaleString('es-AR')}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : activeTab === "vecinos" ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-slate-900">Auditoría de Vecinos</h2>
            <span className="text-xs font-bold bg-slate-200 text-slate-600 px-3 py-1 rounded-full">
              {globalNeighbors.length} total
            </span>
          </div>

          <div className="space-y-3">
            {globalNeighbors.map((n) => (
              <div key={n.id} className="bg-white p-5 rounded-[2rem] shadow-soft border border-white flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 shrink-0">
                  <User size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 truncate">{n.full_name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                    {n.building?.name} • Piso {n.unit?.floor} - {n.unit?.apartment}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={async () => {
                    const { data } = await supabase
                      .from("user_agreements" as any)
                      .select("*")
                      .eq("user_id", n.id)
                      .order("accepted_at", { ascending: false });
                    setSelectedNeighborAgreements(data || []);
                    setShowAgreementsModal(true);
                  }}
                  className="text-primary font-black text-[10px] uppercase tracking-wider"
                >
                  Acuerdos
                </Button>
              </div>
            ))}
          </div>

          {showAgreementsModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Compromisos Aceptados</h3>
                    <button onClick={() => setShowAgreementsModal(false)} className="p-2 bg-slate-50 rounded-xl text-slate-400"><X size={20} /></button>
                  </div>

                  <div className="space-y-3">
                    {selectedNeighborAgreements.length === 0 ? (
                      <p className="text-center py-8 text-slate-400 font-medium">No hay compromisos registrados.</p>
                    ) : (
                      selectedNeighborAgreements.map((a) => (
                        <div key={a.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              {a.agreement_key.replace('_', ' ')}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">Versión {a.version}</p>
                          </div>
                          <p className="text-[10px] font-black text-slate-500">
                            {format(new Date(a.accepted_at), "d/MM/yy HH:mm")}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xl font-black text-slate-900">Edificios Registrados</h2>
            <Button 
              onClick={() => setShowNewBuildingModal(true)}
              className="bg-black text-white rounded-2xl font-bold flex items-center gap-2 h-11 px-6 shadow-xl shadow-black/10"
            >
              <Plus size={18} /> Nuevo
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {buildings.map((building) => (
              <div key={building.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-xl text-slate-900">{building.name}</h4>
                    <p className="text-sm font-medium text-slate-500">{building.address}</p>
                    <div className="mt-2 inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-[10px] font-black uppercase tracking-wider">
                      Código: {building.invite_code}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center text-center space-y-1">
                    <Users size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vecinos</span>
                    <span className="font-black text-lg text-slate-900">{building.neighbors?.[0]?.count || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center text-center space-y-1">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reservas</span>
                    <span className="font-black text-lg text-slate-900">{building.reservas?.[0]?.count || 0}</span>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center text-center space-y-1">
                    <Megaphone size={16} className="text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Posts</span>
                    <span className="font-black text-lg text-slate-900">{building.publicaciones?.[0]?.count || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {showNewBuildingModal && (
            <NewBuildingModal onClose={() => { setShowNewBuildingModal(false); fetchData(); }} />
          )}
        </div>
      )}
    </div>
  );
}

function NewBuildingModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    invite_code: "",
    admin_email: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Crear el edificio
    const { data: building, error: bError } = await supabase
      .from("buildings")
      .insert({
        name: formData.name,
        address: formData.address,
        invite_code: formData.invite_code.toUpperCase()
      })
      .select()
      .single();

    if (bError) {
      toast.error("Error al crear edificio: " + bError.message);
      setLoading(false);
      return;
    }

    // 2. Crear unidades básicas (ej: 1A, 1B, 2A, 2B, 3A)
    const unitsToInsert = [
      { building_id: building.id, floor: "1", apartment: "A" },
      { building_id: building.id, floor: "1", apartment: "B" },
      { building_id: building.id, floor: "2", apartment: "A" },
      { building_id: building.id, floor: "2", apartment: "B" },
      { building_id: building.id, floor: "3", apartment: "A" }
    ];
    await supabase.from("units").insert(unitsToInsert);

    toast.success("Edificio creado exitosamente. El primer admin debe registrarse con el email: " + formData.admin_email);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-[#F2F2F2] w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Nuevo Edificio</h3>
            <button onClick={onClose} className="p-2 bg-white rounded-xl text-slate-400"><X size={20} /></button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black/5 font-bold"
                placeholder="Torre Palermo"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dirección</label>
              <input
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black/5 font-bold"
                placeholder="Av. Santa Fe 3400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Invitación</label>
                <input
                  required
                  value={formData.invite_code}
                  onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                  className="w-full p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black/5 font-mono font-bold uppercase"
                  placeholder="TORRE26"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Primer Admin</label>
                <input
                  required
                  type="email"
                  value={formData.admin_email}
                  onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  className="w-full p-4 bg-white rounded-2xl border-none focus:ring-2 focus:ring-black/5 font-bold"
                  placeholder="admin@torre.com"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-black text-white rounded-2xl font-black shadow-xl shadow-black/20 active:scale-[0.98] transition-all mt-4"
            >
              {loading ? "CREANDO..." : "CREAR EDIFICIO"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string, description: string }) {
  return (
    <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-slate-200">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
        <Check size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 font-medium">{description}</p>
    </div>
  );
}

function PayoutCard({ payout, onReview }: { payout: any, onReview: any }) {
  const account = payout.owner?.payout_accounts?.[0];
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-black text-lg text-slate-900">{payout.owner?.full_name}</h4>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            A liquidar: ${Number(payout.amount).toLocaleString('es-AR')}
          </p>
        </div>
        <button 
          onClick={() => copy(String(payout.amount))} 
          className="p-3 bg-slate-50 rounded-xl text-black hover:bg-slate-100 transition-colors"
          title="Copiar monto"
        >
          <DollarSign size={20} />
        </button>
      </div>

      {account ? (
        <div className="bg-slate-900 text-white p-6 rounded-[2rem] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Titular</p>
              <p className="font-bold text-sm">{account.holder_name}</p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{account.document_number}</p>
          </div>
          <div className="flex items-center justify-between group">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">CBU / Alias</p>
              <p className="font-mono text-xs">{account.cbu_or_alias}</p>
            </div>
            <button 
              onClick={() => copy(account.cbu_or_alias)} 
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Plus size={16} className="text-slate-400" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-800 border border-amber-100">
          El dueño aún no ha configurado sus datos de cobro.
        </div>
      )}

      <Button 
        onClick={() => onReview(payout.id, 'pagado')} 
        disabled={!account}
        className="w-full bg-black text-white rounded-[2rem] font-bold h-14 shadow-lg shadow-black/10 active:scale-[0.98] transition-all"
      >
        Transferencia realizada
      </Button>
    </div>
  );
}
