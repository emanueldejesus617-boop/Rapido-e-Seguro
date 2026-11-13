import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CSA — Rápido e Seguro',
  description: 'Sistema Profissional de Controlo Diário de Vendas, Lucros, Saídas e Vendas a Grosso — CSA Rápido e Seguro',
  manifest: '/manifest.json',
  applicationName: 'CSA Rápido e Seguro',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CSA Rápido e Seguro',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/images/logo.png', sizes: '512x512', type: 'image/png' },
      { url: '/favicon.png', sizes: '64x64', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/images/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070d1e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CSA Rápido e Seguro" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
      </head>
      <body className="min-h-screen bg-[#070d1e] text-slate-100 antialiased font-sans overflow-x-hidden">
        {children}
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('PWA ServiceWorker registrado com sucesso:', registration.scope);
                    },
                    function(err) {
                      console.log('Falha ao registar PWA ServiceWorker:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
