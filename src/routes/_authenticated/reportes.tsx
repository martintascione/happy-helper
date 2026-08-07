import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, ShieldAlert, AlertTriangle } from "lucide-react";
import { InfoBanner } from "@/components/InfoBanner";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <header className="px-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Reportes</h1>
        <p className="text-slate-500 font-medium">Informá problemas en el edificio</p>
      </header>

      <InfoBanner 
        variant="advertencia" 
        text="Si es una emergencia — incendio, escape de gas, urgencia médica o un hecho de inseguridad en curso — llamá primero al 911 o a los servicios de emergencia. Esta sección no reemplaza los canales de emergencia." 
      />

      <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-6 shadow-soft">
        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 mx-auto">
          <ShieldAlert size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Sección en construcción</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Estamos trabajando para que puedas reportar roturas, ruidos molestos o problemas de limpieza directamente desde acá.
          </p>
        </div>
        <div className="pt-4">
          <div className="bg-slate-50 px-6 py-4 rounded-2xl text-xs font-bold text-slate-400 uppercase tracking-widest inline-block">
            Próximamente
          </div>
        </div>
      </div>
    </div>
  );
}
