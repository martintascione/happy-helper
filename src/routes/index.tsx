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
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[400px] bg-card rounded-[3rem] shadow-2xl overflow-hidden border border-border p-8 text-center flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="w-16 h-16 bg-primary rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20">
          <div className="w-8 h-8 border-4 border-primary-foreground rounded-full opacity-50" />
        </div>
        
        <h1 className="text-3xl font-black tracking-tight text-foreground leading-tight">
          ESTILO &<br />DISEÑO
        </h1>
        
        <p className="text-muted-foreground font-medium leading-relaxed">
          Adjunto dos imágenes para que las leas e interpretes el estilo. 
          Este es el diseño que implementaremos: moderno, con bordes redondeados, 
          fuentes audaces y colores vibrantes sobre fondos limpios.
        </p>
        
        <div className="flex flex-col gap-3 mt-4">
          <div className="h-14 w-full bg-secondary rounded-2xl flex items-center justify-center font-bold text-secondary-foreground">
            Bordes Muy Redondeados
          </div>
          <div className="h-14 w-full bg-primary rounded-2xl flex items-center justify-center font-bold text-primary-foreground shadow-lg shadow-primary/25">
            Colores Vibrantes
          </div>
        </div>
      </div>
    </div>
  );
}
