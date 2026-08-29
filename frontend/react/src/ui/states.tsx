import type { ReactNode } from "react";

/** Os quatro estados que toda tela que busca dados precisa tratar. */

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-stone-500">
      {label}
    </p>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded border border-dashed border-stone-300 py-10 text-center text-sm text-stone-500">
      {children}
    </p>
  );
}

export function Failed({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded border border-red-300 bg-red-50 px-4 py-6 text-center">
      <p className="text-sm text-red-800">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 text-sm font-medium text-red-900 underline">
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}
