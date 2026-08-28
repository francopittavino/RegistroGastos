import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { BottomNav } from './bottom-nav';
import { RegistrarServiceWorker } from './registrar-sw';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Registro de Gastos',
  description: 'Control de gastos mensuales, con foco en comida',
};

export const viewport: Viewport = {
  themeColor: '#0b0f14',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        <main className="mx-auto w-full max-w-md flex-1 pb-24">{children}</main>
        <BottomNav />
        <RegistrarServiceWorker />
      </body>
    </html>
  );
}
