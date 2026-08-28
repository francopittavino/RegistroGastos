import Link from 'next/link';
import { formatFechaHora } from '@/lib/format';
import type { RangoPeriodo } from '@/lib/types';

interface Props {
  rango: RangoPeriodo;
  hrefPeriodo: (idx: number) => string;
}

export function NavPeriodo({ rango, hrefPeriodo }: Props) {
  const finLabel = rango.fin ? formatFechaHora(rango.fin) : 'ahora';

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface px-2 py-2">
      {rango.hayAnterior ? (
        <Link
          href={hrefPeriodo(rango.index - 1)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg"
          aria-label="Período anterior"
        >
          ‹
        </Link>
      ) : (
        <span className="min-w-[44px]" />
      )}
      <div className="text-center text-sm">
        <p className="font-medium">
          {formatFechaHora(rango.inicio)} – {finLabel}
        </p>
        {rango.esActual ? <p className="text-xs text-muted">Período actual</p> : null}
      </div>
      {rango.haySiguiente ? (
        <Link
          href={hrefPeriodo(rango.index + 1)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg"
          aria-label="Período siguiente"
        >
          ›
        </Link>
      ) : (
        <span className="min-w-[44px]" />
      )}
    </div>
  );
}
