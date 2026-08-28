'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { borrarGasto } from '@/lib/actions';
import { formatFecha, formatMonto } from '@/lib/format';
import type { Expense } from '@/lib/types';

function IconTacho() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 7h16" />
      <path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" />
      <path d="M18 7v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function FilaGasto({ gasto }: { gasto: Expense }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmar() {
    startTransition(async () => {
      await borrarGasto(gasto.id);
      router.refresh();
    });
  }

  if (confirmando) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-xl border border-danger/50 bg-surface px-4 py-3">
        <span className="text-sm">¿Borrar este gasto?</span>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={confirmar}
            disabled={pending}
            className="min-h-[36px] rounded-lg bg-danger px-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pending ? 'Borrando…' : 'Sí'}
          </button>
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            className="min-h-[36px] rounded-lg border border-border px-3 text-sm font-semibold"
          >
            No
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2">
      <Link
        href={`/historial/${gasto.id}/editar`}
        className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {gasto.categoryName}
            {gasto.detail ? <span className="text-muted"> · {gasto.detail}</span> : null}
          </p>
          <p className="text-xs text-muted">{formatFecha(gasto.date)}</p>
        </div>
        <p className="shrink-0 text-base font-semibold tabular-nums">{formatMonto(gasto.amount)}</p>
      </Link>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        aria-label="Borrar gasto"
        className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted"
      >
        <IconTacho />
      </button>
    </li>
  );
}
