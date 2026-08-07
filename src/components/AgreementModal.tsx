import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Check, ShieldCheck, X, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  title: string;
  agreementKey: "terminos" | "publicar_cochera" | "reservar_cochera";
  version?: number;
  items: { text: string; link?: { label: string; to: string } }[];
}

export function AgreementModal({
  isOpen,
  onClose,
  onAccept,
  title,
  agreementKey,
  version = 1,
  items
}: AgreementModalProps) {
  const [loading, setLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isAlreadyAccepted, setIsAlreadyAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkExisting();
    }
  }, [isOpen]);

  async function checkExisting() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_agreements" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("agreement_key", agreementKey)
      .eq("version", version)
      .single();

    if (data) {
      setIsAlreadyAccepted(true);
      onAccept();
    }
  }

  const handleConfirm = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Sesión no encontrada");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("user_agreements" as any).insert({
      user_id: user.id,
      agreement_key: agreementKey,
      version: version,
      accepted_at: new Date().toISOString()
    });

    if (error) {
      toast.error("Error al registrar aceptación");
    } else {
      onAccept();
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen || isAlreadyAccepted) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-[440px] rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-8 md:p-10 space-y-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
              <ShieldCheck size={36} className="text-primary" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{title}</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={14} className="text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">
                    {item.text}
                    {item.link && (
                      <Link 
                        to={item.link.to as any} 
                        className="text-primary font-bold ml-1 inline-flex items-center gap-1"
                        target="_blank"
                      >
                        {item.link.label} <ExternalLink size={12} />
                      </Link>
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-4 space-y-6">
              <label className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasAccepted}
                  onChange={(e) => setHasAccepted(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-black focus:ring-black/5"
                />
                <span className="text-sm font-black text-slate-900 uppercase tracking-wider">Leí y acepto los términos</span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="px-6 h-14 rounded-2xl font-bold text-slate-400"
                >
                  Cancelar
                </Button>
                <Button
                  disabled={!hasAccepted || loading}
                  onClick={handleConfirm}
                  className="flex-1 h-14 bg-black text-white rounded-2xl font-black shadow-xl shadow-black/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  {loading ? "PROCESANDO..." : "CONTINUAR"} <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
