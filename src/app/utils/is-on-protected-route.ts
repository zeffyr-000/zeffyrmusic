import { Router } from '@angular/router';

/** Returns true if the current URL matches a route guarded by canActivate. */
export function isOnProtectedRoute(router: Router): boolean {
  const primaryGroup = router.parseUrl(router.url).root.children['primary'];
  const currentPath = primaryGroup?.segments[0]?.path ?? '';
  const protectedPaths = router.config
    ?.filter(route => route.canActivate !== undefined && !!route.path)
    .map(route => route.path!.split('/')[0]);

  return currentPath !== '' && (protectedPaths?.includes(currentPath) ?? false);
}
