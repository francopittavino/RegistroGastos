'use client';

import { useEffect } from 'react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 text-center">
      <p className="text-4xl" aria-hidden>
        ⚠️
      </p>
      <div>
        <h1 className="text-lg font-semibold">Algo salió mal</h1>
        <p className="mt-1 text-sm text-muted">
          Puede haber sido un problema de conexión o del servidor. Probá de nuevo.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="min-h-[48px] rounded-xl bg-accent px-6 text-sm font-semibold text-accent-foreground"
      >
        Reintentar
      </button>
    </div>
  );
}
