'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarConfiguracion, cerrarMes } from '@/lib/actions';
import { formatFechaHora } from '@/lib/format';
import type { Settings } from '@/lib/types';

interface Props {
  settingsIniciales: Settings;
  inicioPeriodoActual: string;
}

export function ConfiguracionForm({ settingsIniciales, inicioPeriodoActual }: Props) {
  const router = useRouter();
  const [monthlyBudget, setMonthlyBudget] = useState(
    settingsIniciales.monthlyBudget != null ? String(settingsIniciales.monthlyBudget) : ''
  );
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [confirmandoCierre, setConfirmandoCierre] = useState(false);
  const [cerrando, startCerrarTransition] = useTransition();
  const [cerrado, setCerrado] = useState(false);

  function guardarConfiguracion() {
    setError(null);
    setGuardadoOk(false);

    const presupuesto = monthlyBudget.trim() ? parseFloat(monthlyBudget.replace(',', '.')) : null;
    if (presupuesto != null && (Number.isNaN(presupuesto) || presupuesto < 0)) {
      setError('El presupuesto tiene que ser un número válido');
      return;
    }

    startTransition(async () => {
      try {
        await actualizarConfiguracion({ monthlyBudget: presupuesto });
        setGuardadoOk(true);
        setTimeout(() => setGuardadoOk(false), 2000);
      } catch {
        setError('No se pudo guardar la configuración');
      }
    });
  }

  function confirmarCierreDeMes() {
    startCerrarTransition(async () => {
      await cerrarMes();
      setConfirmandoCierre(false);
      setCerrado(true);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="text-lg font-semibold">Configuración</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Período actual</h2>
        <p className="text-sm text-muted">Empezó el {formatFechaHora(inicioPeriodoActual)}.</p>

        {cerrado ? (
          <p className="text-sm text-accent">Arrancó un período nuevo recién ✓</p>
        ) : confirmandoCierre ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              ¿Cerrar este período ahora mismo y arrancar uno nuevo? Los gastos ya cargados no se
              borran, quedan guardados en el período que se cierra.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmarCierreDeMes}
                disabled={cerrando}
                className="min-h-[44px] flex-1 rounded-xl bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-60"
              >
                {cerrando ? 'Cerrando…' : 'Sí, cerrar mes'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmandoCierre(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-border text-sm font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoCierre(true)}
            className="min-h-[48px] rounded-xl border border-border text-sm font-semibold"
          >
            Cobré: cerrar mes y empezar de nuevo
          </button>
        )}
      </section>

      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="presupuesto">
            Presupuesto total del período (opcional)
          </label>
          <input
            id="presupuesto"
            type="text"
            inputMode="decimal"
            placeholder="$0"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            className="min-h-[44px] w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
          />
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        {guardadoOk ? <p className="text-sm text-accent">Guardado ✓</p> : null}

        <button
          type="button"
          onClick={guardarConfiguracion}
          disabled={pending}
          className="min-h-[48px] rounded-xl bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Guardando…' : 'Guardar configuración'}
        </button>
      </section>
    </div>
  );
}
