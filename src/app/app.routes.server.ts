import { RenderMode, ServerRoute } from '@angular/ssr';

// Only routes that don't depend on the auth token (which lives in
// localStorage and is invisible during prerendering/SSR) can be safely
// prerendered. Every other route — anything behind AuthGuard — must render
// client-side, otherwise the guard runs with no token, redirects to /login,
// and that redirected markup gets baked in as the page's SSR/prerendered
// output (seen as a flash of the login page on refresh before the client
// router corrects it).
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'contact', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'updatepassword', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client }
];
