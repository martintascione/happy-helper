import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { InfoBanner } from "@/components/InfoBanner";
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
  ChevronDown,
  Wallet,
  History,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  Circle
} from "lucide-react";
import { AgreementModal } from "@/components/AgreementModal";
import { format, isAfter, isBefore, startOfDay, addDays, differenceInDays, isSameDay, getDay } from "date-fns";
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
  const [activeTab, setActiveTab] = useState<"disponibles" | "mi-cochera" | "mis-reservas" | "mis-cobros">("disponibles");
  const [mySpots, setMySpots] = useState<any[]>([]);
  const [availableSpots, setAvailableSpots] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [platformSettings, setPlatformSettings] = useState<any>(null);
  const [payoutAccount, setPayoutAccount] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));

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

  const nextBooking = useMemo(() => {
    return myBookings
      .filter(b => b.status === 'confirmada' && isAfter(new Date(b.end_date), new Date()))
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
  }, [myBookings]);

  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 30 }, (_, i) => addDays(today, i));
  }, []);

  return (
    <div className="pb-24 pt-4 px-4 min-h-screen bg-background">
      <header className="px-1 space-y-1 mb-8">
        <h1 className="text-3xl font-semibold text-black tracking-tight">Cocheras</h1>
        <p className="text-slate-400 font-medium">Alquilá o publicá tu lugar</p>
      </header>

      {/* Featured Next Booking */}
      {nextBooking && (
        <div className="mb-8 p-6 rounded-[24px] bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent border border-green-500/20 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Próxima Reserva</span>
              <h3 className="text-xl font-bold text-slate-900">{nextBooking.spot?.identifier}</h3>
              <p className="text-sm font-medium text-slate-500">
                {format(new Date(nextBooking.start_date), "d 'de' MMMM", { locale: es })}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Car className="text-green-500" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="mb-8 -mx-4">
        <div className="flex gap-4 overflow-x-auto px-4 pb-2 no-scrollbar">
          {weekDays.map((date) => {
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());
            
            // Check availability for this specific day
            const hasAvailability = availableSpots.some(spot => 
              spot.parking_availability?.some((av: any) => {
                const start = startOfDay(new Date(av.start_date));
                const end = startOfDay(new Date(av.end_date));
                return !isBefore(date, start) && !isAfter(date, end);
              })
            );

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-full transition-all relative ${
                  isSelected ? "bg-black text-white shadow-xl" : "bg-white text-slate-400 border border-slate-100"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${isSelected ? "text-slate-400" : "text-slate-300"}`}>
                  {format(date, "EEE", { locale: es }).substring(0, 1)}
                </span>
                <span className="text-lg font-bold">{format(date, "d")}</span>
                {hasAvailability && !isSelected && (
                  <div className="absolute bottom-2 w-1.5 h-1.5 bg-green-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: "disponibles", label: "Disponibles" },
          { id: "mis-reservas", label: "Mis Reservas" },
          { id: "mi-cochera", label: "Mi Cochera" },
          { id: "mis-cobros", label: "Mis Cobros" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 text-[10px] font-black uppercase rounded-full transition-all whitespace-nowrap ${
              activeTab === tab.id ? "bg-black text-white shadow-lg" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
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
      ) : activeTab === "mis-reservas" ? (
        <MyBookingsList bookings={myBookings} onRefresh={fetchData} settings={platformSettings} />
      ) : (
        <MyPayoutsList userId={userProfile?.id} />
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

  const [showBookingAgreement, setShowBookingAgreement] = useState(false);
  const bookingAgreementItems = [
    { text: "Voy a usar la cochera únicamente para un vehículo propio o a mi cargo, dentro de las fechas reservadas. No puedo ceder, prestar ni transferir la reserva a terceros que no vivan en el edificio." },
    { text: "Me comprometo a respetar las indicaciones del dueño (altura máxima, tipo de cochera) y las normas del edificio." },
    { text: "El pago se hace únicamente por los medios oficiales de la app. Nunca voy a transferir a cuentas personales de otros vecinos." },
    { text: "Puedo cancelar gratis hasta 24 horas antes del inicio. Después de ese plazo, la reserva se cobra igual." },
    { text: "Entiendo que Comunidad Tower actúa como intermediaria y que cualquier daño o incidente se resuelve entre las partes." }
  ];

  return (
    <div className="space-y-6">
      {spots.map((spot) => {
        const ownerPrice = spot.owner_price_per_day;
        const margin = settings?.margin_type === 'porcentaje' 
          ? (ownerPrice * (settings.margin_value / 100))
          : settings?.margin_value || 0;
        const finalPrice = ownerPrice + margin;

        return (
          <div key={spot.id} className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/50 space-y-6">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h4 className="font-bold text-xl text-slate-900">{spot.identifier}</h4>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                    {spot.owner?.avatar_url ? (
                      <img src={spot.owner.avatar_url} className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className="text-slate-400" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs font-medium">{spot.owner?.full_name}</p>
                </div>
              </div>
              <div className="tint-positive px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                Disponible
              </div>
            </div>

            <div className="flex items-end gap-1">
              <span className="text-3xl font-bold text-slate-900">${Number(finalPrice).toLocaleString('es-AR')}</span>
              <span className="text-slate-400 text-sm font-medium mb-1.5">/ día</span>
            </div>

            <Button 
              onClick={() => setSelectedSpot({...spot, finalPricePerDay: finalPrice})}
              className="w-full bg-black hover:bg-zinc-800 text-white rounded-[20px] font-bold h-14 active:scale-[0.98] transition-all"
            >
              Ver disponibilidad
            </Button>
          </div>
        );
      })}

      <Dialog open={!!selectedSpot} onOpenChange={() => setSelectedSpot(null)}>
        <DialogContent className="rounded-[28px] border-none sm:max-w-[425px] p-8">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold tracking-tight">{selectedSpot?.identifier}</DialogTitle>
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
            <Button onClick={() => setShowBookingAgreement(true)} className="w-full bg-black text-white h-16 rounded-[20px] font-bold text-lg shadow-xl shadow-black/10 active:scale-95 transition-all">
              Confirmar Reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AgreementModal
        isOpen={showBookingAgreement}
        onClose={() => setShowBookingAgreement(false)}
        onAccept={handleBooking}
        title="Compromiso de uso"
        agreementKey="reservar_cochera"
        items={bookingAgreementItems}
      />

      {selectedSpot && (
        <div className="mt-4">
          <InfoBanner 
            variant="info" 
            text="Comunidad Tower conecta vecinos del mismo edificio. El alquiler a personas que no viven en el edificio está prohibido y puede implicar la baja de la cuenta." 
          />
        </div>
      )}
    </div>
  );
}

function MyBookingsList({ bookings, onRefresh, settings }: { bookings: any[], onRefresh: () => void, settings: any }) {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'mercadopago'>('transferencia');
  const [payments, setPayments] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchPayments();
  }, [bookings]);

  async function fetchPayments() {
    if (bookings.length === 0) return;
    const bookingIds = bookings.map(b => b.id);
    const { data } = await supabase
      .from("parking_payments" as any)
      .select("*")
      .in("booking_id", bookingIds);
    
    if (data) {
      const pMap: Record<string, any> = {};
      (data as any[]).forEach(p => {
        // If there are multiple, preferred order: aprobado > en_revision > rechazado > pendiente
        if (!pMap[p.booking_id] || p.status === 'aprobado' || (pMap[p.booking_id].status !== 'aprobado' && p.status === 'en_revision')) {
          pMap[p.booking_id] = p;
        }
      });
      setPayments(pMap);
    }
  }

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, booking: any) {
    const file = e.target.files?.[0];
    if (!file || !settings) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${booking.renter_id}/${booking.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: paymentError } = await supabase
        .from("parking_payments" as any)
        .upsert({
          booking_id: booking.id,
          method: 'transferencia',
          amount: booking.total_price,
          receipt_url: filePath,
          status: 'en_revision',
          updated_at: new Date().toISOString()
        }, { onConflict: 'booking_id' });

      if (paymentError) throw paymentError;

      toast.success("Comprobante subido. En revisión.");
      setSelectedBooking(null);
      onRefresh();
    } catch (error: any) {
      toast.error("Error al subir: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado");
  };

  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-8 text-center shadow-soft">
          <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">Sin reservas</h3>
          <p className="text-gray-500 font-medium">Todavía no realizaste ninguna reserva.</p>
        </div>
      ) : (
        bookings.map((booking) => {
          const payment = payments[booking.id];
          const isPendingPayment = booking.status === 'solicitada' && (!payment || payment.status === 'rechazado' || payment.status === 'pendiente');

          return (
            <div key={booking.id} className="bg-white rounded-[24px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white/50 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h4 className="font-bold text-xl text-slate-900">{booking.spot?.identifier}</h4>
                  <p className="text-slate-400 text-xs font-medium">De {booking.spot?.owner?.full_name}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  booking.status === 'confirmada' ? 'tint-positive' : 
                  booking.status === 'solicitada' ? 'tint-warning' :
                  booking.status === 'en_curso' ? 'tint-info' :
                  booking.status === 'finalizada' ? 'bg-slate-100 text-slate-400' :
                  booking.status === 'cancelada' ? 'tint-error' : 'bg-slate-50 text-slate-300'
                }`}>
                  {booking.status === 'solicitada' && payment?.status === 'en_revision' ? 'Revisando Pago' : 
                   booking.status === 'solicitada' ? 'Por Pagar' : booking.status}
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-600 font-bold text-sm">
                <CalendarIcon className="w-4 h-4" />
                {format(new Date(booking.start_date), "d 'de' MMMM", { locale: es })} - {format(new Date(booking.end_date), "d 'de' MMMM", { locale: es })}
              </div>

              {payment?.status === 'rechazado' && (
                <div className="bg-red-50 p-3 rounded-2xl text-xs font-bold text-red-800 border border-red-100">
                  Pago rechazado: {payment.reject_reason || "Comprobante inválido"}. Por favor reintentá.
                </div>
              )}

              {isPendingPayment && (
                <Button 
                  onClick={() => setSelectedBooking(booking)}
                  className="w-full bg-accent hover:bg-green-600 text-white h-12 rounded-2xl font-black shadow-lg shadow-accent/20"
                >
                  Pagar reserva (${Number(booking.total_price).toLocaleString('es-AR')})
                </Button>
              )}

              {payment?.status === 'en_revision' && (
                <div className="bg-blue-50 p-3 rounded-2xl text-xs font-bold text-blue-800 flex items-center gap-2 border border-blue-100">
                  <Clock className="w-4 h-4" /> Comprobante en revisión
                </div>
              )}

              {booking.status === 'solicitada' && !payment && (
                <Button variant="ghost" onClick={() => handleCancel(booking.id)} className="w-full rounded-2xl font-black text-red-500 hover:text-red-600 hover:bg-red-50">
                  Cancelar reserva
                </Button>
              )}
            </div>
          );
        })
      )}

      {/* Payment Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="rounded-[2.5rem] border-none sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Pagar Reserva</DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button 
                onClick={() => setPaymentMethod('transferencia')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${paymentMethod === 'transferencia' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
              >
                Transferencia
              </button>
              <button 
                onClick={() => setPaymentMethod('mercadopago')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${paymentMethod === 'mercadopago' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
              >
                Mercado Pago
              </button>
            </div>

            {paymentMethod === 'transferencia' ? (
              <div className="space-y-6">
                <InfoBanner 
                  variant="seguridad" 
                  text="Transferí únicamente a la cuenta oficial que ves en esta pantalla. Nadie de Comunidad Tower te va a pedir por chat ni por ningún otro medio que transfieras a otra cuenta. Subir un comprobante adulterado implica la baja de la cuenta." 
                />
                
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Datos para transferir</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Titular</p>
                        <p className="font-bold text-sm">{settings?.transfer_holder_name}</p>
                      </div>
                      <button onClick={() => copyToClipboard(settings?.transfer_holder_name)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">CBU</p>
                        <p className="font-mono text-xs">{settings?.transfer_cbu}</p>
                      </div>
                      <button onClick={() => copyToClipboard(settings?.transfer_cbu)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>
                    <div className="flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Alias</p>
                        <p className="font-bold text-sm">{settings?.transfer_alias}</p>
                      </div>
                      <button onClick={() => copyToClipboard(settings?.transfer_alias)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><Plus size={16}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-bold text-slate-900 ml-1">Subí tu comprobante</p>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-[2rem] hover:bg-slate-50 cursor-pointer transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Plus className="w-8 h-8 text-gray-400 mb-2" />
                      <p className="text-xs font-bold text-gray-500">{uploading ? "Subiendo..." : "Imagen o PDF"}</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, selectedBooking)} disabled={uploading} />
                  </label>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-lg font-bold">Mercado Pago</h3>
                <p className="text-sm text-gray-500 font-medium px-4">Esta opción estará disponible próximamente.</p>
                <Button disabled className="w-full bg-blue-600 opacity-50 h-14 rounded-2xl">Continuar con Mercado Pago</Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MySpotsManager({ spots, onRefresh, buildingId, userId, settings, payoutAccount }: { spots: any[], onRefresh: () => void, buildingId: string, userId: string, settings: any, payoutAccount: any }) {
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [newSpot, setNewSpot] = useState({ identifier: "", description: "", owner_price_per_day: "" });
  const [isAddingAvailability, setIsAddingAvailability] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [payments, setPayments] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchPayments();
  }, [spots]);

  async function fetchPayments() {
    const bookingIds = spots.flatMap(s => s.bookings?.map((b: any) => b.id) || []);
    if (bookingIds.length === 0) return;
    
    const { data } = await supabase
      .from("parking_payments" as any)
      .select("*")
      .in("booking_id", bookingIds);
    
    if (data) {
      const pMap: Record<string, any> = {};
      (data as any[]).forEach(p => {
        if (!pMap[p.booking_id] || p.status === 'aprobado' || (pMap[p.booking_id].status !== 'aprobado' && p.status === 'en_revision')) {
          pMap[p.booking_id] = p;
        }
      });
      setPayments(pMap);
    }
  }
  
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

  const [showPublishAgreement, setShowPublishAgreement] = useState(false);
  const publishAgreementItems = [
    { text: "Me comprometo a alquilar la cochera únicamente a vecinos que viven en el edificio y que ya tienen acceso a él. Queda prohibido ofrecerla, alquilarla o cederla a terceros que no vivan en el edificio." },
    { text: "Declaro que tengo derecho de uso sobre la cochera que publico y que los datos que cargo (ubicación, medidas, precio) son reales." },
    { text: "El cobro se realiza únicamente a través de los medios oficiales de la app. No voy a aceptar ni pedir pagos por fuera." },
    { text: "Entiendo que Comunidad Tower actúa como intermediaria entre vecinos y no se responsabiliza por daños, robos o incidentes en la cochera. Es mi responsabilidad verificar la cobertura de mi seguro." }
  ];

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
          <div className="space-y-6 py-4">
            <InfoBanner 
              variant="info" 
              text="Tus datos bancarios se usan únicamente para transferirte tus cobros. Solo los ve la administración de la plataforma: nunca se muestran a otros vecinos." 
            />
            <div className="space-y-4">
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
                  <p className="text-accent text-[10px] font-bold uppercase tracking-wider">
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
                {spot.bookings.filter((b: any) => b.status === 'solicitada').map((booking: any) => {
                  const payment = (payments as any)[booking.id];
                  const isPaid = payment?.status === 'aprobado';
                  const isReviewing = payment?.status === 'en_revision';

                  return (
                    <div key={booking.id} className="bg-blue-50 p-4 rounded-2xl space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-black text-sm text-blue-900">{booking.renter?.full_name}</p>
                            {isPaid && <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full uppercase font-black">Pagado</span>}
                            {isReviewing && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase font-black">Revisando Pago</span>}
                          </div>
                          <p className="text-xs font-bold text-blue-700">
                            {format(new Date(booking.start_date), "d MMM")} - {format(new Date(booking.end_date), "d MMM")}
                          </p>
                        </div>
                        <p className="font-black text-blue-900 text-sm">${Number(booking.total_price).toLocaleString('es-AR')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateBookingStatus(booking.id, 'confirmada')} 
                          className={`flex-1 ${isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white h-9 rounded-xl font-bold text-xs`}
                        >
                          {isPaid ? 'Aceptar Reserva (Pagada)' : 'Aceptar Reserva'}
                        </Button>
                        <Button onClick={() => handleUpdateBookingStatus(booking.id, 'cancelada')} variant="ghost" className="flex-1 text-blue-600 hover:bg-blue-100 h-9 rounded-xl font-bold text-xs">
                          Rechazar
                        </Button>
                      </div>
                    </div>
                  );
                })}
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
          <DialogFooter><Button onClick={() => setShowPublishAgreement(true)} className="w-full bg-black text-white h-14 rounded-2xl font-black">Guardar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AgreementModal
        isOpen={showPublishAgreement}
        onClose={() => setShowPublishAgreement(false)}
        onAccept={handleAddSpot}
        title="Compromiso de publicación"
        agreementKey="publicar_cochera"
        items={publishAgreementItems}
      />
    </div>
  );
}

function MyPayoutsList({ userId }: { userId: string }) {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayouts();
  }, [userId]);

  async function fetchPayouts() {
    setLoading(true);
    const { data } = await supabase
      .from("parking_payouts" as any)
      .select(`
        *,
        booking:parking_bookings(
          id,
          start_date,
          end_date,
          spot:parking_spots(identifier)
        )
      `)
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) setPayouts(data);
    setLoading(false);
  }

  const pendingAmount = payouts
    .filter(p => p.status === 'pendiente')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const totalPaid = payouts
    .filter(p => p.status === 'pagado')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  if (loading) return <div className="p-8 text-center font-bold text-gray-400">Cargando...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl shadow-black/20 space-y-6">
        <div className="flex items-center gap-3 opacity-60">
          <Wallet size={20} />
          <p className="text-xs font-bold uppercase tracking-widest">Pendiente de cobro</p>
        </div>
        <h2 className="text-4xl font-black">${pendingAmount.toLocaleString('es-AR')}</h2>
        <div className="pt-6 border-t border-white/10 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Cobrado</p>
            <p className="font-bold text-lg">${totalPaid.toLocaleString('es-AR')}</p>
          </div>
          <TrendingUp className="text-green-500" size={24} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History size={18} className="text-gray-400" />
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Historial</h3>
        </div>
        
        {payouts.length === 0 ? (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">Aún no tenés cobros registrados.</p>
          </div>
        ) : (
          payouts.map((payout) => (
            <div key={payout.id} className="bg-white p-5 rounded-[2rem] shadow-soft border border-white space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">{payout.booking?.spot?.identifier}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">
                    {format(new Date(payout.booking?.start_date), "d MMM")} - {format(new Date(payout.booking?.end_date), "d MMM")}
                  </p>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                  payout.status === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {payout.status}
                </div>
              </div>
              <div className="flex justify-between items-end pt-1">
                <p className="font-black text-lg text-slate-900">${Number(payout.amount).toLocaleString('es-AR')}</p>
                {payout.paid_at && (
                  <p className="text-[8px] font-bold text-gray-400">Pagado el {format(new Date(payout.paid_at), "d/MM/yy")}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
