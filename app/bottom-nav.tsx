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
      className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 text-xs font-medium ${
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
          Grilla de 4 columnas iguales con solo 3 ítems: quedan colocados en
          las columnas 1, 2 y 3, y la 4ta queda vacía. El botón "+" flota
          exactamente en el borde entre la columna 2 y la 3 (el 50% real del
          ancho), así que Historial y Config quedan a la misma distancia del
          botón, en vez de que Historial (compartiendo la mitad izquierda con
          Inicio) quede más pegado que Config (solo en la mitad derecha).
        */}
        <div
          className="grid grid-cols-4 border-t border-border bg-surface"
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
