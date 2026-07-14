import type { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="thin-scroll overflow-x-auto rounded-xl border border-neutral-200">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-neutral-50">
      <tr className="border-b border-neutral-200 text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {children}
      </tr>
    </thead>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-6 py-4 font-semibold">{children}</th>;
}

export function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-6 py-4 text-neutral-700 ${className}`}>{children}</td>;
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50 transition-colors">{children}</tr>;
}