import Link from 'next/link';
import { getPeriods, getSettings, getTotales } from '@/lib/queries';
import { rangoDePeriodo, diasTranscurridos } from '@/lib/periods';
import { formatMonto, formatFecha } from '@/lib/format';

// El total y el promedio dependen de la fecha de hoy, no solo de los datos:
// no se puede prerenderizar como estática o quedaría con el "hoy" congelado.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [settings, periodos] = await Promise.all([getSettings(), getPeriods()]);
  const rango = rangoDePeriodo(periodos);
  const { totalComida, totalTodo } = await getTotales(rango.inicio, rango.fin);

  const dias = diasTranscurridos(rango);
  const promedioDiario = totalComida / dias;
  const proyeccion30dias = promedioDiario * 30;

  const presupuesto = settings.monthlyBudget;
  const restante = presupuesto != null ? presupuesto - totalTodo : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link
        href="/nuevo"
        className="flex min-h-[56px] items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-accent-foreground active:opacity-80"
      >
        + Cargar gasto
      </Link>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h1 className="text-sm font-medium text-muted">Comida este período</h1>
        <p className="mt-1 text-4xl font-bold tabular-nums">{formatMonto(totalComida)}</p>

        <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4">
          <div>
            <dt className="text-xs text-muted">Promedio diario</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatMonto(promedioDiario)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Proyección a 30 días</dt>
            <dd className="text-lg font-semibold tabular-nums">{formatMonto(proyeccion30dias)}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">Total del período (todas las categorías)</h2>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatMonto(totalTodo)}</p>

        {presupuesto != null && restante != null ? (
          <p className={`mt-2 text-sm font-medium ${restante < 0 ? 'text-danger' : 'text-muted'}`}>
            {restante < 0
              ? `Te pasaste por ${formatMonto(Math.abs(restante))}`
              : `Te quedan ${formatMonto(restante)} de presupuesto`}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No configuraste un presupuesto todavía.{' '}
            <Link href="/configuracion" className="text-accent underline">
              Configurar
            </Link>
          </p>
        )}
      </section>

      <p className="px-1 text-center text-xs text-muted">
        Período iniciado el {formatFecha(rango.inicio)} · día {dias}{' '}
        <Link href="/configuracion" className="underline">
          ¿Cobraste? Cerrá el mes
        </Link>
      </p>
    </div>
  );
}
