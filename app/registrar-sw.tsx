'use client';

import { useEffect } from 'react';

export function RegistrarServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Si falla el registro, la app sigue funcionando normal, solo sin cache offline del shell.
      });
    }
  }, []);

  return null;
}
