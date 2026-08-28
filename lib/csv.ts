import type { Expense, PaymentMethod } from './types';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'efectivo',
  debito: 'debito',
  transferencia: 'transferencia',
  otro: 'otro',
};

/** Parsea una línea CSV respetando campos entre comillas (con "" como escape). */
function parseLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

export interface FilaCsvCruda {
  fecha: string;
  categoria: string;
  detalle: string;
  monto: string;
  medioPago: string;
}

/** Parsea el texto completo de un CSV con columnas fecha,categoria,detalle,monto,medio_pago. */
export function parseCsv(text: string): FilaCsvCruda[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // La primera línea se asume header y se descarta.
  const dataLines = lines.slice(1);

  return dataLines.map((line) => {
    const [fecha = '', categoria = '', detalle = '', monto = '', medioPago = ''] = parseLine(line);
    return { fecha, categoria, detalle, monto, medioPago };
  });
}

/** Acepta DD/MM/AAAA (formato argentino) o AAAA-MM-DD (ISO). Devuelve ISO o null si es inválida. */
export function parseFechaCsv(raw: string): string | null {
  const s = raw.trim();

  const conBarras = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (conBarras) {
    const [, d, m, y] = conBarras;
    const day = Number(d);
    const month = Number(m);
    const year = Number(y);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const conGuiones = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (conGuiones) {
    const [, y, m, d] = conGuiones;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return null;
}

/** Acepta formato argentino ("45.000", "45000,50") o plano ("45000", "45000.50"). */
export function parseMontoCsv(raw: string): number | null {
  const s = raw.trim();
  if (!s) return null;

  let normalizado: string;
  if (s.includes(',')) {
    // Asume '.' como separador de miles y ',' como decimal.
    normalizado = s.replace(/\./g, '').replace(',', '.');
  } else {
    normalizado = s;
  }

  const n = Number(normalizado);
  return Number.isFinite(n) ? n : null;
}

export function parseMedioPagoCsv(raw: string): PaymentMethod | null {
  const s = raw.trim().toLowerCase();
  if (s === 'efectivo') return 'efectivo';
  if (s === 'debito' || s === 'débito') return 'debito';
  if (s === 'transferencia') return 'transferencia';
  if (s === 'otro') return 'otro';
  return null;
}

/** Genera el CSV de exportación con columnas fecha,categoria,detalle,monto,medio_pago. */
export function exportarCsv(expenses: Expense[]): string {
  const escape = (value: string) => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const header = 'fecha,categoria,detalle,monto,medio_pago';
  const rows = expenses.map((e) => {
    const [year, month, day] = e.date.split('-');
    const fecha = `${day}/${month}/${year}`;
    const medioPago = e.paymentMethod ? PAYMENT_LABELS[e.paymentMethod] : '';
    return [
      fecha,
      escape(e.categoryName),
      escape(e.detail ?? ''),
      e.amount.toString(),
      medioPago,
    ].join(',');
  });

  return [header, ...rows].join('\n');
}
