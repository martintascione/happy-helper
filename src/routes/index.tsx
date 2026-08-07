import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, MessageSquare, AlertCircle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F7F5F1] selection:bg-black/10 overflow-x-hidden">
      {/* Desktop/Landscape Block Overlay */}
      <div className="hidden lg:flex fixed inset-0 z-[100] bg-[#F7F5F1] items-center justify-center p-10 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Acceso solo desde el celular</h2>
          <p className="text-sm text-slate-500">Comunidad Tower está diseñada para una experiencia móvil. Por favor, ingresá desde tu dispositivo móvil.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative pb-12">
        {/* Header */}
        <header className="p-8 flex justify-between items-center bg-[#F7F5F1]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tighter text-2xl">Tower</span>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-8 pt-10 pb-16 space-y-10">
          <div className="space-y-6">
            <h1 className="text-[56px] font-bold leading-[0.95] tracking-tight text-slate-900 animate-in fade-in slide-in-from-bottom-6 duration-700">
              Vivir <br />mejor, <br /><span className="text-black/30">juntos.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-[280px] animate-in fade-in slide-in-from-bottom-4 delay-200 duration-700">
              La plataforma exclusiva para la gestión y comunidad de tu edificio.
            </p>
          </div>
          
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 delay-300 duration-700">
            <Link 
              to="/login" 
              preload="intent"
              className="w-full py-5.5 bg-black text-white rounded-[24px] font-bold shadow-2xl shadow-black/20 active:scale-[0.98] hover:scale-[1.02] transition-all flex items-center justify-center gap-2 text-lg"
            >
              Ingresar
            </Link>
            <Link 
              to="/login" 
              preload="intent"
              className="w-full py-5.5 bg-white text-black border border-slate-200/60 rounded-[24px] font-bold shadow-sm active:scale-[0.98] hover:bg-slate-50 transition-all flex items-center justify-center text-lg"
            >
              Registrar mi edificio
            </Link>
          </div>
        </section>

        {/* Benefits Cards Section */}
        <section className="px-8 space-y-6">
          <div className="grid gap-4">
            <div className="tint-positive p-8 rounded-[28px] border border-green-200/20 space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <Car className="text-green-600" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Alquiler de Cocheras</h3>
                <p className="text-sm text-green-900/60 font-medium leading-relaxed">Gestioná espacios entre vecinos sin intermediarios.</p>
              </div>
            </div>

            <div className="tint-insight p-8 rounded-[28px] border border-violet-200/20 space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <MessageSquare className="text-violet-600" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Comunicación Directa</h3>
                <p className="text-sm text-violet-900/60 font-medium leading-relaxed">Muro de avisos y chat privado para toda la comunidad.</p>
              </div>
            </div>

            <div className="tint-info p-8 rounded-[28px] border border-blue-200/20 space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <AlertCircle className="text-blue-600" size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg tracking-tight">Reportes de Edificio</h3>
                <p className="text-sm text-blue-900/60 font-medium leading-relaxed">Incidentes que se resuelven y quedan registrados.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="p-12 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
            &copy; 2026 COMUNIDAD TOWER
          </p>
        </footer>
      </div>
    </div>
  );
}
