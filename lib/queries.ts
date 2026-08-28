import { sql } from './db';
import type { Category, Expense, ExpenseItem, Period, Settings, Unit } from './types';

export async function getCategories(): Promise<Category[]> {
  const rows = (await sql`
    select id, name, kind from categories order by kind asc, name asc
  `) as { id: number; name: string; kind: 'comida' | 'otros' }[];
  return rows;
}

export async function getSettings(): Promise<Settings> {
  const rows = (await sql`
    select monthly_budget from settings where id = 1
  `) as { monthly_budget: string | null }[];
  const row = rows[0];
  return {
    monthlyBudget: row?.monthly_budget != null ? Number(row.monthly_budget) : null,
  };
}

/** Todos los períodos, ordenados del más viejo al más nuevo (el actual es el último). */
export async function getPeriods(): Promise<Period[]> {
  const rows = (await sql`
    select id, to_char(start_date, 'YYYY-MM-DD') as start_date from periods order by start_date asc
  `) as { id: number; start_date: string }[];
  return rows.map((r) => ({ id: r.id, startDate: r.start_date }));
}

interface ExpenseRow {
  id: number;
  date: string;
  category_id: number;
  category_name: string;
  category_kind: 'comida' | 'otros';
  detail: string | null;
  amount: string;
  payment_method: Expense['paymentMethod'];
}

interface ItemRow {
  id: number;
  expense_id: number;
  detail: string;
  amount: string;
  quantity: string | null;
  unit: Unit | null;
}

function mapItemRow(it: ItemRow): ExpenseItem {
  return {
    id: it.id,
    detail: it.detail,
    amount: Number(it.amount),
    quantity: it.quantity != null ? Number(it.quantity) : null,
    unit: it.unit,
  };
}

/** Trae los gastos en [desde, hasta), con sus ítems de desglose si tienen. */
export async function getExpensesInRange(desde: string, hasta: string): Promise<Expense[]> {
  const rows = (await sql`
    select
      e.id, to_char(e.date, 'YYYY-MM-DD') as date, e.category_id, c.name as category_name, c.kind as category_kind,
      e.detail, e.amount, e.payment_method
    from expenses e
    join categories c on c.id = e.category_id
    where e.date >= ${desde} and e.date < ${hasta}
    order by e.date desc, e.id desc
  `) as ExpenseRow[];

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const itemRows = (await sql`
    select id, expense_id, detail, amount, quantity, unit
    from expense_items
    where expense_id = any(${ids})
    order by id asc
  `) as ItemRow[];

  const itemsByExpense = new Map<number, ExpenseItem[]>();
  for (const it of itemRows) {
    const list = itemsByExpense.get(it.expense_id) ?? [];
    list.push(mapItemRow(it));
    itemsByExpense.set(it.expense_id, list);
  }

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryKind: r.category_kind,
    detail: r.detail,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    items: itemsByExpense.get(r.id) ?? [],
  }));
}

export async function getExpenseById(id: number): Promise<Expense | null> {
  const rows = (await sql`
    select
      e.id, to_char(e.date, 'YYYY-MM-DD') as date, e.category_id, c.name as category_name, c.kind as category_kind,
      e.detail, e.amount, e.payment_method
    from expenses e
    join categories c on c.id = e.category_id
    where e.id = ${id}
  `) as ExpenseRow[];
  const r = rows[0];
  if (!r) return null;

  const itemRows = (await sql`
    select id, expense_id, detail, amount, quantity, unit
    from expense_items where expense_id = ${id} order by id asc
  `) as ItemRow[];

  return {
    id: r.id,
    date: r.date,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryKind: r.category_kind,
    detail: r.detail,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    items: itemRows.map(mapItemRow),
  };
}

export interface Totales {
  totalComida: number;
  totalTodo: number;
}

export async function getTotales(desde: string, hasta: string): Promise<Totales> {
  const rows = (await sql`
    select
      coalesce(sum(e.amount) filter (where c.kind = 'comida'), 0) as total_comida,
      coalesce(sum(e.amount), 0) as total_todo
    from expenses e
    join categories c on c.id = e.category_id
    where e.date >= ${desde} and e.date < ${hasta}
  `) as { total_comida: string; total_todo: string }[];
  const row = rows[0];
  return {
    totalComida: Number(row?.total_comida ?? 0),
    totalTodo: Number(row?.total_todo ?? 0),
  };
}

export interface TotalPorCategoria {
  categoryId: number;
  categoryName: string;
  kind: 'comida' | 'otros';
  total: number;
}

/** Total gastado por categoría en [desde, hasta), de mayor a menor. Solo categorías con gasto > 0. */
export async function getTotalesPorCategoria(desde: string, hasta: string): Promise<TotalPorCategoria[]> {
  const rows = (await sql`
    select c.id as category_id, c.name as category_name, c.kind, sum(e.amount) as total
    from expenses e
    join categories c on c.id = e.category_id
    where e.date >= ${desde} and e.date < ${hasta}
    group by c.id, c.name, c.kind
    order by total desc
  `) as { category_id: number; category_name: string; kind: 'comida' | 'otros'; total: string }[];

  return rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    kind: r.kind,
    total: Number(r.total),
  }));
}

export interface ResumenComidaItem {
  detalle: string;
  unit: Unit;
  cantidadTotal: number;
  montoTotal: number;
}

/**
 * Cantidades totales de comida cargadas en [desde, hasta), agrupadas por
 * nombre de ítem + unidad. Solo cuenta ítems con cantidad y unidad cargadas,
 * de gastos en categorías de comida. Pensado para planear la compra del mes
 * siguiente (ej. "compraste 5kg de arroz este mes").
 */
export async function getResumenComida(desde: string, hasta: string): Promise<ResumenComidaItem[]> {
  const rows = (await sql`
    select
      lower(trim(i.detail)) as detalle,
      i.unit,
      sum(i.quantity) as cantidad_total,
      sum(i.amount) as monto_total
    from expense_items i
    join expenses e on e.id = i.expense_id
    join categories c on c.id = e.category_id
    where e.date >= ${desde} and e.date < ${hasta}
      and c.kind = 'comida'
      and i.quantity is not null
      and i.unit is not null
    group by lower(trim(i.detail)), i.unit
    order by cantidad_total desc
  `) as { detalle: string; unit: Unit; cantidad_total: string; monto_total: string }[];

  return rows.map((r) => ({
    detalle: r.detalle,
    unit: r.unit,
    cantidadTotal: Number(r.cantidad_total),
    montoTotal: Number(r.monto_total),
  }));
}
