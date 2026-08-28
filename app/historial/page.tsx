import Link from 'next/link';
import { getCategories, getExpensesInRange, getPeriods, getResumenComida } from '@/lib/queries';
import { rangoDePeriodo } from '@/lib/periods';
import { formatMonto } from '@/lib/format';
import { NavPeriodo } from '@/app/components/nav-periodo';
import { FiltroCategoria } from './filtro-categoria';
import { BorrarPeriodo } from './borrar-periodo';
import { FilaGasto } from './fila-gasto';

// El período actual (sin período elegido en la URL) depende de la fecha de hoy.
export const dynamic = 'force-dynamic';

function capitalizar(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function HistorialPage({ searchParams }: PageProps<'/historial'>) {
  const { categoria, periodo, vista } = await searchParams;
  const categoriaId = typeof categoria === 'string' ? Number(categoria) : null;
  const periodoId = typeof periodo === 'string' ? Number(periodo) : null;
  const vistaComida = vista === 'comida';

  const [categorias, periodos] = await Promise.all([getCategories(), getPeriods()]);

  const index = periodoId != null ? periodos.findIndex((p) => p.id === periodoId) : undefined;
  const rango = rangoDePeriodo(periodos, index != null && index >= 0 ? index : undefined);

  const paramsBase: Record<string, string> = {};
  if (!rango.esActual) paramsBase.periodo = String(rango.periodo.id);

  function hrefPeriodo(idx: number): string {
    const params = new URLSearchParams();
    if (categoriaId) params.set('categoria', String(categoriaId));
    if (vistaComida) params.set('vista', 'comida');
    const esElActual = idx === periodos.length - 1;
    if (!esElActual) params.set('periodo', String(periodos[idx].id));
    const qs = params.toString();
    return qs ? `/historial?${qs}` : '/historial';
  }

  function hrefVista(v: 'gastos' | 'comida'): string {
    const params = new URLSearchParams();
    if (!rango.esActual) params.set('periodo', String(rango.periodo.id));
    if (v === 'comida') params.set('vista', 'comida');
    const qs = params.toString();
    return qs ? `/historial?${qs}` : '/historial';
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold">Historial</h1>

      <NavPeriodo rango={rango} hrefPeriodo={hrefPeriodo} />

      {!rango.esActual ? <BorrarPeriodo periodoId={rango.periodo.id} /> : null}

      <div className="flex gap-2 rounded-xl border border-border bg-surface p-1">
        <Link
          href={hrefVista('gastos')}
          className={`min-h-[40px] flex-1 rounded-lg text-center text-sm font-medium leading-[40px] ${
            !vistaComida ? 'bg-accent text-accent-foreground' : 'text-muted'
          }`}
        >
          Gastos
        </Link>
        <Link
          href={hrefVista('comida')}
          className={`min-h-[40px] flex-1 rounded-lg text-center text-sm font-medium leading-[40px] ${
            vistaComida ? 'bg-accent text-accent-foreground' : 'text-muted'
          }`}
        >
          Comida
        </Link>
      </div>

      {vistaComida ? (
        <ResumenComida desde={rango.inicio} hasta={rango.fin} />
      ) : (
        <ListaDeGastos
          desde={rango.inicio}
          hasta={rango.fin}
          categorias={categorias}
          categoriaId={categoriaId}
          paramsBase={paramsBase}
        />
      )}
    </div>
  );
}

async function ListaDeGastos({
  desde,
  hasta,
  categorias,
  categoriaId,
  paramsBase,
}: {
  desde: string;
  hasta: string | null;
  categorias: Awaited<ReturnType<typeof getCategories>>;
  categoriaId: number | null;
  paramsBase: Record<string, string>;
}) {
  const gastosTodos = await getExpensesInRange(desde, hasta);
  const gastos = categoriaId ? gastosTodos.filter((g) => g.categoryId === categoriaId) : gastosTodos;

  return (
    <>
      <FiltroCategoria categorias={categorias} categoriaIdActual={categoriaId} paramsBase={paramsBase} />

      {gastos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No hay gastos cargados en este período.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {gastos.map((g) => (
            <FilaGasto key={g.id} gasto={g} />
          ))}
        </ul>
      )}
    </>
  );
}

async function ResumenComida({ desde, hasta }: { desde: string; hasta: string | null }) {
  const resumen = await getResumenComida(desde, hasta);

  if (resumen.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Todavía no cargaste cantidades de comida en este período. Al cargar un gasto, activá "+ agregar
        ítems" y completá cantidad y unidad de cada uno.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {resumen.map((r) => (
        <li
          key={`${r.detalle}-${r.unit}`}
          className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
        >
          <p className="min-w-0 truncate text-sm font-medium">{capitalizar(r.detalle)}</p>
          <div className="flex shrink-0 items-baseline gap-3">
            <p className="text-base font-semibold tabular-nums">
              {r.cantidadTotal} {r.unit}
            </p>
            <p className="text-xs tabular-nums text-muted">{formatMonto(r.montoTotal)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
