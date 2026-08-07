import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidad")({
  component: Privacidad,
});

function Privacidad() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] p-8 md:p-20">
      <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] p-10 md:p-16 shadow-xl space-y-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Política de Privacidad</h1>
        <div className="prose prose-slate font-medium text-slate-600 space-y-4">
          <p>En Comunidad Tower, valoramos tu privacidad. Esta política explica cómo manejamos tu información:</p>
          <h2 className="text-xl font-bold text-slate-800 pt-4">Información recolectada</h2>
          <p>Recopilamos nombre, correo electrónico, unidad funcional y edificio para validar tu identidad como residente legítimo.</p>
          <h2 className="text-xl font-bold text-slate-800 pt-4">Seguridad</h2>
          <p>Implementamos medidas de seguridad técnicas (como Row Level Security en la base de datos) para asegurar que solo vos y los autorizados de tu edificio vean tu información.</p>
        </div>
        <div className="pt-8">
          <a href="/login" className="font-bold text-primary">Volver al registro</a>
        </div>
      </div>
    </div>
  );
}
