import './globals.css';

export const metadata = {
  title: 'TradeScope PREVIEW v36 - Journal de Trading Pro',
  description: 'Version preview avec stratégies, analytics visuels, et système de confiance - Journal de trading intelligent pour traders sérieux.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TradeScope PREVIEW',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#08090E" />
      </head>
      <body className="bg-bg-primary text-txt-1 font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
          var lastTouchEnd = 0;
          document.documentElement.addEventListener('gesturestart', function(e) { e.preventDefault(); e.stopPropagation(); return false; }, { passive: false, capture: true });
          document.documentElement.addEventListener('gesturechange', function(e) { e.preventDefault(); e.stopPropagation(); return false; }, { passive: false, capture: true });
          document.documentElement.addEventListener('gestureend', function(e) { e.preventDefault(); e.stopPropagation(); return false; }, { passive: false, capture: true });
          document.documentElement.addEventListener('touchstart', function(e) { if (e.touches.length > 1) { e.preventDefault(); } }, { passive: false, capture: true });
          document.documentElement.addEventListener('touchmove', function(e) { if (e.touches.length > 1) { e.preventDefault(); } }, { passive: false, capture: true });
          document.documentElement.addEventListener('touchend', function(e) { var now = Date.now(); if (now - lastTouchEnd <= 300) { e.preventDefault(); } lastTouchEnd = now; }, { passive: false, capture: true });
        `}} />
        {children}
      </body>
    </html>
  );
}
