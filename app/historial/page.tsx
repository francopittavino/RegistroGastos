import Link from 'next/link';
import { getCategories, getExpensesInRange, getPeriods } from '@/lib/queries';
import { rangoDePeriodo } from '@/lib/periods';
import { formatFecha, formatMonto } from '@/lib/format';
import { FiltroCategoria } from './filtro-categoria';

// El período actual (sin período elegido en la URL) depende de la fecha de hoy.
export const dynamic = 'force-dynamic';

export default async function HistorialPage({ searchParams }: PageProps<'/historial'>) {
  const { categoria, periodo } = await searchParams;
  const categoriaId = typeof categoria === 'string' ? Number(categoria) : null;
  const periodoId = typeof periodo === 'string' ? Number(periodo) : null;

  const [categorias, periodos] = await Promise.all([getCategories(), getPeriods()]);

  const index = periodoId != null ? periodos.findIndex((p) => p.id === periodoId) : undefined;
  const rango = rangoDePeriodo(periodos, index != null && index >= 0 ? index : undefined);

  const gastosTodos = await getExpensesInRange(rango.inicio, rango.fin);
  const gastos = categoriaId ? gastosTodos.filter((g) => g.categoryId === categoriaId) : gastosTodos;

  const paramsBase: Record<string, string> = {};
  if (!rango.esActual) paramsBase.periodo = String(rango.periodo.id);

  function hrefPeriodo(idx: number): string {
    const params = new URLSearchParams();
    if (categoriaId) params.set('categoria', String(categoriaId));
    const esElActual = idx === periodos.length - 1;
    if (!esElActual) params.set('periodo', String(periodos[idx].id));
    const qs = params.toString();
    return qs ? `/historial?${qs}` : '/historial';
  }

  const finLabel = rango.esActual ? 'hoy' : formatFecha(sumarUnDia(rango.fin, -1));

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Historial</h1>

      <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-2 py-2">
        {rango.hayAnterior ? (
          <Link
            href={hrefPeriodo(rango.index - 1)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg"
            aria-label="Período anterior"
          >
            ‹
          </Link>
        ) : (
          <span className="min-w-[44px]" />
        )}
        <div className="text-center text-sm">
          <p className="font-medium">
            {formatFecha(rango.inicio)} – {finLabel}
          </p>
          {rango.esActual ? <p className="text-xs text-muted">Período actual</p> : null}
        </div>
        {rango.haySiguiente ? (
          <Link
            href={hrefPeriodo(rango.index + 1)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg"
            aria-label="Período siguiente"
          >
            ›
          </Link>
        ) : (
          <span className="min-w-[44px]" />
        )}
      </div>

      <FiltroCategoria categorias={categorias} categoriaIdActual={categoriaId} paramsBase={paramsBase} />

      {gastos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No hay gastos cargados en este período.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastos.map((g) => (
            <li key={g.id}>
              <Link
                href={`/historial/${g.id}/editar`}
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {g.categoryName}
                    {g.detail ? <span className="text-muted"> · {g.detail}</span> : null}
                  </p>
                  <p className="text-xs text-muted">{formatFecha(g.date)}</p>
                </div>
                <p className="shrink-0 text-base font-semibold tabular-nums">{formatMonto(g.amount)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function sumarUnDia(iso: string, dias: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + dias);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
