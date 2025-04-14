import { InjectionToken } from '@angular/core';

export interface ServerRequest {
    url: string;
    method: string;
    baseUrl: string;
    originalUrl: string;
    path: string;

    headers: {
        cookie?: string;
        [key: string]: string | string[] | undefined;
    };
    cookies?: Record<string, string>;

    query: Record<string, string | string[]>;
    params: Record<string, string>;
    body?: unknown;

    protocol: string;
    secure: boolean;
    ip: string;

    [key: string]: unknown;
}

export const REQUEST = new InjectionToken<ServerRequest>('REQUEST');