import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil")({
  component: () => <PlaceholderScreen title="Perfil" />,
});

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="aspect-video rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400">
        Sección en construcción
      </div>
    </div>
  );
}