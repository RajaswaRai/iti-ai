import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

// REFACTOR: Menggunakan warna Teal solid, menghilangkan gradient, dan memperbaiki border
const variants: Record<Variant, string> = {
  primary:
    "bg-teal-600 text-white shadow-sm hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:shadow-none",
  secondary:
    "bg-white text-neutral-700 border border-neutral-300 shadow-sm hover:bg-neutral-50 focus:ring-2 focus:ring-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-400",
  ghost:
    "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 disabled:text-neutral-400",
  danger:
    "bg-white text-red-600 border border-red-200 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 disabled:bg-neutral-50 disabled:text-neutral-400",
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors
        disabled:cursor-not-allowed cursor-pointer focus:outline-none ${variants[variant]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${variant === 'primary' ? 'border-white' : 'border-current'}`} />
      )}
      {children}
    </button>
  );
}