import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, MessageSquare, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#F8F9FB] selection:bg-primary/10">
      {/* Desktop/Landscape Block Overlay */}
      <div className="hidden sm:flex fixed inset-0 z-50 bg-white items-center justify-center p-10 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acceso solo desde el celular</h2>
          <p className="text-sm text-slate-500">Comunidad Tower está diseñada para una experiencia móvil. Por favor, ingresá desde tu dispositivo móvil.</p>
        </div>
      </div>

      <div className="w-full max-w-[480px] min-h-screen bg-white flex flex-col relative">
        {/* Header */}
        <header className="p-6 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Tower</span>
          </div>
          <div className="flex gap-2">
            <Link to="/login" className="px-4 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-xl transition-all">Ingresar</Link>
          </div>
        </header>

        {/* Hero */}
        <section className="px-6 py-12 flex flex-col items-center text-center space-y-4">
          <h1 className="text-[40px] font-extrabold text-slate-900 leading-[1.1] tracking-tight">
            La app de tu edificio.
          </h1>
          <p className="text-slate-500 text-lg max-w-[320px]">
            Conectate con tus vecinos de forma simple y profesional.
          </p>
          <div className="pt-6 w-full">
            <Link to="/login" className="block w-full py-5 bg-primary rounded-2xl font-bold text-white shadow-xl shadow-primary/20 active:scale-[0.98] transition-all">
              Registrarme ahora
            </Link>
          </div>
        </section>

        {/* Benefits */}
        <section className="px-6 py-8 space-y-4">
          <h2 className="text-xs font-bold text-primary uppercase tracking-[0.2em] text-center mb-6">Beneficios</h2>
          
          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <Car className="text-primary" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900">Cocheras entre vecinos</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Alquilá o compartí tu espacio sin complicaciones.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <MessageSquare className="text-primary" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900">Comunicación sin grupos</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Olvidate de los grupos de WhatsApp interminables.</p>
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-start gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <AlertCircle className="text-primary" size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900">Reportes efectivos</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Incidentes que se resuelven y quedan registrados.</p>
            </div>
          </div>
        </section>

        <footer className="mt-auto p-12 text-center text-slate-300 text-sm font-medium">
          &copy; 2026 Comunidad Tower
        </footer>
      </div>
    </div>
  );
}
