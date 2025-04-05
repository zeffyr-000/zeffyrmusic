import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { REQUEST } from '@angular/core';
import { isPlatformServer } from '@angular/common';

export const httpConfigInterceptor: HttpInterceptorFn = (req, next) => {
    const platformId = inject(PLATFORM_ID);
    const request = isPlatformServer(platformId) ? inject(REQUEST) : null;

    const modifiedRequest = req.clone({
        withCredentials: true,
        setHeaders: {
            ...(request?.headers?.get('cookie') ? { 'Cookie': request.headers.get('cookie') } : {})
        }
    });

    return next(modifiedRequest);
};