import type React from "react";

export function Tape({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`tape ${className}`} />;
}

export function Sticker({
  children,
  tone = "mint",
}: {
  children: React.ReactNode;
  tone?: "mint" | "peach" | "lavender" | "butter";
}) {
  return <span className={`sticker sticker-${tone}`}>{children}</span>;
}
