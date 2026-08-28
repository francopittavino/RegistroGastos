'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const IZQUIERDA = [
  { href: '/', label: 'Inicio' },
  { href: '/historial', label: 'Historial' },
] as const;

const DERECHA = [{ href: '/configuracion', label: 'Config' }] as const;

function ItemNav({ href, label, activo }: { href: string; label: string; activo: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-[64px] flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium ${
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
        <div
          className="flex border-t border-border bg-surface"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex flex-1">
            {IZQUIERDA.map((item) => (
              <ItemNav key={item.href} {...item} activo={pathname === item.href} />
            ))}
          </div>
          <div className="w-14 shrink-0" aria-hidden />
          <div className="flex flex-1">
            {DERECHA.map((item) => (
              <ItemNav key={item.href} {...item} activo={pathname === item.href} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
