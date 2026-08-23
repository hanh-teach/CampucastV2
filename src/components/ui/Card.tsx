import * as React from "react";
import { cn } from "../../lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-card-bg border border-border-primary",
      elevated: "bg-card-bg shadow-md border border-border-primary/60",
      outline: "bg-transparent border border-border-primary",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-4 transition-all duration-200",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
