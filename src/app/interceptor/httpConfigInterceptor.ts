import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { REQUEST } from '../tokens';

export const httpConfigInterceptor: HttpInterceptorFn = (req, next) => {
  const request = inject(REQUEST, { optional: true });

  const headers: Record<string, string> = {
    'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
    Pragma: 'no-cache',
    Expires: '0',
  };

  if (request?.headers?.cookie) {
    headers['Cookie'] = request.headers.cookie;
  }

  const modifiedRequest = req.clone({
    withCredentials: true,
    setHeaders: headers,
  });

  return next(modifiedRequest);
};
