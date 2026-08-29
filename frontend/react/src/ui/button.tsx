import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost" | "danger";

const STYLES: Record<Variant, string> = {
  primary: "bg-stone-800 text-stone-50 hover:bg-stone-700 disabled:bg-stone-400",
  ghost: "border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:text-stone-400",
  danger: "border border-red-300 text-red-700 hover:bg-red-50 disabled:text-red-300",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", loading = false, children, ...rest }: Props) {
  return (
    <button
      {...rest}
      disabled={rest.disabled ?? loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-800 disabled:cursor-not-allowed ${STYLES[variant]}`}
    >
      {loading ? "Aguarde…" : children}
    </button>
  );
}
