import * as React from "react";
import { cn } from "../../lib/utils";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, icon, actions, className, children, ...props }: PageHeaderProps) => {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border-primary/60", className)} {...props}>
      <div className="flex items-center gap-3">
        {icon && <div className="p-2 bg-brand-accent/10 rounded-xl text-brand-accent shrink-0">{icon}</div>}
        <div>
          <h1 className="text-2xl font-black tracking-tight text-text-main">{title}</h1>
          {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="mt-4 sm:mt-0">{children}</div>}
      {actions && <div className="flex items-center gap-3 w-full sm:w-auto">{actions}</div>}
    </div>
  );
};

export { PageHeader };
