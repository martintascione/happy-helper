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
  ArrowLeft
} from "lucide-react";
import { format, isAfter, isBefore, startOfDay, addDays } from "date-fns";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";

export const Route = createFileRoute("/_authenticated/cocheras")({
  component: CocherasPage,
});

function CocherasPage() {
  const [activeTab, setActiveTab] = useState<"disponibles" | "mi-cochera">("disponibles");
  const [mySpots, setMySpots] = useState<any[]>([]);
  const [availableSpots, setAvailableSpots] = useState<any[]>([]);
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
          parking_availability(*)
        `)
        .eq("owner_id", user.id);
      
      setMySpots(spots || []);

      // Fetch all available spots in building (excluding own)
      const today = new Date().toISOString().split('T')[0];
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

      // Filter spots that have at least one future or current availability
      const filteredOthers = others?.filter(spot => 
        spot.parking_availability.some((a: any) => isAfter(new Date(a.end_date), addDays(new Date(), -1)))
      ) || [];
      
      setAvailableSpots(filteredOthers);
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
      <div className="flex p-1 bg-gray-200 rounded-2xl mb-6">
        <button
          onClick={() => setActiveTab("disponibles")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === "disponibles" ? "bg-white text-black shadow-sm" : "text-gray-500"
          }`}
        >
          Disponibles
        </button>
        <button
          onClick={() => setActiveTab("mi-cochera")}
          className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
            activeTab === "mi-cochera" ? "bg-white text-black shadow-sm" : "text-gray-500"
          }`}
        >
          Mi cochera
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
        </div>
      ) : activeTab === "disponibles" ? (
        <AvailableSpotsList spots={availableSpots} />
      ) : (
        <MySpotsManager 
          spots={mySpots} 
          onRefresh={fetchData} 
          buildingId={userProfile?.building_id} 
          userId={userProfile?.id}
        />
      )}
    </div>
  );
}

function AvailableSpotsList({ spots }: { spots: any[] }) {
  if (spots.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-8 text-center shadow-soft">
        <Car className="w-12 h-12 text-pink-200 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-black mb-2">No hay cocheras</h3>
        <p className="text-gray-500">Por el momento no hay cocheras disponibles en tu edificio.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {spots.map((spot) => (
        <div key={spot.id} className="bg-white rounded-[2rem] p-5 shadow-soft border border-white">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Car className="w-6 h-6 text-black" />
              </div>
              <div>
                <h4 className="font-black text-lg leading-tight">{spot.identifier}</h4>
                <p className="text-gray-500 text-sm font-medium">De {spot.owner?.full_name}</p>
              </div>
            </div>
            <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-xs font-black">
              ${Number(spot.price_per_day).toLocaleString('es-AR')} / día
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {spot.description || "Sin descripción adicional."}
          </p>

          <div className="space-y-2">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Próximas fechas libres</p>
            <div className="flex flex-wrap gap-2">
              {spot.parking_availability
                .filter((a: any) => isAfter(new Date(a.end_date), addDays(new Date(), -1)))
                .slice(0, 2)
                .map((a: any) => (
                <div key={a.id} className="bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3 text-gray-400" />
                  <span className="text-xs font-bold text-gray-700">
                    {format(new Date(a.start_date), "d MMM", { locale: es })} - {format(new Date(a.end_date), "d MMM", { locale: es })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <Button className="w-full mt-5 bg-black hover:bg-zinc-800 text-white rounded-2xl font-black h-12">
            Ver detalles
          </Button>
        </div>
      ))}
    </div>
  );
}

function MySpotsManager({ spots, onRefresh, buildingId, userId }: { spots: any[], onRefresh: () => void, buildingId: string, userId: string }) {
  const [isAddingSpot, setIsAddingSpot] = useState(false);
  const [newSpot, setNewSpot] = useState({ identifier: "", description: "", price_per_day: "" });
  const [isAddingAvailability, setIsAddingAvailability] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  async function handleAddSpot() {
    if (!newSpot.identifier || !newSpot.price_per_day) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    const { error } = await supabase
      .from("parking_spots")
      .insert({
        building_id: buildingId,
        owner_id: userId,
        identifier: newSpot.identifier,
        description: newSpot.description,
        price_per_day: parseFloat(newSpot.price_per_day),
        is_active: true
      });

    if (error) {
      toast.error("Error al registrar la cochera");
    } else {
      toast.success("Cochera registrada con éxito");
      setIsAddingSpot(false);
      setNewSpot({ identifier: "", description: "", price_per_day: "" });
      onRefresh();
    }
  }

  async function handleToggleActive(spot: any) {
    const { error } = await supabase
      .from("parking_spots")
      .update({ is_active: !spot.is_active })
      .eq("id", spot.id);

    if (error) {
      toast.error("Error al actualizar el estado");
    } else {
      toast.success(spot.is_active ? "Cochera pausada" : "Cochera activada");
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

  async function handleDeleteAvailability(id: string) {
    const { error } = await supabase
      .from("parking_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar la ventana");
    } else {
      toast.success("Ventana eliminada");
      onRefresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* List of my spots */}
      <div className="space-y-4">
        {spots.map((spot) => (
          <div key={spot.id} className="bg-white rounded-[2rem] p-6 shadow-soft">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${spot.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Car className={`w-6 h-6 ${spot.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h4 className="font-black text-lg leading-tight">{spot.identifier}</h4>
                  <p className="text-gray-500 text-sm font-medium">${spot.price_per_day} / día</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleToggleActive(spot)}
                className={`rounded-xl ${spot.is_active ? 'text-gray-400 hover:text-orange-500' : 'text-green-500'}`}
              >
                <Power className="w-5 h-5" />
              </Button>
            </div>

            {/* Availability Windows */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-widest">Disponibilidad</h5>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsAddingAvailability(spot.id)}
                  className="text-pink-500 font-black h-8 hover:bg-pink-50 rounded-xl"
                >
                  <Plus className="w-4 h-4 mr-1" /> Agregar
                </Button>
              </div>
              
              <div className="space-y-2">
                {spot.parking_availability?.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No tenés fechas publicadas</p>
                ) : (
                  spot.parking_availability.map((a: any) => {
                    const isFuture = isAfter(new Date(a.end_date), new Date());
                    return (
                      <div key={a.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-bold text-gray-700">
                            {format(new Date(a.start_date), "d MMM", { locale: es })} - {format(new Date(a.end_date), "d MMM", { locale: es })}
                          </span>
                        </div>
                        {isFuture && (
                          <button 
                            onClick={() => handleDeleteAvailability(a.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Add Availability Modal inside Spot Card */}
            {isAddingAvailability === spot.id && (
              <div className="mt-4 p-4 border-2 border-dashed border-gray-200 rounded-3xl bg-gray-50">
                <p className="text-sm font-black mb-3">Seleccioná las fechas</p>
                <div className="bg-white rounded-2xl p-2 mb-4 border border-gray-100 overflow-hidden">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={new Date()}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    disabled={(date) => isBefore(date, startOfDay(new Date()))}
                    locale={es}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-black text-white font-black rounded-xl"
                    onClick={() => handleAddAvailability(spot.id)}
                  >
                    Confirmar
                  </Button>
                  <Button 
                    variant="ghost"
                    className="rounded-xl font-bold"
                    onClick={() => { setIsAddingAvailability(null); setDateRange(undefined); }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Empty state or Button to add first spot */}
        <Dialog open={isAddingSpot} onOpenChange={setIsAddingSpot}>
          <DialogTrigger asChild>
            <button className="w-full py-8 border-2 border-dashed border-gray-300 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-pink-300 hover:text-pink-500 transition-all bg-white/50">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <span className="font-black text-lg">Registrar mi cochera</span>
            </button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Tu Cochera</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-500">Identificador</label>
                <Input 
                  placeholder="Ej: Cochera 12, 1er subsuelo" 
                  value={newSpot.identifier}
                  onChange={(e) => setNewSpot({...newSpot, identifier: e.target.value})}
                  className="rounded-2xl h-12 bg-gray-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-500">Precio por día ($)</label>
                <Input 
                  type="number" 
                  placeholder="Ej: 2500" 
                  value={newSpot.price_per_day}
                  onChange={(e) => setNewSpot({...newSpot, price_per_day: e.target.value})}
                  className="rounded-2xl h-12 bg-gray-50 border-none font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-500">Descripción (opcional)</label>
                <Textarea 
                  placeholder="Altura máxima, si es fija o móvil, etc." 
                  value={newSpot.description}
                  onChange={(e) => setNewSpot({...newSpot, description: e.target.value})}
                  className="rounded-2xl bg-gray-50 border-none font-medium min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddSpot}
                className="w-full bg-black text-white h-14 rounded-2xl font-black text-lg"
              >
                Guardar Cochera
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-pink-50 p-6 rounded-[2rem] border border-pink-100">
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Info className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <h5 className="font-black text-pink-600 mb-1">¿Cómo funciona?</h5>
            <p className="text-sm text-pink-700/70 font-medium leading-relaxed">
              Publicá los días que no usás tu cochera. Los vecinos podrán verla y reservarla. 
              Vos decidís el precio y cuándo está disponible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
