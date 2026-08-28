import { sql } from './db';
import type { Category, Expense, ExpenseItem, Period, Settings } from './types';

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
    select id, expense_id, detail, amount
    from expense_items
    where expense_id = any(${ids})
    order by id asc
  `) as { id: number; expense_id: number; detail: string; amount: string }[];

  const itemsByExpense = new Map<number, ExpenseItem[]>();
  for (const it of itemRows) {
    const list = itemsByExpense.get(it.expense_id) ?? [];
    list.push({ id: it.id, detail: it.detail, amount: Number(it.amount) });
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
    select id, detail, amount from expense_items where expense_id = ${id} order by id asc
  `) as { id: number; detail: string; amount: string }[];

  return {
    id: r.id,
    date: r.date,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryKind: r.category_kind,
    detail: r.detail,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    items: itemRows.map((it) => ({ id: it.id, detail: it.detail, amount: Number(it.amount) })),
  };
}

/** Todos los gastos, sin filtrar por período. Pensado para exportar a CSV. */
export async function getAllExpenses(): Promise<Expense[]> {
  const rows = (await sql`
    select
      e.id, to_char(e.date, 'YYYY-MM-DD') as date, e.category_id, c.name as category_name, c.kind as category_kind,
      e.detail, e.amount, e.payment_method
    from expenses e
    join categories c on c.id = e.category_id
    order by e.date desc, e.id desc
  `) as ExpenseRow[];

  return rows.map((r) => ({
    id: r.id,
    date: r.date,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryKind: r.category_kind,
    detail: r.detail,
    amount: Number(r.amount),
    paymentMethod: r.payment_method,
    items: [],
  }));
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
