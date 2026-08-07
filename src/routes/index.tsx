import { createFileRoute } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] selection:bg-primary/10">
      <div className="w-full max-w-[420px] bg-white rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] overflow-hidden border border-[#E9EDF2] p-10 flex flex-col gap-10 animate-in fade-in zoom-in-95 duration-1000 ease-out">
        
        {/* Navigation Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1D21] rounded-2xl flex items-center justify-center shadow-lg shadow-black/5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-[#1A1D21] tracking-tight">Studio.</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-[#F0F3F7] flex items-center justify-center group cursor-pointer hover:bg-[#E9EDF2] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1D21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </div>
        </div>

        {/* Hero Section */}
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-primary uppercase tracking-[0.25em] opacity-80">Estructura del Proyecto</p>
            <h1 className="text-[44px] font-extrabold text-[#1A1D21] leading-[1.05] tracking-[-0.04em]">
              Web &<br />
              <span className="text-primary">iOS Swift</span>
            </h1>
          </div>
          <p className="text-[#64748B] text-[15px] leading-relaxed font-medium">
            Organizando el proyecto en GitHub con carpetas dedicadas para Web y iOS. 
            Cada avance se transcribe y adapta fielmente a SwiftUI para garantizar 
            un diseño idéntico en ambas plataformas.
          </p>
        </div>

        {/* Visual Elements / Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#F8F9FB] p-5 rounded-[2rem] border border-[#E9EDF2] space-y-3">
            <div className="w-8 h-8 rounded-xl bg-accent/20 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-accent" />
            </div>
            <p className="text-[13px] font-bold text-[#1A1D21]">UI Limpia</p>
          </div>
          <div className="bg-[#1A1D21] p-5 rounded-[2rem] space-y-3 shadow-xl shadow-black/10">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
            </div>
            <p className="text-[13px] font-bold text-white">Calidad</p>
          </div>
        </div>
        
        {/* Action Button */}
        <button className="w-full h-16 bg-primary rounded-2xl flex items-center justify-center font-bold text-white shadow-[0_20px_40px_-10px_rgba(var(--primary-rgb),0.3)] hover:brightness-110 active:scale-[0.98] transition-all duration-300">
          Explorar Proyecto
        </button>
      </div>

      <div className="mt-12 flex items-center gap-6 opacity-40 grayscale grayscale-100">
        <div className="w-8 h-8 rounded bg-slate-400" />
        <div className="w-8 h-8 rounded bg-slate-400" />
        <div className="w-8 h-8 rounded bg-slate-400" />
      </div>
    </div>
  );
}
