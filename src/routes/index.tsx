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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background selection:bg-primary/20">
      {/* Container simulating a mobile app UI with the requested style */}
      <div className="w-full max-w-[390px] bg-white rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden border border-border/40 p-10 text-center flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
        
        {/* Header/Logo section */}
        <div className="flex justify-between items-center mb-4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <div className="w-5 h-5 border-[3px] border-white rounded-md rotate-45" />
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-xs">🔍</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-xs">👤</span>
            </div>
          </div>
        </div>

        {/* Featured Card */}
        <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 text-left aspect-square flex flex-col justify-end relative overflow-hidden">
          <div className="absolute top-6 left-6 bg-accent/30 text-accent-foreground px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase">
            Estilo SwiftUI
          </div>
          <h2 className="text-5xl font-black text-white leading-[0.9] tracking-tighter mb-4">
            SOFT<br />
            <span className="text-accent">STYLE</span><br />
            UI
          </h2>
          <p className="text-white/60 text-sm font-medium">
            Bordes suaves, sombras profundas y tipografía moderna.
          </p>
        </div>
        
        <div className="space-y-4">
          <p className="text-muted-foreground font-semibold leading-relaxed px-2">
            He interpretado el estilo de las imágenes: minimalismo "Soft UI" con 
            esquinas muy redondeadas, fondos limpios y acentos de color.
          </p>
          
          <button className="w-full h-16 bg-primary rounded-[1.25rem] flex items-center justify-center font-bold text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[0.98] transition-transform active:scale-95">
            Comenzar Proyecto
          </button>
        </div>

        {/* Bottom Nav Simulation */}
        <div className="mt-4 flex justify-around items-center pt-6 border-t border-border/40">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-muted" />
        </div>
      </div>

      <div className="mt-8 text-center max-w-md">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">
          Listo para definir la funcionalidad
        </p>
      </div>
    </div>
  );
}
