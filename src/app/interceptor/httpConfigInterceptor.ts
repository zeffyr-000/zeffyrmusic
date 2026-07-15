import { HttpInterceptorFn } from '@angular/common/http';
import { inject, REQUEST } from '@angular/core';

export const httpConfigInterceptor: HttpInterceptorFn = (req, next) => {
  const request = inject(REQUEST, { optional: true });

  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  };

  const cookie = request?.headers.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  const modifiedRequest = req.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  return next(modifiedRequest);
};
