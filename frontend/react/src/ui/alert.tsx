import type { ReactNode } from "react";

interface Props {
  tone?: "error" | "info" | "success";
  children: ReactNode;
}

const TONES = {
  error: "border-red-300 bg-red-50 text-red-800",
  info: "border-stone-300 bg-stone-50 text-stone-700",
  success: "border-emerald-300 bg-emerald-50 text-emerald-800",
};

export function Alert({ tone = "info", children }: Props) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      {children}
    </div>
  );
}
