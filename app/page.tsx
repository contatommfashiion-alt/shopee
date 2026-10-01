import LaranjinhaApp from "@/components/LaranjinhaApp";

/**
 * Home — a Server Component.
 *
 * It only mounts the client application; no credential or data-fetching code
 * is rendered here, and nothing from the server environment reaches the markup.
 */
export default function Home() {
  return <LaranjinhaApp />;
}
