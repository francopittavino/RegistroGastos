'use server';

import { revalidatePath } from 'next/cache';
import { sql } from './db';
import { hoyISO } from './format';
import type { CategoryKind, PaymentMethod, Unit } from './types';

export interface ItemInput {
  detail: string;
  amount: number;
  quantity: number | null;
  unit: Unit | null;
}

export interface GastoInput {
  date: string;
  categoryId: number;
  detail: string;
  amount: number;
  paymentMethod: PaymentMethod | null;
  items: ItemInput[];
}

function montoTotal(input: GastoInput): number {
  return input.items.length > 0
    ? input.items.reduce((acc, it) => acc + it.amount, 0)
    : input.amount;
}

async function guardarItems(expenseId: number, items: ItemInput[]): Promise<void> {
  for (const item of items) {
    await sql`
      insert into expense_items (expense_id, detail, amount, quantity, unit)
      values (${expenseId}, ${item.detail}, ${item.amount}, ${item.quantity}, ${item.unit})
    `;
  }
}

export async function crearGasto(input: GastoInput): Promise<{ id: number }> {
  const amount = montoTotal(input);
  const rows = (await sql`
    insert into expenses (date, category_id, detail, amount, payment_method)
    values (${input.date}, ${input.categoryId}, ${input.detail || null}, ${amount}, ${input.paymentMethod})
    returning id
  `) as { id: number }[];

  const id = rows[0].id;
  await guardarItems(id, input.items);

  revalidatePath('/');
  revalidatePath('/historial');
  return { id };
}

export async function actualizarGasto(id: number, input: GastoInput): Promise<void> {
  const amount = montoTotal(input);

  await sql`
    update expenses
    set date = ${input.date},
        category_id = ${input.categoryId},
        detail = ${input.detail || null},
        amount = ${amount},
        payment_method = ${input.paymentMethod}
    where id = ${id}
  `;

  await sql`delete from expense_items where expense_id = ${id}`;
  await guardarItems(id, input.items);

  revalidatePath('/');
  revalidatePath('/historial');
}

export async function borrarGasto(id: number): Promise<void> {
  await sql`delete from expenses where id = ${id}`;
  revalidatePath('/');
  revalidatePath('/historial');
}

export async function crearCategoria(
  name: string,
  kind: CategoryKind
): Promise<{ id: number; name: string; kind: CategoryKind }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre de la categoría no puede estar vacío');

  const rows = (await sql`
    insert into categories (name, kind)
    values (${trimmed}, ${kind})
    on conflict (name) do update set kind = excluded.kind
    returning id, name, kind
  `) as { id: number; name: string; kind: CategoryKind }[];

  revalidatePath('/nuevo');
  revalidatePath('/historial');
  return rows[0];
}

export async function actualizarConfiguracion(input: { monthlyBudget: number | null }): Promise<void> {
  await sql`
    update settings
    set monthly_budget = ${input.monthlyBudget}
    where id = 1
  `;

  revalidatePath('/');
  revalidatePath('/configuracion');
}

/**
 * Cierra el período actual y arranca uno nuevo desde hoy. Si ya existe un
 * período que empieza hoy (doble click, por ejemplo), no hace nada.
 */
export async function cerrarMes(): Promise<void> {
  await sql`
    insert into periods (start_date) values (${hoyISO()})
    on conflict (start_date) do nothing
  `;

  revalidatePath('/');
  revalidatePath('/historial');
  revalidatePath('/configuracion');
}

/**
 * Borra un período ya cerrado (nunca el actual, que sigue abierto). No
 * borra los gastos que quedaron dentro de ese rango de fechas: al
 * desaparecer el límite, esos días pasan a formar parte del período
 * anterior (los rangos se calculan siempre a partir de la lista de
 * períodos que queda, no hace falta migrar nada).
 */
export async function borrarPeriodo(id: number): Promise<void> {
  const periodos = (await sql`
    select id from periods order by start_date asc
  `) as { id: number }[];

  const esActual = periodos.at(-1)?.id === id;
  if (esActual) throw new Error('No se puede borrar el período actual');

  await sql`delete from periods where id = ${id}`;

  revalidatePath('/');
  revalidatePath('/historial');
}
