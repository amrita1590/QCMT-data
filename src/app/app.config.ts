import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './interceptor/token.interceptor';
import { provideServerRendering } from '@angular/platform-server';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServerRendering(),
    provideClientHydration(withEventReplay()),
    // Single provideHttpClient with all features combined
    provideHttpClient(
      withFetch(),                        // Recommended for SSR → fixes NG02801
      withInterceptors([tokenInterceptor]) // Your auth/token interceptor
    ),
    
  ]
};

