import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    tenant_id: number;
    tenant_name: string;
  };
}

interface RegisterResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<any>(null);
  private apiUrl = 'https://humarksa.com/api';

  constructor(private http: HttpClient, private router: Router) {
    const token = localStorage.getItem('token');
    if (token) {
      this.currentUser.set(this.decodeToken(token));
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth.php?action=login`, {
      email,
      password
    }).pipe(
      tap((response: LoginResponse) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
          this.currentUser.set(response.user);
        }
      })
    );
  }

  register(name: string, email: string, password: string, tenant_id: number): Observable<RegisterResponse> {
      return this.http.post<RegisterResponse>(`${this.apiUrl}/auth.php?action=register`, {
      name,
      email,
      password,
      tenant_id    });
  }

  logout() {
    localStorage.clear();
    this.currentUser.set(null);
    this.router.navigate(['auth/login']);
  }

  isAuthenticated(): boolean {
    return !!this.currentUser();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'admin';
  }

   decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(window.atob(base64));
    } catch (e) {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  registerAdmin(name: string, email: string, password: string, tenant_id: number): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth.php?action=register-admin`, {
      name,
      email,
      password,
      tenant_id
    });
  }


  getTenant(tenant_id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth.php?action=get-tenant&tenant_id=${tenant_id}`);
  }

  createTenant(tenant: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth.php?action=createTenant`, tenant);
  }
}
