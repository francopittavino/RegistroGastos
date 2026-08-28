/**
 * Arma un mensaje de error legible para mostrar en la UI a partir de lo que
 * tiró una Server Action. Si el navegador está offline, ese es casi seguro
 * el motivo real aunque el error capturado diga otra cosa. Si no, se usa el
 * mensaje que tiró la action (son mensajes en español pensados para
 * mostrarse tal cual, ver lib/actions.ts) y si no hay nada útil, el
 * fallback genérico que pase cada pantalla.
 */
export function mensajeDeError(error: unknown, fallback: string): string {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Estás sin conexión a internet. Probá de nuevo cuando vuelva.';
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
