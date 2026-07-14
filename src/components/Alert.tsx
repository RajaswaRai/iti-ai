import type { ReactNode } from "react";

type Tone = "error" | "success" | "warning";

// REFACTOR: Menggunakan warna yang lebih kalem dan profesional
const toneStyles: Record<Tone, string> = {
  error: "bg-red-50 text-red-600 border-red-100",
  success: "bg-teal-50 text-teal-700 border-teal-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
};

export default function Alert({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <div
      role="alert"
      className={`mb-4 flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${toneStyles[tone]}`}
    >
      {children}
    </div>
  );
}