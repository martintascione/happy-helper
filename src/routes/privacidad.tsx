import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  component: Privacidad,
});

function Privacidad() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] p-8 md:p-20">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl space-y-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Política de Privacidad</h1>
        <div className="prose prose-slate font-medium text-slate-600 space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">Datos Recopilados</h2>
            <p className="text-sm leading-relaxed">Recopilamos nombre completo, correo electrónico, número de teléfono, unidad funcional (piso y departamento) y edificio con el fin exclusivo de validar su identidad como residente verídico.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">Uso de Datos Bancarios</h2>
            <p className="text-sm leading-relaxed">Sus datos bancarios (CBU/Alias) se utilizan únicamente para procesar las liquidaciones de cobros por alquiler de cocheras. Esta información solo es visible para la administración central de la plataforma y nunca se comparte con otros vecinos.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">Marco Legal (Ley 25.326)</h2>
            <p className="text-sm leading-relaxed">Sus datos están protegidos conforme a la Ley Argentina de Protección de Datos Personales N° 25.326. Usted tiene derecho a acceder, rectificar o solicitar la baja de sus datos en cualquier momento.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">Seguridad de la Información</h2>
            <p className="text-sm leading-relaxed">Utilizamos tecnologías de encriptación y políticas de Row Level Security (RLS) para asegurar que solo los usuarios autorizados de su propio edificio puedan interactuar con la información correspondiente.</p>
          </section>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última actualización: 7 de Agosto, 2026</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">La protección de su privacidad es nuestra prioridad en cada transacción.</p>
          </div>
        </div>
        <div className="pt-4">
          <a href="/login" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
