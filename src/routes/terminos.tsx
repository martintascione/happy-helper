import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terminos")({
  component: Terminos,
});

function Terminos() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] p-8 md:p-20">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl space-y-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Términos y Condiciones</h1>
        <div className="prose prose-slate font-medium text-slate-600 space-y-6">
          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">1. Qué es Comunidad Tower</h2>
            <p className="text-sm leading-relaxed">Comunidad Tower es una plataforma tecnológica diseñada para conectar exclusivamente a vecinos verídicos de un mismo edificio residencial en Argentina, facilitando la comunicación, la gestión de cocheras y el reporte de incidentes.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">2. Quién puede usarla</h2>
            <p className="text-sm leading-relaxed">El acceso está restringido a residentes (propietarios o inquilinos) verificados por la administración de cada edificio. El uso de datos falsos para el registro es motivo de baja inmediata.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">3. Reglas de Cocheras</h2>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>El alquiler solo está permitido entre vecinos del mismo edificio.</li>
              <li>Queda terminantemente prohibido el acceso de terceros ajenos al edificio.</li>
              <li>Todos los pagos deben realizarse por los medios oficiales de la app (Transferencia a la empresa o Mercado Pago).</li>
              <li>Política de cancelación: Hasta 24 horas antes del inicio para un reembolso total.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">4. Responsabilidad</h2>
            <p className="text-sm leading-relaxed">Comunidad Tower actúa únicamente como intermediaria. Cualquier daño, robo o incidente ocurrido en las cocheras o espacios comunes debe ser resuelto entre las partes involucradas. La plataforma no asume responsabilidad civil ni penal por dichos sucesos.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">5. Precios y Comisiones</h2>
            <p className="text-sm leading-relaxed">El precio publicado para los inquilinos ya incluye el costo del servicio de la plataforma (margen). El dueño de la cochera recibirá el monto neto acordado al registrar su unidad.</p>
          </section>

          <section>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wider mb-2">6. Suspensión de Cuenta</h2>
            <p className="text-sm leading-relaxed">Podremos dar de baja cuentas por: uso de datos falsos, alquiler a terceros no residentes, intentos de pago por fuera de la plataforma, subida de comprobantes adulterados o comportamiento ofensivo.</p>
          </section>

          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Última actualización: 7 de Agosto, 2026</p>
            <p className="text-[10px] font-medium text-slate-400 mt-1 italic">El uso de la aplicación implica la aceptación total de estos términos.</p>
          </div>
        </div>
        <div className="pt-4">
          <a href="/login" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Volver al inicio</a>
        </div>
      </div>
    </div>
  );
}
