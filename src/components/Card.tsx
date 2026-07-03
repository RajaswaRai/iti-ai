import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export default function Card({ children, className = "", accent = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.03)] 
        ${accent ? "border-l-4 border-l-teal-600" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        {description && <p className="mt-1 text-xs text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
