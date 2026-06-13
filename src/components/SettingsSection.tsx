import type { ReactNode } from "react";

type SettingsSectionProps = {
  children: ReactNode;
  description?: string;
  title: string;
};

export function SettingsSection({ children, description, title }: SettingsSectionProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-valorant-panel p-5 shadow-2xl shadow-black/20">
      <div className="mb-5">
        <h2 className="text-lg font-black text-white">{title}</h2>
        {description && <p className="mt-1 text-sm font-semibold text-white/50">{description}</p>}
      </div>
      {children}
    </section>
  );
}
