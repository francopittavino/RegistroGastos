'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { borrarPeriodo } from '@/lib/actions';

export function BorrarPeriodo({ periodoId }: { periodoId: number }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmar() {
    startTransition(async () => {
      try {
        await borrarPeriodo(periodoId);
        router.push('/historial');
      } catch {
        setError('No se pudo borrar el período');
        setConfirmando(false);
      }
    });
  }

  if (confirmando) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 text-sm">
        <p>
          ¿Borrar este período? Los gastos no se borran, pasan a formar parte del período anterior.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={confirmar}
            disabled={pending}
            className="min-h-[40px] flex-1 rounded-lg bg-danger text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Borrando…' : 'Sí, borrar'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-[40px] flex-1 rounded-lg border border-border text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-[36px] px-2 text-xs font-medium text-danger"
      >
        Borrar este período
      </button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
