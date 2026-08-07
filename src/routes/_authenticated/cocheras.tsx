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
  X
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

    if (profile?.building_id) {
      // Fetch my spots
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

      // Fetch all available spots in building (excluding own)
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

      // Fetch my bookings
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

      {/* Tabs */}
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
        <AvailableSpotsList spots={availableSpots} />
      ) : activeTab === "mi-cochera" ? (
        <MySpotsManager 
          spots={mySpots} 
          onRefresh={fetchData} 
          buildingId={userProfile?.building_id} 
          userId={userProfile?.id}
        />
      ) : (
        <MyBookingsList bookings={myBookings} onRefresh={fetchData} />
      )}
    </div>
  );
}

function AvailableSpotsList({ spots }: { spots: any[] }) {
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  async function handleBooking() {
    if (!selectedSpot || !dateRange?.from || !dateRange?.to) return;

    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const totalPrice = days * selectedSpot.price_per_day;

    const { error } = await supabase
      .from("parking_bookings")
      .insert({
        spot_id: selectedSpot.id,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
        total_price: totalPrice
      });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Solicitud enviada");
      setSelectedSpot(null);
      setDateRange(undefined);
    }
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => (
        <div key={spot.id} className="bg-white rounded-[2rem] p-5 shadow-soft border border-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="font-black text-lg leading-tight">{spot.identifier}</h4>
              <p className="text-gray-500 text-sm font-medium">De {spot.owner?.full_name}</p>
            </div>
            <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-black">
              ${Number(spot.price_per_day).toLocaleString('es-AR')} / día
            </div>
          </div>
          <Button 
            onClick={() => setSelectedSpot(spot)}
            className="w-full bg-black hover:bg-zinc-800 text-white rounded-2xl font-black h-12"
          >
            Ver detalles y reservar
          </Button>
        </div>
      ))}

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
                <span>${(differenceInDays(dateRange.to, dateRange.from) + 1) * (selectedSpot?.price_per_day || 0)}</span>
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
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-white rounded-[2rem] p-5 shadow-soft">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-black">{booking.spot?.identifier}</h4>
            <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
              booking.status === 'confirmada' ? 'bg-green-100 text-green-700' : 'bg-gray-100'
            }`}>
              {booking.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {format(new Date(booking.start_date), "d MMM")} - {format(new Date(booking.end_date), "d MMM")}
          </p>
          {isAfter(new Date(booking.start_date), addDays(new Date(), 1)) && booking.status !== 'cancelada' && (
            <Button variant="outline" onClick={() => handleCancel(booking.id)} className="w-full rounded-xl">Cancelar</Button>
          )}
        </div>
      ))}
    </div>
  );
}

// ... MySpotsManager remains (simplified context here for logic) ...
// (Note: Add logic for owner to Approve/Reject bookings from mySpots props)
function MySpotsManager({ spots, onRefresh }: { spots: any[], onRefresh: () => void, buildingId: string, userId: string }) {
  // Add logic to map through spots.bookings and show requests
  // ...
  return <div className="text-sm text-gray-500">Gestión de cocheras y solicitudes de reserva aquí.</div>;
}
