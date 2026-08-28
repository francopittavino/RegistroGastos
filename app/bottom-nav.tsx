'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/historial', label: 'Historial' },
  { href: '/configuracion', label: 'Config' },
] as const;

function ItemNav({ href, label, activo }: { href: string; label: string; activo: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-[76px] flex-col items-center justify-end gap-0.5 pb-3 text-xs font-medium ${
        activo ? 'text-accent' : 'text-muted'
      }`}
    >
      <span>{label}</span>
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20">
      <div className="relative mx-auto max-w-md">
        <Link
          href="/nuevo"
          aria-label="Cargar gasto"
          className="absolute left-1/2 top-0 z-30 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-2xl font-bold text-accent-foreground shadow-lg active:opacity-80"
        >
          +
        </Link>
        {/*
          3 columnas iguales, sin espacio muerto: el centro de la columna del
          medio (Historial) cae exactamente al 50% del ancho, mismo punto
          donde flota el botón "+". La barra es más alta que el resto para
          que el botón (que sobresale hacia arriba) no se superponga con el
          texto "Historial".
        */}
        <div
          className="grid grid-cols-3 border-t border-border bg-surface"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {ITEMS.map((item) => (
            <ItemNav key={item.href} {...item} activo={pathname === item.href} />
          ))}
        </div>
      </div>
    </nav>
  );
}
