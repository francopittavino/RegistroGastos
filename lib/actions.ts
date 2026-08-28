'use server';

import { revalidatePath } from 'next/cache';
import { sql } from './db';
import { PAYMENT_METHODS, UNITS } from './types';
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

const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;
const PAYMENT_VALUES = PAYMENT_METHODS.map((m) => m.value);
const UNIT_VALUES = UNITS.map((u) => u.value);

/**
 * Las Server Actions son endpoints POST públicos: el formulario ya valida
 * todo esto del lado del cliente, pero cualquiera que conozca la URL puede
 * mandar un POST directo sin pasar por la UI. Esta validación es la última
 * línea de defensa, no la principal (esa sigue siendo la del formulario).
 */
function validarGastoInput(input: GastoInput): void {
  if (!FECHA_RE.test(input.date)) throw new Error('Fecha inválida');
  if (!Number.isInteger(input.categoryId) || input.categoryId <= 0) {
    throw new Error('Categoría inválida');
  }
  if (input.paymentMethod != null && !PAYMENT_VALUES.includes(input.paymentMethod)) {
    throw new Error('Medio de pago inválido');
  }
  if (input.items.length === 0) {
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('El monto tiene que ser mayor a cero');
    }
  } else {
    for (const item of input.items) {
      if (!Number.isFinite(item.amount) || item.amount <= 0) {
        throw new Error('El monto de cada ítem tiene que ser mayor a cero');
      }
      if (item.quantity != null && (!Number.isFinite(item.quantity) || item.quantity <= 0)) {
        throw new Error('La cantidad de cada ítem tiene que ser mayor a cero');
      }
      if (item.unit != null && !UNIT_VALUES.includes(item.unit)) {
        throw new Error('Unidad inválida');
      }
    }
  }
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
  validarGastoInput(input);
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
  validarGastoInput(input);
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

function validarNombreCategoria(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('El nombre de la categoría no puede estar vacío');
  if (trimmed.length > 40) throw new Error('El nombre de la categoría es demasiado largo');
  return trimmed;
}

function validarKind(kind: CategoryKind): void {
  if (kind !== 'comida' && kind !== 'otros') throw new Error('Tipo de categoría inválido');
}

export async function crearCategoria(
  name: string,
  kind: CategoryKind
): Promise<{ id: number; name: string; kind: CategoryKind }> {
  const trimmed = validarNombreCategoria(name);
  validarKind(kind);

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

export async function actualizarCategoria(id: number, name: string, kind: CategoryKind): Promise<void> {
  const trimmed = validarNombreCategoria(name);
  validarKind(kind);

  await sql`update categories set name = ${trimmed}, kind = ${kind} where id = ${id}`;

  revalidatePath('/nuevo');
  revalidatePath('/historial');
  revalidatePath('/configuracion');
  revalidatePath('/');
}

/** No se puede borrar una categoría que ya tiene gastos cargados (se pierde el historial). */
export async function borrarCategoria(id: number): Promise<void> {
  const rows = (await sql`select count(*)::int as n from expenses where category_id = ${id}`) as {
    n: number;
  }[];
  if (rows[0].n > 0) {
    throw new Error('No se puede borrar: tiene gastos cargados en esa categoría');
  }

  await sql`delete from categories where id = ${id}`;

  revalidatePath('/nuevo');
  revalidatePath('/historial');
  revalidatePath('/configuracion');
}

export async function actualizarConfiguracion(input: { monthlyBudget: number | null }): Promise<void> {
  if (input.monthlyBudget != null && (!Number.isFinite(input.monthlyBudget) || input.monthlyBudget < 0)) {
    throw new Error('El presupuesto tiene que ser un número válido');
  }

  await sql`
    update settings
    set monthly_budget = ${input.monthlyBudget}
    where id = 1
  `;

  revalidatePath('/');
  revalidatePath('/configuracion');
}

/**
 * Cierra el período actual y arranca uno nuevo en este mismo instante (con
 * precisión de segundo, no solo de día): los gastos cargados antes de este
 * momento quedan en el período que se cierra, y los que se carguen de acá
 * en adelante caen en el nuevo, aunque sea el mismo día.
 */
export async function cerrarMes(): Promise<void> {
  await sql`insert into periods (start_at) values (now())`;

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
    select id from periods order by start_at asc
  `) as { id: number }[];

  const esActual = periodos.at(-1)?.id === id;
  if (esActual) throw new Error('No se puede borrar el período actual');

  await sql`delete from periods where id = ${id}`;

  revalidatePath('/');
  revalidatePath('/historial');
}
