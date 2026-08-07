import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 pb-32">
      <header className="px-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Chat</h1>
        <p className="text-slate-500 font-medium">Conversá con tus vecinos</p>
      </header>

      <div className="bg-white p-12 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center space-y-6 shadow-soft">
        <div className="w-20 h-20 bg-pink-50 rounded-[2rem] flex items-center justify-center text-pink-200 mx-auto">
          <MessageCircle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900">Muy pronto...</h2>
          <p className="text-slate-500 font-medium leading-relaxed">
            Un espacio seguro para hablar con tus vecinos sin necesidad de compartir tu número de teléfono.
          </p>
        </div>
        <div className="pt-4 flex items-center justify-center gap-2 text-pink-500 font-black text-sm">
          <Heart size={16} fill="currentColor" /> Comunidad Tower
        </div>
      </div>
    </div>
  );
}
