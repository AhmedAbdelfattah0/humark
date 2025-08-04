import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { AuthInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
     provideRouter(routes),
     provideHttpClient(withFetch(), withInterceptors([AuthInterceptor])),

    provideAnimations(),
    provideToastr({
      timeOut: 8000,
      positionClass: 'toast-top-right',
      preventDuplicates: false,
      progressBar: true,
      closeButton: true,
      progressAnimation: 'decreasing',
      easing: 'ease-in-out',
      easeTime: 300,

      newestOnTop: true,
      iconClasses: {
        error: 'toast-error',
        info: 'toast-info',
        success: 'toast-success',
        warning: 'toast-warning'
      }
    })  ]
};
