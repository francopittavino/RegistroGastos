'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/nuevo', label: 'Cargar' },
  { href: '/historial', label: 'Historial' },
  { href: '/configuracion', label: 'Config' },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((item) => {
          const activo = pathname === item.href;
          const esCargar = item.href === '/nuevo';
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 text-xs font-medium ${
                  activo
                    ? esCargar
                      ? 'text-accent-foreground'
                      : 'text-accent'
                    : 'text-muted'
                }`}
              >
                {esCargar ? (
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold ${
                      activo ? 'bg-accent text-accent-foreground' : 'bg-accent/90 text-accent-foreground'
                    }`}
                  >
                    +
                  </span>
                ) : null}
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
