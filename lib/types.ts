export type CategoryKind = 'comida' | 'otros';

export interface Category {
  id: number;
  name: string;
  kind: CategoryKind;
}

export type PaymentMethod = 'efectivo' | 'debito' | 'transferencia' | 'otro';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'debito', label: 'Débito' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'otro', label: 'Otro' },
];

export interface ExpenseItem {
  id: number;
  detail: string;
  amount: number;
}

export interface Expense {
  id: number;
  date: string;
  categoryId: number;
  categoryName: string;
  categoryKind: CategoryKind;
  detail: string | null;
  amount: number;
  paymentMethod: PaymentMethod | null;
  items: ExpenseItem[];
}

export interface Settings {
  monthlyBudget: number | null;
}

export interface Period {
  id: number;
  startDate: string;
}

export interface RangoPeriodo {
  periodo: Period;
  /** Índice del período dentro de la lista completa, ordenada por fecha. */
  index: number;
  /** true si es el período abierto actualmente (el más reciente). */
  esActual: boolean;
  hayAnterior: boolean;
  haySiguiente: boolean;
  /** Primer día del período, inclusive. */
  inicio: string;
  /** Primer día después del período, exclusive (hoy + 1 si es el actual). */
  fin: string;
}
