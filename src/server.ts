import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import cookieParser from 'cookie-parser';
import { REQUEST } from './app/tokens';
import { environment } from './environments/environment';
import type * as SentryNode from '@sentry/node';

let Sentry: typeof SentryNode | undefined;

if (environment.SENTRY_DSN) {
  Sentry = await import('@sentry/node');
  Sentry.init({
    dsn: environment.SENTRY_DSN,
    environment: environment.SENTRY_ENVIRONMENT,
    release: environment.SENTRY_RELEASE || undefined,
    tracesSampleRate: 0.2,
    sendDefaultPii: false,
    beforeSend(event) {
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          url.search = '';
          url.hash = '';
          event.request.url = url.toString();
        } catch {
          event.request.url = event.request.url.split(/[?#]/u, 1)[0];
        }
      }
      return event;
    },
  });
}

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();

const commonEngine = new CommonEngine({
  allowedHosts: [
    'www.zeffyrmusic.com',
    'zeffyrmusic.com',
    'data.zeffyrmusic.com',
    '146.59.155.20', // Server public IP (NAT — not visible via networkInterfaces())
    '127.0.0.1',
    'localhost',
  ],
});

app.disable('x-powered-by');
app.set('etag', false);
app.use(cookieParser());

// Hashed static assets (JS, CSS, hashed fonts) — long-lived immutable cache.
// Angular appends a content hash to filenames, so no cache invalidation needed.
app.get(
  '/{*path}',
  express.static(browserDistFolder, {
    maxAge: '1y',
    immutable: true,
    index: false,
    redirect: false,
    lastModified: false,
    setHeaders: (res, filePath) => {
      // HTML files must never be cached
      if (filePath.endsWith('.html')) {
        res.set('Cache-Control', 'no-store');
        return;
      }
      // Un-hashed assets (images, fonts, i18n JSON) — revalidate daily.
      // These filenames never change, so long-lived immutable cache is unsafe.
      if (filePath.includes('/assets/')) {
        res.set('Cache-Control', 'public, max-age=86400');
      }
    },
  })
);

// All other responses (SSR, index.html fallback) — never cache
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// API fallback — returns empty JSON when no backend is proxied.
// Active only when URL_SERVER is a relative path (e.g. /api/ in e2e builds).
// In production/staging, URL_SERVER is an absolute URL so this route is never registered.
if (environment.URL_SERVER.startsWith('/')) {
  app.use('/api', (_req, res) => {
    res.json({});
  });
}

app.get('/{*path}', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;
  const baseUrlValue = baseUrl || '/';

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrlValue },
        { provide: REQUEST, useValue: req },
      ],
    })
    .then(html => res.send(html))
    .catch(err => next(err));
});

// Sentry Express error handler — must be after all routes but before app.listen
if (Sentry) {
  Sentry.setupExpressErrorHandler(app);
}

if (isMainModule(import.meta.url) || process.env['PM2_USAGE']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
