"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, KeyRound, LogOut, Menu, ServerCog, Tags, X, Coins } from "lucide-react";
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
  /** Offers currently loaded, shown as a pill. `null` while loading. */
  offerCount: number | null;
  onLogout: () => void;
  children: React.ReactNode;
}

/**
 * Dashboard layout: fixed sidebar from `lg` up, slide-in drawer below that.
 *
 * The navigation only lists what the app actually does — offers and the
 * connected account.
 */
export default function AppShell({
  section,
  onSelectSection,
  appId,
  displayName,
  offerCount,
  onLogout,
  children,
}: AppShellProps) {
  const label = accountLabel(displayName, appId);
  const hasName = displayName.trim() !== "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Esc closes the drawer, and the page behind it does not scroll.
  useEffect(() => {
    if (!drawerOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setDrawerOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerOpen]);

  function handleSelect(next: Section) {
    onSelectSection(next);
    setDrawerOpen(false);
  }

  const navigation = (
    <nav aria-label="Seções" className="space-y-1">
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = section === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => handleSelect(item.id)}
            aria-current={isActive ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-brand-50 text-brand-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Icon
              className={`h-4.5 w-4.5 ${isActive ? "text-brand-600" : "text-slate-400"}`}
              aria-hidden="true"
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  const sidebarBody = (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center gap-2.5 px-1">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/25"
        >
          <Coins className="h-4.5 w-4.5" strokeWidth={2.5} />
        </span>
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-brand-600">
            Laranjinha
          </p>
          <p className="text-[11px] text-slate-500">Encontre. Compartilhe. Ganhe.</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 p-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white"
          >
            {appId === null && !hasName ? <ServerCog className="h-4 w-4" /> : accountInitial(label)}
          </span>

          {/* The endpoint is deliberately not shown here — it lives in "Conta". */}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900" title={label}>
              {label}
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500"
              />
              {appId === null ? "Conectado pelo servidor" : "Conectado"}
            </p>
          </div>
        </div>

        {offerCount !== null ? (
          <p className="mt-2.5 rounded-full bg-white px-3 py-1.5 text-center text-xs font-semibold text-brand-800">
            {offerCount} {offerCount === 1 ? "oferta carregada" : "ofertas carregadas"}
          </p>
        ) : null}
      </div>

      {navigation}

      <div className="mt-auto space-y-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut className="h-4.5 w-4.5 text-slate-400" aria-hidden="true" />
          Sair
        </button>

        <p className="px-3 text-[11px] leading-snug text-slate-400">
          Nada é armazenado. O app só prepara a mensagem — você escolhe a conversa e aperta enviar.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-dvh">
        {sidebarBody}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={drawerOpen}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white"
        >
          <Coins className="h-4 w-4" strokeWidth={2.5} />
        </span>

        <p className="text-base font-bold tracking-tight text-brand-600">
          Laranjinha
        </p>

        <span className="ml-auto text-xs font-semibold text-slate-500">
          {SECTION_TITLES[section]}
        </span>
      </header>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div
          className="oz-fade-in fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDrawerOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="oz-drawer-in flex h-full w-72 max-w-[85vw] flex-col bg-white shadow-2xl"
          >
            <div className="flex justify-end p-2">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Fechar menu"
                className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">{sidebarBody}</div>
          </div>
        </div>
      ) : null}

      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <h1 className="sr-only">{SECTION_TITLES[section]}</h1>
        {children}
      </main>
    </div>
  );
}
