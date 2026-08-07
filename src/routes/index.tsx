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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FB] selection:bg-teal-500/10 p-6">
      {/* Desktop/Landscape Block Overlay */}
      <div className="hidden sm:flex fixed inset-0 z-50 bg-white items-center justify-center p-10 text-center">
        <div className="max-w-xs space-y-4">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Acceso solo desde el celular</h2>
          <p className="text-sm text-slate-500">Comunidad Tower está diseñada para una experiencia móvil. Por favor, ingresá desde tu dispositivo móvil.</p>
        </div>
      </div>

      <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] overflow-hidden border border-slate-100 flex flex-col min-h-[600px]">
        {/* Navigation Bar */}
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">Tower</span>
          </div>
          <button className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <div className="w-5 h-0.5 bg-slate-400 relative before:content-[''] before:absolute before:-top-1.5 before:left-0 before:w-5 before:h-0.5 before:bg-slate-400 after:content-[''] after:absolute after:top-1.5 after:left-0 after:w-5 after:h-0.5 after:bg-slate-400" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="px-8 pb-8 flex-1 flex flex-col">
          <div className="space-y-4 mb-8">
            <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider rounded-full">Edificio Residencial</span>
            <h1 className="text-[32px] font-bold text-slate-900 leading-tight tracking-tight">
              Tu comunidad,<br />
              en la palma de tu mano.
            </h1>
            <p className="text-slate-500 text-base leading-relaxed">
              Gestioná tus expensas, reservá amenities y mantenete en contacto con tus vecinos. Todo en un solo lugar, estés donde estés.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 mt-auto">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Comunicación</p>
                <p className="text-xs text-slate-400">Hablá con tu administración</p>
              </div>
            </div>

            <button className="w-full py-5 bg-teal-600 rounded-2xl font-bold text-white shadow-xl shadow-teal-600/20 active:scale-[0.98] transition-all">
              Comenzar ahora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
