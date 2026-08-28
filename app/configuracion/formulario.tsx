'use client';

import { useRef, useState, useTransition } from 'react';
import { actualizarConfiguracion, cerrarMes, importarCsv, exportarCsvAction, type ResultadoImport } from '@/lib/actions';
import { formatFecha } from '@/lib/format';
import type { Settings } from '@/lib/types';

interface Props {
  settingsIniciales: Settings;
  inicioPeriodoActual: string;
}

export function ConfiguracionForm({ settingsIniciales, inicioPeriodoActual }: Props) {
  const [monthlyBudget, setMonthlyBudget] = useState(
    settingsIniciales.monthlyBudget != null ? String(settingsIniciales.monthlyBudget) : ''
  );
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [resultadoImport, setResultadoImport] = useState<ResultadoImport | null>(null);
  const [importando, startImportTransition] = useTransition();
  const [exportando, startExportTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    });
  }

  function importarArchivo(file: File) {
    setResultadoImport(null);
    startImportTransition(async () => {
      const texto = await file.text();
      const resultado = await importarCsv(texto);
      setResultadoImport(resultado);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  }

  function exportar() {
    startExportTransition(async () => {
      const csv = await exportarCsvAction();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gastos-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div className="flex flex-col gap-6 pb-8">
      <h1 className="text-lg font-semibold">Configuración</h1>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Período actual</h2>
        <p className="text-sm text-muted">Empezó el {formatFecha(inicioPeriodoActual)}.</p>

        {cerrado ? (
          <p className="text-sm text-accent">Arrancó un período nuevo hoy ✓</p>
        ) : confirmandoCierre ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm">
              ¿Cerrar este período y arrancar uno nuevo hoy? Los gastos ya cargados no se borran, quedan
              guardados en el período que se cierra.
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

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Importar CSV</h2>
        <p className="text-xs text-muted">Columnas esperadas: fecha, categoria, detalle, monto, medio_pago</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importarArchivo(file);
          }}
          className="min-h-[44px] text-sm file:mr-3 file:min-h-[44px] file:rounded-xl file:border-0 file:bg-accent file:px-4 file:text-sm file:font-semibold file:text-accent-foreground"
        />
        {importando ? <p className="text-sm text-muted">Importando…</p> : null}
        {resultadoImport ? (
          <div className="text-sm">
            <p className="text-accent">{resultadoImport.importadas} gastos importados</p>
            {resultadoImport.errores.length > 0 ? (
              <ul className="mt-1 max-h-40 overflow-y-auto text-danger">
                {resultadoImport.errores.map((err, i) => (
                  <li key={i}>
                    Línea {err.linea}: {err.motivo}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium">Exportar CSV</h2>
        <p className="text-xs text-muted">Descarga todos los gastos cargados.</p>
        <button
          type="button"
          onClick={exportar}
          disabled={exportando}
          className="min-h-[48px] rounded-xl border border-border text-sm font-semibold disabled:opacity-60"
        >
          {exportando ? 'Generando…' : 'Exportar CSV'}
        </button>
      </section>
    </div>
  );
}
