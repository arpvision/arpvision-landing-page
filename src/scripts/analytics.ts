declare global {
  interface Window {
    plausible?: (name: string, options?: { props: Record<string, string | number> }) => void;
  }
}
export function track(name: string, props: Record<string, string | number> = {}) {
  // Sem cookies, armazenamento local ou dados pessoais. Ative o provedor no config.
  window.plausible?.(name, { props });
}
