'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Category } from '@/lib/types';

interface Props {
  categorias: Category[];
  categoriaIdActual: number | null;
  /** Query params a preservar al cambiar de categoría (ej: el período elegido). */
  paramsBase: Record<string, string>;
}

function hrefConCategoria(base: Record<string, string>, categoriaId: number | null): string {
  const params = new URLSearchParams(base);
  if (categoriaId != null) params.set('categoria', String(categoriaId));
  else params.delete('categoria');
  const qs = params.toString();
  return qs ? `/historial?${qs}` : '/historial';
}

export function FiltroCategoria({ categorias, categoriaIdActual, paramsBase }: Props) {
  const [abierto, setAbierto] = useState(false);
  const categoriaActual = categorias.find((c) => c.id === categoriaIdActual);

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium"
        >
          <span aria-hidden>☰</span> Filtrar
        </button>
        {categoriaActual ? (
          <span className="flex min-h-[36px] items-center gap-2 rounded-full border border-accent bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            {categoriaActual.name}
            <Link href={hrefConCategoria(paramsBase, null)} aria-label="Quitar filtro" className="font-bold">
              ✕
            </Link>
          </span>
        ) : (
          <span className="text-sm text-muted">Todas las categorías</span>
        )}
      </div>

      {abierto ? (
        <div className="fixed inset-0 z-30">
          <button
            type="button"
            aria-label="Cerrar filtro"
            onClick={() => setAbierto(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-surface p-4 shadow-xl">
            <h2 className="mb-3 px-2 text-sm font-semibold text-muted">Filtrar por categoría</h2>
            <div className="flex flex-col gap-1 overflow-y-auto">
              <Link
                href={hrefConCategoria(paramsBase, null)}
                onClick={() => setAbierto(false)}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium ${
                  categoriaIdActual == null ? 'bg-accent text-accent-foreground' : 'text-foreground'
                }`}
              >
                Todas
              </Link>
              {categorias.map((c) => (
                <Link
                  key={c.id}
                  href={hrefConCategoria(paramsBase, c.id)}
                  onClick={() => setAbierto(false)}
                  className={`min-h-[44px] rounded-xl px-3 py-2 text-sm font-medium ${
                    categoriaIdActual === c.id ? 'bg-accent text-accent-foreground' : 'text-foreground'
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
