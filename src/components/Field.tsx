import type { InputHTMLAttributes, ReactNode } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

export default function Field({ label, hint, id, className = "", ...rest }: FieldProps) {
  const inputId = id || label.replace(/\s+/g, "-").toLowerCase();
  return (
    <div className="mb-5 text-left">
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-neutral-700">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 outline-none transition-all placeholder:text-neutral-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 ${className}`}
        {...rest}
      />
      {hint && <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}