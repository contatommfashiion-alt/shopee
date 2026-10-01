import type { ShopeeCredentials } from "./types.ts";

/**
 * Sessão no navegador.
 *
 * "Sessão" aqui significa: qual aplicação de afiliado está conectada. Não há
 * conta de usuário, senha nem banco — as credenciais SÃO a identidade.
 *
 * A sessão é guardada em `localStorage`, então sobrevive a recarregar a página
 * e a fechar o navegador. Só sai por **Sair** ou **Trocar de conta**.
 *
 * O custo disso é explícito: o Secret fica gravado neste navegador. Em
 * computador compartilhado, use **Sair** ao terminar — ou configure o
 * `.env.local` no servidor, caminho em que o Secret nunca chega ao navegador.
 */

export const CREDENTIALS_STORAGE_KEY = "laranjinha:credentials";

/**
 * Chave usada quando o app se chamava OfertaZap.
 *
 * Continua sendo lida na migração: renomear a marca não pode desconectar quem
 * já estava conectado — só Sair e Trocar de conta fazem isso.
 */
export const LEGACY_CREDENTIALS_STORAGE_KEY = "ofertazap:credentials";

/**
 * Marca que a pessoa saiu de propósito.
 *
 * Sem isso, quando o servidor tem credenciais próprias (`.env.local`), recarregar
 * a página reconectaria sozinho e o botão Sair pareceria não funcionar.
 */
export const SIGNED_OUT_KEY = "laranjinha:signed-out";
const LEGACY_SIGNED_OUT_KEY = "ofertazap:signed-out";

/**
 * O que é guardado.
 *
 * `displayName` é cosmético e local: a `productOfferV2` não expõe nome de conta,
 * então a pessoa escolhe como quer ser identificada na barra lateral. Nunca é
 * enviado à Shopee.
 */
export interface StoredSession {
  credentials: ShopeeCredentials;
  displayName: string;
}

/** Parser puro, para o formato ser testável sem navegador. */
export function parseStoredSession(raw: string | null): StoredSession | null {
  if (!raw) return null;

  let parsed: Record<string, unknown> | null;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown> | null;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object") return null;

  const appId = typeof parsed.appId === "string" ? parsed.appId.trim() : "";
  const secret = typeof parsed.secret === "string" ? parsed.secret.trim() : "";
  const apiUrl = typeof parsed.apiUrl === "string" ? parsed.apiUrl.trim() : "";

  if (appId === "" || secret === "" || apiUrl === "") return null;

  // Sessões gravadas antes do nome existir simplesmente não têm um.
  const displayName = typeof parsed.displayName === "string" ? parsed.displayName.trim() : "";

  return { credentials: { appId, secret, apiUrl }, displayName };
}

export function readStoredSession(): StoredSession | null {
  try {
    const fromLocal = parseStoredSession(window.localStorage.getItem(CREDENTIALS_STORAGE_KEY));
    if (fromLocal) return fromLocal;

    // Migração: chave antiga da marca, e sessões de quando ficavam em
    // sessionStorage. Aproveita em vez de obrigar a digitar tudo de novo.
    const legacy =
      parseStoredSession(window.localStorage.getItem(LEGACY_CREDENTIALS_STORAGE_KEY)) ??
      parseStoredSession(window.sessionStorage.getItem(LEGACY_CREDENTIALS_STORAGE_KEY)) ??
      parseStoredSession(window.sessionStorage.getItem(CREDENTIALS_STORAGE_KEY));

    // Regrava na chave nova para a migração acontecer uma vez só.
    if (legacy) writeStoredSession(legacy);

    return legacy;
  } catch {
    // Armazenamento pode estar indisponível (janela anônima, site bloqueado).
    return null;
  }
}

export function writeStoredSession(session: StoredSession | null): void {
  try {
    if (session) {
      window.localStorage.setItem(
        CREDENTIALS_STORAGE_KEY,
        JSON.stringify({ ...session.credentials, displayName: session.displayName }),
      );
      window.localStorage.removeItem(SIGNED_OUT_KEY);
    } else {
      window.localStorage.removeItem(CREDENTIALS_STORAGE_KEY);
    }

    // Versões anteriores guardavam nestas chaves; limpa para não ressuscitarem.
    window.localStorage.removeItem(LEGACY_CREDENTIALS_STORAGE_KEY);
    window.sessionStorage.removeItem(LEGACY_CREDENTIALS_STORAGE_KEY);
    window.sessionStorage.removeItem(CREDENTIALS_STORAGE_KEY);
  } catch {
    // Sem armazenamento o app funciona, só exige digitar de novo.
  }
}

/** Registra (ou limpa) a saída deliberada. */
export function setSignedOut(signedOut: boolean): void {
  try {
    if (signedOut) window.localStorage.setItem(SIGNED_OUT_KEY, "1");
    else window.localStorage.removeItem(SIGNED_OUT_KEY);

    window.localStorage.removeItem(LEGACY_SIGNED_OUT_KEY);
  } catch {
    // Idem.
  }
}

export function isSignedOut(): boolean {
  try {
    return (
      window.localStorage.getItem(SIGNED_OUT_KEY) === "1" ||
      window.localStorage.getItem(LEGACY_SIGNED_OUT_KEY) === "1"
    );
  } catch {
    return false;
  }
}

/**
 * Host do endpoint, para a barra lateral e a seção "Conta".
 *
 * Só o host: a URL completa pode ter caminho ou query que não valem a tela, e o
 * host é o que identifica o ambiente.
 */
export function describeApiHost(apiUrl: string): string {
  try {
    return new URL(apiUrl).host;
  } catch {
    return "—";
  }
}

/**
 * O rótulo da conta: o nome escolhido ou, na falta dele, o App ID.
 */
export function accountLabel(displayName: string, appId: string | null): string {
  const name = displayName.trim();
  if (name !== "") return name;
  if (appId !== null && appId.trim() !== "") return `App ID ${appId.trim()}`;
  return "Credenciais do servidor";
}

/** Primeiro caractere do rótulo, para o avatar. */
export function accountInitial(label: string): string {
  const trimmed = label.trim();
  return trimmed === "" ? "?" : trimmed.slice(0, 1).toUpperCase();
}
