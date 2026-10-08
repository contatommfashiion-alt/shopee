import type { Metadata } from "next";

/**
 * TEMPORARY test page: which link opens the TikTok app on iPhone with the
 * search already filled in? TikTok documents no such deep link, so the
 * candidates below are tried by hand on a real phone. Delete this folder once
 * the answer is in.
 *
 * Plain links and a GET form only, no client JS, so it works even when the
 * phone reaches the dev server through the LAN address.
 */

export const metadata: Metadata = {
  title: "Teste TikTok",
  robots: { index: false, follow: false },
};

interface Candidate {
  id: number;
  label: string;
  build: (query: string) => string;
}

const enc = encodeURIComponent;
/** Hashtags have no spaces or accents: "garrafa térmica" → "garrafatermica". */
const hashtag = (query: string) =>
  query.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

const CANDIDATES: Candidate[] = [
  { id: 1, label: "snssdk1233://search?keyword=", build: (q) => `snssdk1233://search?keyword=${enc(q)}` },
  { id: 2, label: "snssdk1233://search/result?keyword=", build: (q) => `snssdk1233://search/result?keyword=${enc(q)}` },
  { id: 3, label: "snssdk1233://search?q=", build: (q) => `snssdk1233://search?q=${enc(q)}` },
  { id: 4, label: "tiktok://search?keyword=", build: (q) => `tiktok://search?keyword=${enc(q)}` },
  { id: 5, label: "tiktok://search?q=", build: (q) => `tiktok://search?q=${enc(q)}` },
  { id: 6, label: "snssdk1233://general_search?keyword=", build: (q) => `snssdk1233://general_search?keyword=${enc(q)}` },
  { id: 7, label: "https://www.tiktok.com/search/video?q= (link normal)", build: (q) => `https://www.tiktok.com/search/video?q=${enc(q)}` },
  { id: 8, label: "https://www.tiktok.com/tag/ (hashtag, não é busca)", build: (q) => `https://www.tiktok.com/tag/${enc(hashtag(q))}` },
];

export default async function TikTokTestPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const raw = (await searchParams).q;
  const query = (typeof raw === "string" ? raw : "").trim() || "garrafa térmica";

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <h1 className="text-xl font-medium text-slate-900">Teste: abrir o TikTok com a busca</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        No iPhone, toque em <strong>um botão por vez</strong>. Depois de cada um, volte para cá e anote
        o que aconteceu: <strong>abriu o app já com a busca</strong>, abriu o app sem a busca, ou deu
        erro / &quot;endereço inválido&quot; (normal num teste).
      </p>

      <form method="get" className="mt-4 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Palavras para buscar
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          className="min-w-0 flex-1 rounded-sm border border-slate-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-sm bg-slate-900 px-3 py-2 text-xs font-medium text-white">
          TROCAR
        </button>
      </form>

      <ol className="mt-5 space-y-2.5">
        {CANDIDATES.map((candidate) => (
          <li key={candidate.id}>
            <a
              href={candidate.build(query)}
              className="flex items-center gap-3 rounded-sm border border-slate-300 bg-white px-3 py-3 text-sm text-slate-800 active:bg-slate-100"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-brand-600 font-bold text-white">
                {candidate.id}
              </span>
              <span className="min-w-0 break-all">{candidate.label}</span>
            </a>
          </li>
        ))}
      </ol>

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Busca usada: <strong>{query}</strong>. Me diga o número de cada botão e o resultado, por exemplo:
        &quot;1 erro, 2 abriu sem busca, 4 abriu com busca&quot;.
      </p>
    </main>
  );
}
