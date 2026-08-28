import { hoyISO } from './format';
import type { Period, RangoPeriodo } from './types';

function parseISO(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month: month - 1, day };
}

function diffDays(fromISO: string, toISOStr: string): number {
  const a = parseISO(fromISO);
  const b = parseISO(toISOStr);
  const ms = new Date(b.year, b.month, b.day).getTime() - new Date(a.year, a.month, a.day).getTime();
  return Math.round(ms / 86_400_000);
}

function sumarDias(iso: string, dias: number): string {
  const { year, month, day } = parseISO(iso);
  const d = new Date(year, month, day + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Dado el listado completo de períodos (ordenado por start_date asc) y un
 * índice objetivo (por defecto el último = período actual/abierto), arma el
 * rango de fechas de ese período. El fin de un período es el inicio del
 * siguiente, o "mañana" si es el período actual (todavía abierto).
 */
export function rangoDePeriodo(periodos: Period[], index?: number): RangoPeriodo {
  const idx = index ?? periodos.length - 1;
  const periodo = periodos[idx];
  const siguiente = periodos[idx + 1];
  const esActual = idx === periodos.length - 1;

  const inicio = periodo.startDate;
  const fin = siguiente ? siguiente.startDate : sumarDias(hoyISO(), 1);

  return {
    periodo,
    index: idx,
    esActual,
    hayAnterior: idx > 0,
    haySiguiente: idx < periodos.length - 1,
    inicio,
    fin,
  };
}

export function diasTranscurridos(rango: RangoPeriodo): number {
  const hasta = rango.esActual ? hoyISO() : sumarDias(rango.fin, -1);
  // Mínimo 1: evita división por cero si por algún desfasaje de reloj el
  // período figura como arrancado "hoy mismo, más tarde" que la hora actual.
  return Math.max(1, diffDays(rango.inicio, hasta) + 1);
}
