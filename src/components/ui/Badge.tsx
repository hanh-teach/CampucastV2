import * as React from "react";
import { cn } from "../../lib/utils";
import { colors } from "../../foundation/tokens/colors";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "accent" | "outline";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", style, ...props }, ref) => {
    const variants = {
      default: { backgroundColor: colors.surfaceRaised, color: colors.textMuted, borderColor: colors.border },
      success: { backgroundColor: `${colors.success}1a`, color: colors.success, borderColor: `${colors.success}33` },
      warning: { backgroundColor: `${colors.warning}1a`, color: colors.warning, borderColor: `${colors.warning}33` },
      danger: { backgroundColor: `${colors.critical}1a`, color: colors.critical, borderColor: `${colors.critical}33` },
      accent: { backgroundColor: `${colors.interactive}1a`, color: colors.interactive, borderColor: `${colors.interactive}33` },
      outline: { backgroundColor: "transparent", color: colors.textMuted, borderColor: colors.border },
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase transition-colors",
          className
        )}
        style={{ ...variants[variant], ...style }}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
