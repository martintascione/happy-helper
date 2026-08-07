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
      className: "tint-info border-transparent",
      icon: <Info size={18} />,
    },
    advertencia: {
      className: "tint-warning border-transparent",
      icon: <AlertTriangle size={18} />,
    },
    seguridad: {
      className: "tint-error border-transparent",
      icon: <ShieldAlert size={18} />,
    }
  };

  const current = config[variant];

  return (
    <div className={cn(
      "p-4 rounded-2xl border flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-300",
      current.className,
      className
    )}>
      <div className="shrink-0 mt-0.5 opacity-80">
        {current.icon}
      </div>
      <p className="text-xs font-semibold leading-relaxed flex-1">
        {text}
      </p>
      {isClosable && variant !== "seguridad" && onClose && (
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-black/5 rounded-full transition-colors"
        >
          <X size={14} className="opacity-40" />
        </button>
      )}
    </div>
  );
};