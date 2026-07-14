import type { ReactNode } from "react";
import Card from "./Card";

export default function AuthShell({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode; // FIX: Diubah dari string menjadi ReactNode agar bisa menerima icon Lucide
  title: ReactNode;
  subtitle: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12 font-sans">
      <Card className="w-full max-w-105 rounded-2xl bg-white p-8 shadow-[0_2px_16px_rgba(23,23,23,0.04)] border border-neutral-200 text-center">
        <div className="mb-8 text-center">
          {/* REFACTOR: Container icon modern berbentuk kotak melengkung (squircle) dengan warna Teal */}
          <div 
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 border border-teal-100 mb-5" 
            aria-hidden="true"
          >
            {icon}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">{title}</h2>
          <p className="mt-2 text-sm text-neutral-500">{subtitle}</p>
        </div>
        
        {/* Konten Form */}
        <div className="text-left">
          {children}
        </div>
      </Card>
    </div>
  );
}
