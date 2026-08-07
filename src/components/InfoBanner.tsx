import React from "react";
import { Info, AlertTriangle, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type BannerVariant = "info" | "advertencia" | "seguridad";

interface InfoBannerProps {
  variant: BannerVariant;
  text: string;
  onClose?: () => void;
  className?: string;
  isClosable?: boolean;
}

export const InfoBanner = ({ 
  variant, 
  text, 
  onClose, 
  className,
  isClosable = false 
}: InfoBannerProps) => {
  const config = {
    info: {
      bg: "bg-[#F8C8DC]/20",
      border: "border-[#F8C8DC]/30",
      text: "text-slate-700",
      icon: <Info size={18} className="text-[#F8C8DC]" />,
    },
    advertencia: {
      bg: "bg-amber-50",
      border: "border-amber-100",
      text: "text-amber-800",
      icon: <AlertTriangle size={18} className="text-amber-500" />,
    },
    seguridad: {
      bg: "bg-red-50",
      border: "border-red-100",
      text: "text-red-900",
      icon: <ShieldAlert size={18} className="text-red-500" />,
    }
  };

  const current = config[variant];

  return (
    <div className={cn(
      "p-4 rounded-2xl border flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300",
      current.bg,
      current.border,
      className
    )}>
      <div className="shrink-0 mt-0.5">
        {current.icon}
      </div>
      <p className={cn("text-xs font-medium leading-relaxed flex-1", current.text)}>
        {text}
      </p>
      {isClosable && variant !== "seguridad" && onClose && (
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X size={14} className="text-slate-400" />
        </button>
      )}
    </div>
  );
};
