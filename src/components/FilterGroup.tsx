import type { ReactNode } from "react";

type FilterGroupProps = {
  children: ReactNode;
  title: string;
};

export function FilterGroup({ children, title }: FilterGroupProps) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-white/40">{title}</h3>
      {children}
    </div>
  );
}
