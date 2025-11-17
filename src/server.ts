import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine, isMainModule } from '@angular/ssr/node';
import express from 'express';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import bootstrap from './main.server';
import cookieParser from 'cookie-parser';
import { REQUEST } from './app/tokens';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
const indexHtml = join(serverDistFolder, 'index.server.html');

const app = express();
const commonEngine = new CommonEngine();

app.disable('x-powered-by');
app.set('etag', false);
app.use(cookieParser());

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get(
  '**',
  express.static(browserDistFolder, {
    maxAge: 0,
    index: 'index.html',
    redirect: false,
    lastModified: false
  }),
);

app.get('**', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;
  const baseUrlValue = baseUrl || '/';

  commonEngine
    .render({
      bootstrap,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [{ provide: APP_BASE_HREF, useValue: baseUrlValue }, { provide: REQUEST, useValue: req }],
    })
    .then((html) => res.send(html))
    .catch((err) => next(err));
});

if (isMainModule(import.meta.url) || process.env['PM2_USAGE']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export default app;
