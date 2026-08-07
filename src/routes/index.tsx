import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, MessageSquare, AlertCircle, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F2F2F2] selection:bg-accent/20">
      {/* Desktop/Landscape Block Overlay */}
      <div className="hidden sm:flex fixed inset-0 z-50 bg-white items-center justify-center p-10 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Acceso solo desde el celular</h2>
          <p className="text-sm text-slate-500">Comunidad Tower está diseñada para una experiencia móvil. Por favor, ingresá desde tu dispositivo móvil.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative pb-12">
        {/* Header */}
        <header className="p-6 flex justify-between items-center bg-[#F2F2F2]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-black/10">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-xl">Tower</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login" preload="intent" className="px-5 py-2 text-sm font-bold text-primary bg-white rounded-full shadow-soft hover:scale-[0.98] transition-all cursor-pointer">
              Ingresar
            </Link>
          </div>
        </header>

        {/* Hero Card */}
        <section className="px-6 py-4">
          <div className="bg-black text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
            {/* Pink Accent Circle */}
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            
            <div className="relative z-10 space-y-4">
              <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight">
                La app de <br />tu edificio.
              </h1>
              <p className="text-slate-400 text-lg font-medium">
                Conectate con tus vecinos de forma simple y profesional.
              </p>
              <div className="pt-4">
                <Link 
                  to="/login" 
                  preload="intent"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground rounded-full font-bold text-sm shadow-lg shadow-accent/20 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Registrarme ahora
                  <ChevronRight size={18} strokeWidth={3} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="px-6 py-8 space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-extrabold text-slate-900">Nuestros beneficios</h2>
            <span className="text-xs font-bold text-accent-foreground bg-accent/30 px-3 py-1 rounded-full">3 destacados</span>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-soft flex items-start gap-4 hover:scale-[0.99] transition-transform">
              <div className="w-14 h-14 bg-[#F2F2F2] rounded-2xl flex items-center justify-center shrink-0">
                <Car className="text-primary" size={28} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg">Cocheras entre vecinos</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Alquilá o compartí tu espacio sin complicaciones.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-soft flex items-start gap-4 hover:scale-[0.99] transition-transform">
              <div className="w-14 h-14 bg-[#F2F2F2] rounded-2xl flex items-center justify-center shrink-0">
                <MessageSquare className="text-primary" size={28} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg">Comunicación sin grupos</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Olvidate de los grupos de WhatsApp interminables.</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-soft flex items-start gap-4 hover:scale-[0.99] transition-transform">
              <div className="w-14 h-14 bg-[#F2F2F2] rounded-2xl flex items-center justify-center shrink-0">
                <AlertCircle className="text-primary" size={28} strokeWidth={2.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-lg">Reportes efectivos</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Incidentes que se resuelven y quedan registrados.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto p-12 text-center text-slate-400 text-sm font-bold tracking-tight">
          &copy; 2026 COMUNIDAD TOWER
        </footer>
      </div>
    </div>
  );
}
