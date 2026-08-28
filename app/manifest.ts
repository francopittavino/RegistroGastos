import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Registro de Gastos',
    short_name: 'Gastos',
    description: 'Control de gastos mensuales, con foco en comida',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f14',
    theme_color: '#0b0f14',
    icons: [
      { src: '/pwa-icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-icon-512', sizes: '512x512', type: 'image/png' },
    ],
  };
}
