import { Zap } from "lucide-react";
import OfferExplorer from "@/components/OfferExplorer";

/**
 * Home — a Server Component. Only the interactive part below the header is a
 * Client Component, so no credential or data-fetching code reaches the browser.
 */
export default function Home() {
  return (
    <div className="min-h-screen">
      <header className="page-glow border-b border-slate-200/70">
        <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-8 text-center sm:px-6 sm:pt-14 sm:pb-10">
          <div className="inline-flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
            >
              <Zap className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Oferta<span className="text-emerald-600">Zap</span>
            </h1>
          </div>

          <p className="mt-3 text-base font-medium text-slate-600 sm:text-lg">
            Encontre. Compartilhe. Ganhe.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <OfferExplorer />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <p className="border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-500">
          O OfertaZap apenas prepara a mensagem. Você escolhe a conversa ou o grupo no WhatsApp e
          aperta enviar. Nada é enviado automaticamente e nada é armazenado.
        </p>
      </footer>
    </div>
  );
}
