export function formatMonto(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatFecha(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

const ZONA = 'America/Argentina/Buenos_Aires';

/** Fecha de hoy en horario argentino, sin importar el huso del servidor. */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
