'use server';

import { revalidatePath } from 'next/cache';
import { sql } from './db';
import { parseCsv, parseFechaCsv, parseMontoCsv, parseMedioPagoCsv, exportarCsv } from './csv';
import { getAllExpenses } from './queries';
import { hoyISO } from './format';
import type { CategoryKind, PaymentMethod } from './types';

export interface ItemInput {
  detail: string;
  amount: number;
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

export async function crearGasto(input: GastoInput): Promise<{ id: number }> {
  const amount = montoTotal(input);
  const rows = (await sql`
    insert into expenses (date, category_id, detail, amount, payment_method)
    values (${input.date}, ${input.categoryId}, ${input.detail || null}, ${amount}, ${input.paymentMethod})
    returning id
  `) as { id: number }[];

  const id = rows[0].id;

  for (const item of input.items) {
    await sql`
      insert into expense_items (expense_id, detail, amount)
      values (${id}, ${item.detail}, ${item.amount})
    `;
  }

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
  for (const item of input.items) {
    await sql`
      insert into expense_items (expense_id, detail, amount)
      values (${id}, ${item.detail}, ${item.amount})
    `;
  }

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

export interface ResultadoImport {
  importadas: number;
  errores: { linea: number; motivo: string }[];
}

export async function importarCsv(csvText: string): Promise<ResultadoImport> {
  const filas = parseCsv(csvText);
  const errores: ResultadoImport['errores'] = [];
  let importadas = 0;

  const categoriasExistentes = (await sql`select id, name, kind from categories`) as {
    id: number;
    name: string;
    kind: CategoryKind;
  }[];
  const porNombre = new Map(categoriasExistentes.map((c) => [c.name.toLowerCase(), c]));

  for (let i = 0; i < filas.length; i++) {
    const fila = filas[i];
    const numeroLinea = i + 2; // +1 por índice 0, +1 por la línea de header

    const fecha = parseFechaCsv(fila.fecha);
    if (!fecha) {
      errores.push({ linea: numeroLinea, motivo: `Fecha inválida: "${fila.fecha}"` });
      continue;
    }

    const monto = parseMontoCsv(fila.monto);
    if (monto === null) {
      errores.push({ linea: numeroLinea, motivo: `Monto inválido: "${fila.monto}"` });
      continue;
    }

    if (!fila.categoria.trim()) {
      errores.push({ linea: numeroLinea, motivo: 'Falta la categoría' });
      continue;
    }

    let categoria = porNombre.get(fila.categoria.trim().toLowerCase());
    if (!categoria) {
      const nuevas = (await sql`
        insert into categories (name, kind)
        values (${fila.categoria.trim()}, 'otros')
        on conflict (name) do update set name = excluded.name
        returning id, name, kind
      `) as { id: number; name: string; kind: CategoryKind }[];
      categoria = nuevas[0];
      porNombre.set(categoria.name.toLowerCase(), categoria);
    }

    const medioPago = parseMedioPagoCsv(fila.medioPago);

    await sql`
      insert into expenses (date, category_id, detail, amount, payment_method)
      values (${fecha}, ${categoria.id}, ${fila.detalle || null}, ${monto}, ${medioPago})
    `;
    importadas++;
  }

  revalidatePath('/');
  revalidatePath('/historial');
  revalidatePath('/nuevo');

  return { importadas, errores };
}

export async function exportarCsvAction(): Promise<string> {
  const gastos = await getAllExpenses();
  return exportarCsv(gastos);
}
