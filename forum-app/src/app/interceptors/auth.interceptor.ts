import {
  HttpRequest,
  HttpEvent,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export function AuthInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    // Create a headers object based on the original request
    const headers: {[key: string]: string} = {
      Authorization: `Bearer ${token}`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With'
    };

    // Don't manually set Content-Type for FormData/multipart requests
    // as Angular/browser will set it automatically with the correct boundary
    if (!req.headers.has('Content-Type') &&
        !(req.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    req = req.clone({
      setHeaders: headers
    });
  }
  return next(req);
}
