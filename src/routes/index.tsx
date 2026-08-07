import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, MessageSquare, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background selection:bg-primary/10 overflow-x-hidden">
      {/* Desktop Overlay - Premium Style */}
      <div className="hidden lg:flex fixed inset-0 z-[100] bg-background items-center justify-center p-12 text-center">
        <div className="max-w-md space-y-8 premium-card p-12">
          <div className="w-20 h-20 bg-secondary rounded-3xl flex items-center justify-center mx-auto shadow-inner-glow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary">
              <rect x="5" y="2" width="14" height="20" rx="4" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground tracking-tight">Experiencia Móvil</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              Comunidad Tower es una herramienta de alta precisión diseñada exclusivamente para dispositivos móviles.
            </p>
          </div>
          <div className="p-4 bg-muted/50 rounded-2xl text-sm font-medium text-muted-foreground border border-black/5">
            Por favor, escaneá el código QR o ingresá desde tu smartphone.
          </div>
        </div>
      </div>

      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative pb-20">
        {/* Header - Minimalist */}
        <header className="px-8 py-10 flex justify-between items-center sticky top-0 z-20 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-premium">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <span className="font-bold text-foreground tracking-tight text-3xl">Tower</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/80 backdrop-blur-md rounded-full border border-black/[0.03]">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/60">Live</span>
          </div>
        </header>

        {/* Hero Section - High End Typography */}
        <section className="px-8 pt-12 pb-16 space-y-16">
          <div className="space-y-8">
            <div className="inline-block px-4 py-1.5 bg-secondary text-primary rounded-full text-[12px] font-bold uppercase tracking-[0.15em] border border-black/[0.02]">
              Residential Platform v2.0
            </div>
            <h1 className="text-[52px] font-bold leading-[1.05] tracking-tight text-foreground">
              Elevamos la <br />
              <span className="text-muted-foreground/40 font-light italic">experiencia</span> <br />
              de tu edificio.
            </h1>
            <p className="text-muted-foreground text-xl leading-relaxed max-w-[320px] font-medium">
              Gestión inteligente de espacios, comunicación y finanzas en un solo lugar.
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
            <Link 
              to="/login" 
              className="w-full h-[76px] bg-primary text-primary-foreground rounded-3xl font-bold shadow-premium active:scale-[0.98] transition-all flex items-center justify-between px-10 text-xl tracking-tight group"
            >
              <span>Acceder</span>
              <ArrowRight className="group-hover:translate-x-1.5 transition-transform" strokeWidth={2.5} />
            </Link>
            <Link 
              to="/login" 
              className="w-full h-[76px] glass text-foreground rounded-3xl font-bold active:scale-[0.98] transition-all flex items-center justify-center text-lg tracking-tight border border-black/5"
            >
              Registrar Edificio
            </Link>
          </div>
        </section>

        {/* Features - Grid without cards for a cleaner look */}
        <section className="px-8 space-y-12">
          <div className="space-y-10">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 shrink-0 bg-secondary rounded-3xl flex items-center justify-center shadow-subtle border border-black/[0.02]">
                <Car className="text-primary" size={28} strokeWidth={2} />
              </div>
              <div className="space-y-2 pt-1">
                <h3 className="font-bold text-foreground text-xl tracking-tight">Cocheras</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">Marketplace privado para alquilar y reservar espacios libres.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 shrink-0 bg-secondary rounded-3xl flex items-center justify-center shadow-subtle border border-black/[0.02]">
                <MessageSquare className="text-primary" size={28} strokeWidth={2} />
              </div>
              <div className="space-y-2 pt-1">
                <h3 className="font-bold text-foreground text-xl tracking-tight">Comunidad</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">Conectá con tus vecinos y recibí avisos oficiales al instante.</p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="w-16 h-16 shrink-0 bg-secondary rounded-3xl flex items-center justify-center shadow-subtle border border-black/[0.02]">
                <ShieldCheck className="text-primary" size={28} strokeWidth={2} />
              </div>
              <div className="space-y-2 pt-1">
                <h3 className="font-bold text-foreground text-xl tracking-tight">Transparencia</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">Reportes de incidentes y seguimiento de reparaciones en tiempo real.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="mt-auto px-8 py-16 text-center">
          <div className="w-12 h-px bg-muted mx-auto mb-8 opacity-50" />
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-[0.25em] opacity-40">
            &copy; 2026 TOWER RESIDENCES
          </p>
        </footer>
      </div>
    </div>
  );
}
