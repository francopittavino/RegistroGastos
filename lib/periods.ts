import { hoyISO } from './format';
import type { Period, RangoPeriodo } from './types';

function parseISO(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
}

/**
 * Dado el listado completo de períodos (ordenado por start_at asc) y un
 * índice objetivo (por defecto el último = período actual/abierto), arma el
 * rango de ese período. El fin de un período es el inicio exacto del
 * siguiente (con hora), o null si es el actual (todavía abierto, sin fin).
 */
export function rangoDePeriodo(periodos: Period[], index?: number): RangoPeriodo {
  const idx = index ?? periodos.length - 1;
  const periodo = periodos[idx];
  const siguiente = periodos[idx + 1];
  const esActual = idx === periodos.length - 1;

  return {
    periodo,
    index: idx,
    esActual,
    hayAnterior: idx > 0,
    haySiguiente: idx < periodos.length - 1,
    inicio: periodo.startAt,
    fin: siguiente ? siguiente.startAt : null,
  };
}

/** Días transcurridos del período, con decimales (ej. 0.3 = ~7 horas). Mínimo 1 hora. */
export function diasTranscurridos(rango: RangoPeriodo): number {
  const desde = new Date(rango.inicio).getTime();
  const hasta = rango.fin ? new Date(rango.fin).getTime() : Date.now();
  const dias = (hasta - desde) / 86_400_000;
  return Math.max(dias, 1 / 24);
}

export interface ProyeccionCalendario {
  /** Días que faltan desde hoy (sin contar hoy) hasta el último día del mes calendario. */
  diasRestantes: number;
  /** Nombre en español del mes siguiente, ej. "septiembre". */
  mesSiguiente: string;
}

/**
 * Días restantes hasta el 1° del mes calendario que viene (sin importar el
 * período de pago del usuario, que es independiente de esto).
 */
export function proyeccionCalendario(hoy: string = hoyISO()): ProyeccionCalendario {
  const { year, month, day } = parseISO(hoy);
  const ultimoDiaDelMes = new Date(year, month + 1, 0).getDate();
  const diasRestantes = ultimoDiaDelMes - day;
  const primerDiaProximoMes = new Date(year, month + 1, 1);
  const mesSiguiente = new Intl.DateTimeFormat('es-AR', { month: 'long' }).format(primerDiaProximoMes);
  return { diasRestantes, mesSiguiente };
}
