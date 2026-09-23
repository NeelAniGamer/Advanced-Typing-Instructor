import React from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Loader2,
  Sparkles,
  Zap,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { cn } from "../../lib/utils";

export type StatusType =
  | "success"
  | "active"
  | "pending"
  | "warning"
  | "error"
  | "offline"
  | "ai";

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  size?: "sm" | "md";
  className?: string;
  spin?: boolean;
}

const STATUS_CONFIGS: Record<
  StatusType,
  {
    icon: React.ComponentType<{ className?: string }>;
    cyberClasses: string;
    organicClasses: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    cyberClasses: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    organicClasses: "bg-[#7C8D81]/15 text-[#58675E] border-[#7C8D81]/35",
  },
  active: {
    icon: Activity,
    cyberClasses: "bg-cyan-500/15 text-cyan-300 border-cyan-400/40 shadow-neon-cyan/20",
    organicClasses: "bg-[#EBC078]/25 text-[#966E1F] border-[#EBC078]/45",
  },
  pending: {
    icon: Clock,
    cyberClasses: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    organicClasses: "bg-[#EBC078]/20 text-[#84621A] border-[#EBC078]/35",
  },
  warning: {
    icon: AlertCircle,
    cyberClasses: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    organicClasses: "bg-[#C97D5A]/15 text-[#B86B49] border-[#C97D5A]/35",
  },
  error: {
    icon: AlertCircle,
    cyberClasses: "bg-red-500/15 text-red-400 border-red-500/30",
    organicClasses: "bg-red-100 text-red-700 border-red-300",
  },
  offline: {
    icon: ShieldCheck,
    cyberClasses: "bg-purple-500/15 text-purple-300 border-purple-400/30",
    organicClasses: "bg-[#7C8D81]/15 text-[#4D5852] border-[#7C8D81]/30",
  },
  ai: {
    icon: Sparkles,
    cyberClasses: "bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 border-cyan-400/40",
    organicClasses: "bg-gradient-to-r from-[#7C8D81]/20 to-[#C97D5A]/20 text-[#333333] border-[#C97D5A]/35",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
  className,
  spin = false,
}) => {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.active;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-full font-mono font-bold border transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        "dark-theme-variant",
        config.cyberClasses,
        className
      )}
    >
      <Icon
        className={cn(
          size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5",
          spin ? "animate-spin" : ""
        )}
      />
      <span>{label}</span>
    </span>
  );
};
