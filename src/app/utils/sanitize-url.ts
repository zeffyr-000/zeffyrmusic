/** Return the pathname of a URL, stripping scheme, host, query string and fragment to avoid leaking sensitive data. */
export function sanitizeUrl(raw: string): string {
  try {
    const url = new URL(raw, 'https://placeholder');
    return url.pathname;
  } catch {
    const stripped = raw.split(/[?#]/u, 1)[0];
    // Strip scheme + host from absolute URLs to return only the path
    const schemeEnd = stripped.indexOf('://');
    if (schemeEnd >= 0) {
      const pathStart = stripped.indexOf('/', schemeEnd + 3);
      return pathStart >= 0 ? stripped.slice(pathStart) : '/';
    }
    return stripped || '/';
  }
}
