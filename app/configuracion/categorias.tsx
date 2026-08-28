'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { actualizarCategoria, borrarCategoria } from '@/lib/actions';
import { IconTacho, IconLapiz } from '@/app/components/icons';
import type { CategoryKind } from '@/lib/types';
import type { CategoryConUso } from '@/lib/queries';

export function Categorias({ categoriasIniciales }: { categoriasIniciales: CategoryConUso[] }) {
  const router = useRouter();
  const [categorias, setCategorias] = useState(categoriasIniciales);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombre, setNombre] = useState('');
  const [kind, setKind] = useState<CategoryKind>('otros');
  const [confirmandoBorrarId, setConfirmandoBorrarId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function empezarEdicion(cat: CategoryConUso) {
    setError(null);
    setEditandoId(cat.id);
    setNombre(cat.name);
    setKind(cat.kind);
  }

  function guardar(id: number) {
    setError(null);
    startTransition(async () => {
      try {
        await actualizarCategoria(id, nombre, kind);
        setCategorias((prev) =>
          prev
            .map((c) => (c.id === id ? { ...c, name: nombre.trim(), kind } : c))
            .sort((a, b) => a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name))
        );
        setEditandoId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar');
      }
    });
  }

  function borrar(id: number) {
    setError(null);
    startTransition(async () => {
      try {
        await borrarCategoria(id);
        setCategorias((prev) => prev.filter((c) => c.id !== id));
        setConfirmandoBorrarId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo borrar');
        setConfirmandoBorrarId(null);
      }
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-medium">Categorías</h2>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <ul className="flex flex-col gap-2">
        {categorias.map((cat) => (
          <li key={cat.id} className="rounded-xl border border-border/60 p-2">
            {editandoId === cat.id ? (
              <div className="flex flex-col gap-2">
                <input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoFocus
                  className="min-h-[44px] rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setKind('comida')}
                    className={`min-h-[40px] flex-1 rounded-lg border text-sm font-medium ${
                      kind === 'comida' ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                    }`}
                  >
                    Comida
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind('otros')}
                    className={`min-h-[40px] flex-1 rounded-lg border text-sm font-medium ${
                      kind === 'otros' ? 'border-accent bg-accent text-accent-foreground' : 'border-border'
                    }`}
                  >
                    Otros
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => guardar(cat.id)}
                    disabled={pending}
                    className="min-h-[40px] flex-1 rounded-lg bg-accent text-sm font-semibold text-accent-foreground disabled:opacity-60"
                  >
                    {pending ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="min-h-[40px] flex-1 rounded-lg border border-border text-sm font-semibold"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : confirmandoBorrarId === cat.id ? (
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm">¿Borrar &quot;{cat.name}&quot;?</span>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => borrar(cat.id)}
                    disabled={pending}
                    className="min-h-[36px] rounded-lg bg-danger px-3 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? 'Borrando…' : 'Sí'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmandoBorrarId(null)}
                    className="min-h-[36px] rounded-lg border border-border px-3 text-sm font-semibold"
                  >
                    No
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{cat.name}</p>
                  <p className="text-xs text-muted">
                    {cat.kind === 'comida' ? 'Comida' : 'Otros'}
                    {cat.cantidadGastos > 0 ? ` · ${cat.cantidadGastos} gasto${cat.cantidadGastos === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => empezarEdicion(cat)}
                    aria-label={`Editar ${cat.name}`}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted"
                  >
                    <IconLapiz />
                  </button>
                  <button
                    type="button"
                    onClick={() => cat.cantidadGastos === 0 && setConfirmandoBorrarId(cat.id)}
                    disabled={cat.cantidadGastos > 0}
                    aria-label={`Borrar ${cat.name}`}
                    title={cat.cantidadGastos > 0 ? 'No se puede borrar: tiene gastos cargados' : undefined}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-muted disabled:opacity-30"
                  >
                    <IconTacho />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
