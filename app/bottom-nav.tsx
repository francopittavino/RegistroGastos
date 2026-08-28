'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function IconInicio() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function IconHistorial() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

function IconConfig() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: IconInicio },
  { href: '/historial', label: 'Historial', Icon: IconHistorial },
  { href: '/configuracion', label: 'Config', Icon: IconConfig },
] as const;

function ItemNav({
  href,
  label,
  activo,
  Icon,
}: {
  href: string;
  label: string;
  activo: boolean;
  Icon: () => React.JSX.Element;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={`flex min-h-[88px] flex-col items-center justify-end gap-1 pb-3 text-xs font-medium ${
        activo ? 'text-accent' : 'text-muted'
      }`}
    >
      <Icon />
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
          prefetch={false}
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
          ícono/texto de Historial.
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
