import type { ReactNode } from "react";

type Tone = "brand" | "success" | "warning" | "neutral";

// REFACTOR: Menggunakan palet Teal dan Neutral
const toneStyles: Record<Tone, string> = {
  brand: "bg-teal-50 text-teal-700 border border-teal-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  neutral: "bg-neutral-100 text-neutral-600 border border-neutral-200",
};

export default function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${toneStyles[tone]}`}
    >
      {children}
    </span>
  );
}