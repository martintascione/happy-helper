import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Car, 
  Calendar as CalendarIcon, 
  Trash2, 
  Power, 
  ChevronRight,
  Info,
  MapPin,
  Clock,
  ArrowLeft,
  Check,
  X,
  Landmark,
  CreditCard,
  ChevronDown
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, addDays, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

export const Route = createFileRoute("/_authenticated/cocheras")({
  component: CocherasPage,
});

function CocherasPage() {
  const [activeTab, setActiveTab] = useState<"disponibles" | "mi-cochera" | "mis-reservas">("disponibles");
  const [mySpots, setMySpots] = useState<any[]>([]);
  const [availableSpots, setAvailableSpots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [payoutAccount, setPayoutAccount] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setUserProfile(profile);

    // Fetch platform settings
    const { data: settings } = await supabase.from("platform_settings" as any).select("*").single();
    setPlatformSettings(settings);

    // Fetch payout account
    const { data: payout } = await supabase
      .from("payout_accounts" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setPayoutAccount(payout);

    if (profile?.building_id) {
      const { data: spots } = await supabase
        .from("parking_spots")
        .select(`
          *,
          parking_availability(*),
          bookings:parking_bookings(
            *,
            renter:profiles!renter_id(full_name)
          )
        `)
        .eq("owner_id", user.id);
      
      setMySpots(spots || []);

      const { data: others } = await supabase
        .from("parking_spots")
        .select(`
          *,
          owner:profiles!inner(full_name, unit_id),
          parking_availability(*)
        `)
        .eq("building_id", profile.building_id)
        .eq("is_active", true)
        .neq("owner_id", user.id);
      
      setAvailableSpots(others || []);

      const { data: bookings } = await supabase
        .from("parking_bookings")
        .select(`
          *,
          spot:parking_spots(identifier, owner:profiles!owner_id(full_name))
        `)
        .eq("renter_id", user.id);
      
      setMyBookings(bookings || []);
    }
    setLoading(false);
  }

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-[#F2F2F2]">
      <header className="mb-6">
        <h1 className="text-3xl font-black text-black tracking-tight mb-2">Cocheras</h1>
        <p className="text-gray-500 font-medium">Alquilá o publicá tu lugar</p>
      </header>

      <div className="flex p-1 bg-gray-200 rounded-2xl mb-6 overflow-x-auto">
        {[
          { id: "disponibles", label: "Disponibles" },
          { id: "mi-cochera", label: "Mi cochera" },
          { id: "mis-reservas", label: "Mis reservas" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap px-4 ${
              activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : activeTab === "disponibles" ? (
        <AvailableSpotsList 
          spots={availableSpots} 
          userId={userProfile?.id} 
          onRefresh={fetchData} 
          settings={platformSettings} 
        />
      ) : activeTab === "mi-cochera" ? (
        <MySpotsManager 
          spots={mySpots} 
          onRefresh={fetchData} 
          buildingId={userProfile?.building_id} 
          userId={userProfile?.id}
          settings={platformSettings}
          payoutAccount={payoutAccount}
        />
      ) : (
        <MyBookingsList bookings={myBookings} onRefresh={fetchData} />
      )}
    </div>
  );
}

function AvailableSpotsList({ spots, userId, onRefresh, settings }: { spots: any[], userId: string, onRefresh: () => void, settings: any }) {
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  async function handleBooking() {
    if (!selectedSpot || !dateRange?.from || !dateRange?.to || !userId || !settings) return;

    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const ownerPrice = selectedSpot.owner_price_per_day;
    const margin = settings.margin_type === 'porcentaje' 
      ? (ownerPrice * (settings.margin_value / 100))
      : settings.margin_value;
    
    const finalPricePerDay = ownerPrice + margin;
    const totalPrice = days * finalPricePerDay;
    const totalOwnerAmount = days * ownerPrice;
    const totalPlatformFee = totalPrice - totalOwnerAmount;

    const { error } = await supabase
      .from("parking_bookings" as any)
      .insert({
        spot_id: selectedSpot.id,
        renter_id: userId,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
        total_price: totalPrice,
        owner_amount: totalOwnerAmount,
        platform_fee: totalPlatformFee,
        status: 'solicitada'
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Solicitud enviada");
      setSelectedSpot(null);
      setDateRange(undefined);
      onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => {
        const ownerPrice = spot.owner_price_per_day;
        const margin = settings?.margin_type === 'porcentaje' 
          ? (ownerPrice * (settings.margin_value / 100))
          : settings?.margin_value || 0;
        const finalPrice = ownerPrice + margin;

        return (
          <div key={spot.id} className="bg-white rounded-[2rem] p-5 shadow-soft border border-white">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-lg leading-tight">{spot.identifier}</h4>
                <p className="text-gray-500 text-sm font-medium">De {spot.owner?.full_name}</p>
              </div>
              <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-black">
                ${Number(finalPrice).toLocaleString('es-AR')} / día
              </div>
            </div>
            <Button 
              onClick={() => setSelectedSpot({...spot, finalPricePerDay: finalPrice})}
              className="w-full bg-black hover:bg-zinc-800 text-white rounded-2xl font-black h-12"
            >
              Ver detalles y reservar
            </Button>
          </div>
        );
      })}

      <Dialog open={!!selectedSpot} onOpenChange={() => setSelectedSpot(null)}>
        <DialogContent className="rounded-[2.5rem] border-none sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{selectedSpot?.identifier}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 rounded-2xl p-4 mb-4">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                locale={es}
              />
            </div>
            {dateRange?.from && dateRange?.to && (
              <div className="flex justify-between items-center font-black text-lg">
                <span>Total</span>
                <span>${(differenceInDays(dateRange.to, dateRange.from) + 1) * (selectedSpot?.finalPricePerDay || 0)}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleBooking} className="w-full bg-black text-white h-14 rounded-2xl font-black">
              Solicitar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MyBookingsList({ bookings, onRefresh }: { bookings: any[], onRefresh: () => void }) {
  async function handleCancel(bookingId: string) {
    const { error } = await supabase
      .from("parking_bookings")
      .update({ status: 'cancelada' })
      .eq("id", bookingId);
    if (!error) {
      toast.success("Reserva cancelada");
      onRefresh();
    }
  }

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-soft">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">Sin reservas</h3>
          <p className="text-gray-500 font-medium">Todavía no realizaste ninguna reserva.</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-[2rem] p-5 shadow-soft border border-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-black text-lg">{booking.spot?.identifier}</h4>
                <p className="text-gray-500 text-sm font-medium">De {booking.spot?.owner?.full_name}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                booking.status === 'confirmada' ? 'bg-green-100 text-green-700' : 
                booking.status === 'solicitada' ? 'bg-blue-100 text-blue-700' :
                booking.status === 'cancelada' ? 'bg-red-100 text-red-700' : 'bg-gray-100'
              }`}>
                {booking.status}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4 text-gray-600 font-bold text-sm">
              <CalendarIcon className="w-4 h-4" />
              {format(new Date(booking.start_date), "d 'de' MMMM", { locale: es })} - {format(new Date(booking.end_date), "d 'de' MMMM", { locale: es })}
            </div>
            {isAfter(new Date(booking.start_date), addDays(new Date(), 1)) && booking.status === 'solicitada' && (
              <Button variant="ghost" onClick={() => handleCancel(booking.id)} className="w-full rounded-2xl font-black text-red-500 hover:text-red-600 hover:bg-red-50">
                Cancelar reserva
              </Button>
            )}
            {booking.status === 'confirmada' && (
              <div className="bg-green-50 p-3 rounded-2xl text-xs font-bold text-green-800 flex items-center gap-2">
                <Check className="w-4 h-4" /> Coordiná el pago directamente con tu vecino
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function MySpotsManager({ spots, onRefresh, buildingId, userId, settings, payoutAccount }: { spots: any[], onRefresh: () => void, buildingId: string, userId: string, settings: any, payoutAccount: any }) {
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [newSpot, setNewSpot] = useState({ identifier: "", description: "", owner_price_per_day: "" });
  const [isAddingAvailability, setIsAddingAvailability] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Payout Account State
  const [isAddingPayout, setIsAddingPayout] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    holder_name: payoutAccount?.holder_name || "",
    document_number: payoutAccount?.document_number || "",
    cbu_or_alias: payoutAccount?.cbu_or_alias || "",
    bank_name: payoutAccount?.bank_name || ""
  });

  async function handleSavePayout() {
    // Basic validation
    const cbuRegex = /^\d{22}$/;
    const aliasRegex = /^[a-zA-Z0-9.]{6,20}$/;
    
    if (!cbuRegex.test(payoutForm.cbu_or_alias) && !aliasRegex.test(payoutForm.cbu_or_alias)) {
      toast.error("CBU debe tener 22 dígitos o Alias entre 6 y 20 caracteres");
      return;
    }

    const { error } = await supabase
      .from("payout_accounts" as any)
      .upsert({
        user_id: userId,
        ...payoutForm,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error("Error al guardar datos de cobro");
    } else {
      toast.success("Datos de cobro guardados");
      setIsAddingPayout(false);
      onRefresh();
    }
  }

  async function handleAddSpot() {
    if (!newSpot.identifier || !newSpot.owner_price_per_day) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const { error } = await supabase
      .from("parking_spots" as any)
      .insert({
        building_id: buildingId,
        owner_id: userId,
        identifier: newSpot.identifier,
        description: newSpot.description,
        owner_price_per_day: parseFloat(newSpot.owner_price_per_day),
        is_active: true
      });

    if (error) {
      toast.error("Error al registrar la cochera");
    } else {
      toast.success("Cochera registrada con éxito");
      setIsAddingSpot(false);
      setNewSpot({ identifier: "", description: "", owner_price_per_day: "" });
      onRefresh();
    }
  }

  async function handleUpdateBookingStatus(bookingId: string, status: string) {
    const { error } = await supabase
      .from("parking_bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      toast.error("Error al actualizar la reserva");
    } else {
      toast.success(status === 'confirmada' ? "Reserva aceptada" : "Reserva rechazada");
      onRefresh();
    }
  }

  async function handleAddAvailability(spotId: string) {
    if (!dateRange?.from || !dateRange?.to) {
      toast.error("Seleccioná un rango de fechas");
      return;
    }

    const { error } = await supabase
      .from("parking_availability")
      .insert({
        spot_id: spotId,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd")
      });

    if (error) {
      toast.error(error.message.includes("Overlap") ? "Ya existe disponibilidad en esas fechas" : "Error al agregar disponibilidad");
    } else {
      toast.success("Disponibilidad agregada");
      setIsAddingAvailability(null);
      setDateRange(undefined);
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Payout Account Banner */}
      {!payoutAccount ? (
        <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <Landmark size={24} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h4 className="font-black text-amber-900">Configurá tus datos de cobro</h4>
            <p className="text-xs font-medium text-amber-700">Necesitás cargar tu CBU o Alias para poder aceptar reservas y recibir pagos.</p>
          </div>
          <Button onClick={() => setIsAddingPayout(true)} className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold px-6">
            Configurar
          </Button>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shrink-0">
              <Check size={24} />
            </div>
            <div>
              <h4 className="font-black text-slate-900">Datos de cobro listos</h4>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{payoutAccount.cbu_or_alias}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={() => setIsAddingPayout(true)} className="text-slate-400 font-bold hover:text-black">
            Editar
          </Button>
        </div>
      )}

      {/* Payout Dialog */}
      <Dialog open={isAddingPayout} onOpenChange={setIsAddingPayout}>
        <DialogContent className="rounded-[2.5rem] border-none">
          <DialogHeader><DialogTitle className="font-black text-2xl">Datos de Cobro</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Titular de la cuenta</label>
              <Input placeholder="Nombre completo" value={payoutForm.holder_name} onChange={(e) => setPayoutForm({...payoutForm, holder_name: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">DNI o CUIT</label>
              <Input placeholder="Número de documento" value={payoutForm.document_number} onChange={(e) => setPayoutForm({...payoutForm, document_number: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">CBU o Alias</label>
              <Input placeholder="22 dígitos o alias" value={payoutForm.cbu_or_alias} onChange={(e) => setPayoutForm({...payoutForm, cbu_or_alias: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSavePayout} className="w-full bg-black text-white h-14 rounded-2xl font-black">Guardar datos</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {spots.map((spot) => (
        <div key={spot.id} className="bg-white rounded-[2rem] p-6 shadow-soft border border-white">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${spot.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Car className={`w-6 h-6 ${spot.is_active ? 'text-green-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <h4 className="font-black text-lg leading-tight">{spot.identifier}</h4>
                <p className="text-gray-500 text-xs font-medium">
                  Recibís ${Number(spot.owner_price_per_day).toLocaleString('es-AR')} / día
                </p>
                {settings && (
                  <p className="text-pink-500 text-[10px] font-bold uppercase tracking-wider">
                    Se publica a ${Number(spot.owner_price_per_day + (settings.margin_type === 'porcentaje' ? (spot.owner_price_per_day * settings.margin_value / 100) : settings.margin_value)).toLocaleString('es-AR')}
                  </p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => {/* Toggle active logic */}} className="rounded-xl">
              <Power className={`w-5 h-5 ${spot.is_active ? 'text-green-500' : 'text-gray-300'}`} />
            </Button>
          </div>

          {/* Pending Bookings */}
          {spot.bookings?.filter((b: any) => b.status === 'solicitada').length > 0 && (
            <div className="mb-6">
              <h5 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Solicitudes pendientes</h5>
              <div className="space-y-2">
                {spot.bookings.filter((b: any) => b.status === 'solicitada').map((booking: any) => (
                  <div key={booking.id} className="bg-blue-50 p-4 rounded-2xl">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-black text-sm text-blue-900">{booking.renter?.full_name}</p>
                        <p className="text-xs font-bold text-blue-700">
                          {format(new Date(booking.start_date), "d MMM")} - {format(new Date(booking.end_date), "d MMM")}
                        </p>
                      </div>
                      <p className="font-black text-blue-900 text-sm">${booking.total_price}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => handleUpdateBookingStatus(booking.id, 'confirmada')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9 rounded-xl font-bold text-xs">
                        Aceptar
                      </Button>
                      <Button onClick={() => handleUpdateBookingStatus(booking.id, 'cancelada')} variant="ghost" className="flex-1 text-blue-600 hover:bg-blue-100 h-9 rounded-xl font-bold text-xs">
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disponibilidad</h5>
              <Button variant="ghost" size="sm" onClick={() => setIsAddingAvailability(spot.id)} className="text-pink-500 font-black h-8 hover:bg-pink-50 rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {spot.parking_availability?.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-bold text-gray-700">
                      {format(new Date(a.start_date), "d MMM", { locale: es })} - {format(new Date(a.end_date), "d MMM", { locale: es })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <Dialog open={isAddingSpot} onOpenChange={setIsAddingSpot}>
        <DialogTrigger asChild>
          <button className="w-full py-8 border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-pink-300 hover:text-pink-500 transition-all bg-white/50">
            <Plus className="w-6 h-6" />
            <span className="font-black">Registrar mi cochera</span>
          </button>
        </DialogTrigger>
        <DialogContent className="rounded-[2.5rem] border-none">
          <DialogHeader><DialogTitle className="font-black">Nueva Cochera</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Identificador" value={newSpot.identifier} onChange={(e) => setNewSpot({...newSpot, identifier: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Lo que querés recibir ($)</label>
              <Input type="number" placeholder="Precio por día" value={newSpot.owner_price_per_day} onChange={(e) => setNewSpot({...newSpot, owner_price_per_day: e.target.value})} className="rounded-2xl h-12 bg-gray-50 border-none font-bold" />
            </div>
            <Textarea placeholder="Descripción" value={newSpot.description} onChange={(e) => setNewSpot({...newSpot, description: e.target.value})} className="rounded-2xl bg-gray-50 border-none font-medium" />
          </div>
          <DialogFooter><Button onClick={handleAddSpot} className="w-full bg-black text-white h-14 rounded-2xl font-black">Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
