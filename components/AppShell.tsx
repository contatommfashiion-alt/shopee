"use client";

import { BarChart3, KeyRound, LogOut, ServerCog, Tags, ShoppingCart } from "lucide-react";
import SearchBar from "./SearchBar";
import { accountInitial, accountLabel } from "@/lib/session";

export type Section = "ofertas" | "relatorios" | "conta";

const NAV: { id: Section; label: string; icon: typeof Tags }[] = [
  { id: "ofertas", label: "Ofertas", icon: Tags },
  { id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { id: "conta", label: "Conta", icon: KeyRound },
];

const SECTION_TITLES: Record<Section, string> = {
  ofertas: "Ofertas",
  relatorios: "Relatórios",
  conta: "Conta",
};

interface AppShellProps {
  section: Section;
  onSelectSection: (section: Section) => void;
  /** `null` when the credentials come from the server environment. */
  appId: string | null;
  /** Name typed at login. Empty falls back to the App ID. */
  displayName: string;
  /** Offers currently loaded, shown next to the tabs. `null` while loading. */
  offerCount: number | null;
  /** Header search: typing filters what is loaded, submitting asks Shopee. */
  search: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Dashboard layout in Shopee's style: orange gradient header with the logo and
 * the search box, a white tab bar below it, and content centered at 1200px on
 * a light gray page.
 */
export default function AppShell({
  section,
  onSelectSection,
  appId,
  displayName,
  offerCount,
  search,
  onSearchChange,
  onSearchSubmit,
  onLogout,
  children,
}: AppShellProps) {
  const label = accountLabel(displayName, appId);
  const hasName = displayName.trim() !== "";

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="shopee-header sticky top-0 z-30 text-white shadow-sm">
        <div className="mx-auto max-w-[1200px] px-4">
          {/* Top strip: tagline on the left, account on the right. */}
          <div className="flex items-center justify-between gap-3 py-1.5 text-[13px]">
            <p className="min-w-0 truncate text-xs text-white/90 sm:text-[13px]">
              Encontre. Compartilhe. Ganhe.
            </p>

            <div className="ml-auto flex shrink-0 items-center gap-3">
              {/* The endpoint is deliberately not shown here — it lives in "Conta". */}
              <span className="flex min-w-0 items-center gap-1.5" title={label}>
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-brand-600"
                >
                  {appId === null && !hasName ? <ServerCog className="h-3 w-3" /> : accountInitial(label)}
                </span>
                <span className="max-w-24 truncate font-medium sm:max-w-40">{label}</span>
                <span className="hidden text-white/75 sm:inline">
                  · {appId === null ? "conectado pelo servidor" : "conectado"}
                </span>
              </span>

              <span aria-hidden="true" className="h-3 w-px bg-white/40" />

              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1 font-medium text-white transition hover:text-white/75"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sair
              </button>
            </div>
          </div>

          {/* Logo + search. */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 pt-2 pb-4">
            <button
              type="button"
              onClick={() => onSelectSection("ofertas")}
              className="flex shrink-0 items-center gap-2 rounded-sm"
              aria-label="Laranjinha — ir para as ofertas"
            >
              <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10" strokeWidth={2} aria-hidden="true" />
              <span className="text-2xl font-medium tracking-tight sm:text-3xl">Laranjinha</span>
            </button>

            <div className="w-full sm:w-auto sm:min-w-0 sm:flex-1">
              <SearchBar
                value={search}
                onChange={(value) => {
                  onSearchChange(value);
                  if (section !== "ofertas") onSelectSection("ofertas");
                }}
                onSubmit={onSearchSubmit}
              />
            </div>
          </div>
        </div>
      </header>

      <nav aria-label="Seções" className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center px-4">
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-slate-600 hover:text-brand-600"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </button>
            );
          })}

          {offerCount !== null ? (
            <p className="ml-auto hidden text-xs text-slate-500 sm:block">
              {offerCount} {offerCount === 1 ? "oferta carregada" : "ofertas carregadas"}
            </p>
          ) : null}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-[1200px] min-w-0 flex-1 px-4 py-5">
        <h1 className="sr-only">{SECTION_TITLES[section]}</h1>
        {children}
      </main>

      <footer className="border-t-4 border-brand-500 bg-white">
        <p className="mx-auto flex max-w-[1200px] items-center justify-center gap-1.5 px-4 py-4 text-sm font-medium text-brand-600">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Laranjinha
        </p>
      </footer>
    </div>
  );
}
