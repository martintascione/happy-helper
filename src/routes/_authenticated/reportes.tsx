import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send, ShieldAlert, Mail, MessageSquare } from "lucide-react";
import { InfoBanner } from "@/components/InfoBanner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reportes")({
  component: ReportesPage,
});

function ReportesPage() {
  const [message, setMessage] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminWhatsapp, setAdminWhatsapp] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message) {
      toast.error("Por favor, ingresá tu mensaje");
      return;
    }
    
    setIsSending(true);
    // Simulating sending process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Mensaje enviado de forma anónima a la administración");
    setMessage("");
    setIsSending(false);
  };

  return (
    <div className="px-5 pt-8 max-w-2xl mx-auto space-y-8 pb-32">
      <header className="px-1">
        <h1 className="text-[28px] font-bold text-slate-900 tracking-tight leading-tight">
          Comunicación con la administración
        </h1>
        <p className="text-[15px] text-slate-500 font-medium mt-1">
          Idea de comunicacion con su administracion.
        </p>
      </header>

      <div className="space-y-6">
        <InfoBanner 
          variant="info" 
          text="Creemos una herramienta de quejas anonimas, podes agregar el email y whatsapp de la adminstracion de tue dificio, ingresas tu mensaje, con quejas constructivas o puntos a mejorar, y enviaremos el mensaje al contacto de la adminstracion, de forma anonima." 
        />

        <div className="bg-white p-6 rounded-[2.5rem] shadow-premium space-y-6 border border-white">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Email de la admin</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="administracion@ejemplo.com" 
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="h-14 pl-12 rounded-2xl bg-[#F9F8F6] border-none font-medium"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-400 ml-1 uppercase tracking-wider">WhatsApp de la admin</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder="+54 9 11 ..." 
                    value={adminWhatsapp}
                    onChange={(e) => setAdminWhatsapp(e.target.value)}
                    className="h-14 pl-12 rounded-2xl bg-[#F9F8F6] border-none font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-bold text-slate-400 ml-1 uppercase tracking-wider">Tu mensaje anónimo</label>
              <Textarea 
                placeholder="Escribí acá tus quejas constructivas o puntos a mejorar..." 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[160px] rounded-[24px] bg-[#F9F8F6] border-none p-5 text-[16px] font-medium resize-none"
              />
            </div>
          </div>

          <Button 
            onClick={handleSend}
            disabled={isSending || !message}
            className="w-full h-15 bg-black text-white rounded-[22px] font-bold text-lg active:scale-95 transition-all shadow-premium"
          >
            {isSending ? "Enviando..." : "Enviar mensaje anónimo"}
            {!isSending && <Send size={18} className="ml-2" />}
          </Button>
        </div>

        <InfoBanner 
          variant="seguridad" 
          text="Tu identidad nunca será revelada. El mensaje se envía desde nuestra plataforma sin datos que te identifiquen." 
        />
      </div>
    </div>
  );
}

