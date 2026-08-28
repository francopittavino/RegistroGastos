'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { crearGasto, actualizarGasto, borrarGasto, crearCategoria } from '@/lib/actions';
import { PAYMENT_METHODS, type Category, type CategoryKind, type Expense, type PaymentMethod } from '@/lib/types';
import { hoyISO, formatMonto } from '@/lib/format';

interface Props {
  categoriasIniciales: Category[];
  /** Si se pasa, el formulario edita este gasto en vez de crear uno nuevo. */
  gastoExistente?: Expense;
}

interface ItemDesglose {
  key: string;
  detalle: string;
  monto: string;
}

function aNumero(valor: string): number {
  return parseFloat(valor.replace(',', '.'));
}

function itemsIniciales(gasto?: Expense): ItemDesglose[] {
  if (!gasto) return [];
  return gasto.items.map((it) => ({
    key: String(it.id),
    detalle: it.detail,
    monto: String(it.amount),
  }));
}

export function FormularioGasto({ categoriasIniciales, gastoExistente }: Props) {
  const router = useRouter();
  const editando = gastoExistente != null;

  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [monto, setMonto] = useState(gastoExistente ? String(gastoExistente.amount) : '');
  const [categoriaId, setCategoriaId] = useState<number | null>(gastoExistente?.categoryId ?? null);
  const [detalle, setDetalle] = useState(gastoExistente?.detail ?? '');
  const [medioPago, setMedioPago] = useState<PaymentMethod | null>(gastoExistente?.paymentMethod ?? null);
  const [fecha, setFecha] = useState(gastoExistente?.date ?? hoyISO());
  const [desgloseActivo, setDesgloseActivo] = useState((gastoExistente?.items.length ?? 0) > 0);
  const [items, setItems] = useState<ItemDesglose[]>(itemsIniciales(gastoExistente));
  const [creandoCategoria, setCreandoCategoria] = useState(false);
  const [nombreNuevaCategoria, setNombreNuevaCategoria] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState(false);
  const [pending, startTransition] = useTransition();
  const montoInputRef = useRef<HTMLInputElement>(null);

  const totalItems = items.reduce((acc, it) => acc + (aNumero(it.monto) || 0), 0);

  function limpiarFormulario() {
    setMonto('');
    setCategoriaId(null);
    setDetalle('');
    setMedioPago(null);
    setDesgloseActivo(false);
    setItems([]);
    requestAnimationFrame(() => montoInputRef.current?.focus());
  }

  function agregarItem() {
    setItems((prev) => [...prev, { key: crypto.randomUUID(), detalle: '', monto: '' }]);
  }

  function actualizarItem(key: string, campo: 'detalle' | 'monto', valor: string) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, [campo]: valor } : it)));
  }

  function borrarItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function guardar() {
    setError(null);

    if (categoriaId == null) {
      setError('Elegí una categoría');
      return;
    }

    let montoFinal: number;
    let itemsFinal: { detail: string; amount: number }[] = [];

    if (desgloseActivo) {
      itemsFinal = items
        .filter((it) => it.detalle.trim() || it.monto.trim())
        .map((it) => ({ detail: it.detalle.trim(), amount: aNumero(it.monto) || 0 }));

      if (itemsFinal.length === 0) {
        setError('Agregá al menos un ítem, o desactivá el desglose');
        return;
      }
      montoFinal = itemsFinal.reduce((acc, it) => acc + it.amount, 0);
    } else {
      montoFinal = aNumero(monto);
      if (!monto.trim() || Number.isNaN(montoFinal) || montoFinal <= 0) {
        setError('Ingresá un monto válido');
        return;
      }
    }

    const catId = categoriaId;
    const input = {
      date: fecha,
      categoryId: catId,
      detail: detalle.trim(),
      amount: montoFinal,
      paymentMethod: medioPago,
      items: itemsFinal,
    };

    startTransition(async () => {
      try {
        if (editando) {
          await actualizarGasto(gastoExistente.id, input);
          router.push('/historial');
        } else {
          await crearGasto(input);
          limpiarFormulario();
          setConfirmacion(true);
          setTimeout(() => setConfirmacion(false), 2000);
        }
      } catch {
        setError('No se pudo guardar el gasto. Probá de nuevo.');
      }
    });
  }

  function eliminar() {
    if (!gastoExistente) return;
    startTransition(async () => {
      try {
        await borrarGasto(gastoExistente.id);
        router.push('/historial');
      } catch {
        setError('No se pudo borrar el gasto.');
      }
    });
  }

  function guardarNuevaCategoria(kind: CategoryKind) {
    const nombre = nombreNuevaCategoria.trim();
    if (!nombre) return;

    startTransition(async () => {
      try {
        const nueva = await crearCategoria(nombre, kind);
        setCategorias((prev) => {
          const yaExiste = prev.some((c) => c.id === nueva.id);
          const actualizadas = yaExiste
            ? prev.map((c) => (c.id === nueva.id ? nueva : c))
            : [...prev, nueva];
          return actualizadas.sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name));
        });
        setCategoriaId(nueva.id);
        setNombreNuevaCategoria('');
        setCreandoCategoria(false);
      } catch {
        setError('No se pudo crear la categoría');
      }
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-8">
      <h1 className="text-lg font-semibold">{editando ? 'Editar gasto' : 'Cargar gasto'}</h1>

      {!desgloseActivo ? (
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="monto">
            Monto
          </label>
          <input
            ref={montoInputRef}
            id="monto"
            type="text"
            inputMode="decimal"
            autoFocus={!editando}
            placeholder="$0"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-4 text-4xl font-bold tabular-nums outline-none focus:border-accent"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-muted">Ítems</span>
            <span className="text-lg font-bold tabular-nums">{formatMonto(totalItems)}</span>
          </div>
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <div key={it.key} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Detalle"
                  value={it.detalle}
                  onChange={(e) => actualizarItem(it.key, 'detalle', e.target.value)}
                  className="min-h-[44px] flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="$0"
                  value={it.monto}
                  onChange={(e) => actualizarItem(it.key, 'monto', e.target.value)}
                  className="min-h-[44px] w-24 rounded-xl border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => borrarItem(it.key)}
                  aria-label="Borrar ítem"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={agregarItem}
            className="mt-3 min-h-[44px] w-full rounded-xl border border-dashed border-border text-sm text-muted"
          >
            + Agregar ítem
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setDesgloseActivo((v) => !v)}
        className="min-h-[44px] self-start text-sm text-accent underline underline-offset-2"
      >
        {desgloseActivo ? 'Usar un monto único' : '+ Agregar ítems'}
      </button>

      <div>
        <span className="mb-2 block text-sm text-muted">Categoría</span>
        <div className="grid grid-cols-2 gap-2">
          {categorias.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoriaId(c.id)}
              className={`min-h-[52px] rounded-xl border px-3 py-2 text-sm font-medium ${
                categoriaId === c.id
                  ? 'border-accent bg-accent text-accent-foreground'
                  : c.kind === 'comida'
                    ? 'border-accent/30 bg-surface text-foreground'
                    : 'border-border bg-surface text-foreground'
              }`}
            >
              {c.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setCreandoCategoria(true)}
            className="min-h-[52px] rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted"
          >
            + Nueva categoría
          </button>
        </div>
      </div>

      {creandoCategoria ? (
        <div className="rounded-2xl border border-border bg-surface p-4">
          <input
            type="text"
            autoFocus
            placeholder="Nombre de la categoría"
            value={nombreNuevaCategoria}
            onChange={(e) => setNombreNuevaCategoria(e.target.value)}
            className="mb-3 min-h-[44px] w-full rounded-xl border border-border bg-background px-3 outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => guardarNuevaCategoria('comida')}
              className="min-h-[44px] flex-1 rounded-xl bg-accent text-sm font-semibold text-accent-foreground"
            >
              Es comida
            </button>
            <button
              type="button"
              onClick={() => guardarNuevaCategoria('otros')}
              className="min-h-[44px] flex-1 rounded-xl border border-border text-sm font-semibold"
            >
              No es comida
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreandoCategoria(false);
              setNombreNuevaCategoria('');
            }}
            className="mt-2 min-h-[44px] w-full text-sm text-muted"
          >
            Cancelar
          </button>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="detalle">
          Detalle (opcional)
        </label>
        <input
          id="detalle"
          type="text"
          value={detalle}
          onChange={(e) => setDetalle(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
        />
      </div>

      <div>
        <span className="mb-2 block text-sm text-muted">Medio de pago (opcional)</span>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMedioPago((prev) => (prev === m.value ? null : m.value))}
              className={`min-h-[44px] rounded-xl border px-4 text-sm font-medium ${
                medioPago === m.value ? 'border-accent bg-accent text-accent-foreground' : 'border-border bg-surface'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="fecha">
          Fecha
        </label>
        <input
          id="fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 outline-none focus:border-accent"
        />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {confirmacion ? <p className="text-sm text-accent">Gasto guardado ✓</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={guardar}
          disabled={pending}
          className="min-h-[56px] flex-1 rounded-2xl bg-accent text-lg font-semibold text-accent-foreground disabled:opacity-60"
        >
          {pending ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={() => router.push(editando ? '/historial' : '/')}
          className="min-h-[56px] rounded-2xl border border-border px-5 text-sm font-medium text-muted"
        >
          {editando ? 'Cancelar' : 'Listo'}
        </button>
      </div>

      {editando ? (
        <button
          type="button"
          onClick={eliminar}
          disabled={pending}
          className="min-h-[44px] w-full text-sm font-medium text-danger disabled:opacity-60"
        >
          Borrar gasto
        </button>
      ) : null}
    </div>
  );
}
