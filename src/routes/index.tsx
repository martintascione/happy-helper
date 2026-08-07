import { createFileRoute, Link } from "@tanstack/react-router";
import { Car, MessageSquare, AlertCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-background selection:bg-primary/10 overflow-x-hidden">
      <div className="w-full max-w-[480px] min-h-screen flex flex-col relative pb-16">
        {/* Header */}
        <header className="px-6 py-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-[14px] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <span className="font-bold text-foreground tracking-tight text-2xl">Tower</span>
        </header>

        {/* Hero */}
        <section className="px-6 pt-8 pb-12 space-y-10">
          <div className="space-y-4">
            <h1 className="text-[40px] font-bold leading-[1.1] tracking-tight text-foreground">
              La app de<br />tu edificio.
            </h1>
            <p className="text-muted-foreground text-[17px] leading-relaxed max-w-[320px] font-medium">
              Cocheras, comunicados, chat y reportes entre vecinos. Todo en un solo lugar.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              className="w-full h-14 bg-primary text-primary-foreground rounded-full font-semibold active:scale-[0.98] transition-all flex items-center justify-between px-7 text-[16px] group"
            >
              <span>Ingresar</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              search={{ mode: "signup" }}
              className="w-full h-14 bg-white text-foreground rounded-full font-semibold active:scale-[0.98] transition-all flex items-center justify-center text-[16px] shadow-subtle"
            >
              Crear cuenta
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 space-y-3">
          <div className="tint-positive rounded-[24px] p-5 flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center shadow-subtle">
              <Car className="text-emerald-600" size={20} />
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h3 className="font-bold text-slate-900 text-[16px] tracking-tight">Cocheras entre vecinos</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed font-medium">Publicá tu cochera cuando no la uses, o alquilá la de un vecino por día.</p>
            </div>
          </div>

          <div className="tint-insight card-dashed rounded-[24px] p-5 flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center shadow-subtle">
              <MessageSquare className="text-violet-600" size={20} />
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h3 className="font-bold text-slate-900 text-[16px] tracking-tight">Comunicación sin caos</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed font-medium">Comunicados oficiales y muro de avisos, sin depender de grupos de WhatsApp.</p>
            </div>
          </div>

          <div className="tint-info rounded-[24px] p-5 flex items-start gap-4">
            <div className="w-11 h-11 shrink-0 bg-white rounded-full flex items-center justify-center shadow-subtle">
              <AlertCircle className="text-blue-600" size={20} />
            </div>
            <div className="space-y-0.5 pt-0.5">
              <h3 className="font-bold text-slate-900 text-[16px] tracking-tight">Reportes que se resuelven</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed font-medium">Reportá un problema y seguí su estado hasta que esté solucionado.</p>
            </div>
          </div>
        </section>

        <footer className="mt-auto px-6 py-12 text-center">
          <p className="text-[12px] text-muted-foreground font-medium opacity-60">
            Comunidad Tower · {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  );
}
