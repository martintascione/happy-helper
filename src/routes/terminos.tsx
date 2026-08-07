import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terminos")({
  component: Terminos,
});

function Terminos() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] p-8 md:p-20">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Términos y Condiciones</h1>
        <div className="prose prose-slate font-medium text-slate-600 space-y-4">
          <p>Bienvenido a Comunidad Tower. Al utilizar nuestra aplicación, aceptás los siguientes términos:</p>
          <h2 className="text-xl font-bold text-slate-800 pt-4">1. Uso de la plataforma</h2>
          <p>Comunidad Tower es una herramienta para la gestión y convivencia en edificios residenciales. El usuario se compromete a hacer un uso lícito y respetuoso de la misma.</p>
          <h2 className="text-xl font-bold text-slate-800 pt-4">2. Privacidad y Datos</h2>
          <p>Tus datos personales son utilizados únicamente para la funcionalidad de la aplicación dentro de tu edificio. No compartimos información con terceros sin tu consentimiento.</p>
          <h2 className="text-xl font-bold text-slate-800 pt-4">3. Responsabilidad</h2>
          <p>La plataforma facilita el contacto entre vecinos y la administración, pero no se responsabiliza por los acuerdos privados o conductas individuales de los usuarios.</p>
        </div>
        <div className="pt-8">
          <a href="/login" className="font-bold text-primary">Volver al registro</a>
        </div>
      </div>
    </div>
  );
}
