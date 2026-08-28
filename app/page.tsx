import Link from 'next/link';
import { getPeriods, getSettings, getTotales, getTotalesPorCategoria } from '@/lib/queries';
import { rangoDePeriodo, diasTranscurridos, proyeccionCalendario } from '@/lib/periods';
import { formatMonto, formatFecha } from '@/lib/format';
import { GraficoTorta } from '@/app/components/grafico-torta';

// El total y el promedio dependen de la fecha de hoy, no solo de los datos:
// no se puede prerenderizar como estática o quedaría con el "hoy" congelado.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const [settings, periodos] = await Promise.all([getSettings(), getPeriods()]);
  const rango = rangoDePeriodo(periodos);
  const [{ totalComida, totalTodo }, porCategoria] = await Promise.all([
    getTotales(rango.inicio, rango.fin),
    getTotalesPorCategoria(rango.inicio, rango.fin),
  ]);

  const dias = diasTranscurridos(rango);
  const promedioDiarioComida = totalComida / dias;

  const presupuesto = settings.monthlyBudget;
  const restanteActual = presupuesto != null ? presupuesto - totalTodo : null;

  const promedioDiarioTotal = totalTodo / dias;
  const { diasRestantes, mesSiguiente } = proyeccionCalendario();
  const gastoProyectadoRestante = promedioDiarioTotal * diasRestantes;
  const totalProyectadoFinDeMes = totalTodo + gastoProyectadoRestante;
  const restanteProyectado = presupuesto != null ? presupuesto - totalProyectadoFinDeMes : null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link
        href="/nuevo"
        className="flex min-h-[56px] items-center justify-center rounded-2xl bg-accent text-lg font-semibold text-accent-foreground active:opacity-80"
      >
        + Cargar gasto
      </Link>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h1 className="text-sm font-medium text-muted">Gastado este período</h1>
        <p className="mt-1 text-4xl font-bold tabular-nums">{formatMonto(totalTodo)}</p>
        <div className="mt-4 border-t border-border pt-4">
          <GraficoTorta categorias={porCategoria} />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">Comida</h2>
        <p className="mt-1 text-2xl font-bold tabular-nums">{formatMonto(totalComida)}</p>
        <p className="mt-1 text-sm text-muted">
          Promedio diario: <span className="tabular-nums text-foreground">{formatMonto(promedioDiarioComida)}</span>
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted">Presupuesto</h2>

        {presupuesto != null ? (
          <>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${restanteActual != null && restanteActual < 0 ? 'text-danger' : ''}`}
            >
              {restanteActual != null && restanteActual < 0
                ? `Te pasaste ${formatMonto(Math.abs(restanteActual))}`
                : `Te quedan ${formatMonto(restanteActual ?? 0)}`}
            </p>
            <p className={`mt-2 text-sm ${restanteProyectado != null && restanteProyectado < 0 ? 'text-danger' : 'text-muted'}`}>
              Si seguís a este ritmo, para el 1° de {mesSiguiente}{' '}
              {restanteProyectado != null && restanteProyectado < 0
                ? `te vas a pasar por ${formatMonto(Math.abs(restanteProyectado))}`
                : `te van a quedar ${formatMonto(restanteProyectado ?? 0)}`}
              .
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">
            Proyectado para el 1° de {mesSiguiente}: <span className="text-foreground">{formatMonto(totalProyectadoFinDeMes)}</span>.
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
