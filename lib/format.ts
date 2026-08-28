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

/** Fecha y hora (en horario argentino) de un instante ISO, ej. "27/08/2026 14:32". */
export function formatFechaHora(iso: string): string {
  const d = new Date(iso);
  const fecha = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
  const hora = new Intl.DateTimeFormat('es-AR', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${fecha} ${hora}`;
}

/** Duración en días (con decimales) a texto legible: "3 horas" o "5 días". */
export function formatDuracion(dias: number): string {
  if (dias < 1) {
    const horas = Math.max(1, Math.round(dias * 24));
    return horas === 1 ? '1 hora' : `${horas} horas`;
  }
  const enteros = Math.floor(dias);
  return enteros === 1 ? '1 día' : `${enteros} días`;
}

/** Fecha de hoy en horario argentino, sin importar el huso del servidor. */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
