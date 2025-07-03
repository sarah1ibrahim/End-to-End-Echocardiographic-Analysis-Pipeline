// src/app/services/auth.service.ts
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LoginResponse {
  message: string;
  cardiologist: { id: number; email: string };
  Token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/home/cardiologist';
  private tokenKey = 'auth_token';
  private userSubject = new BehaviorSubject<{ id: number; email: string } | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) {
    // Only initialize user if in browser
    if (isPlatformBrowser(this.platformId)) {
      const token = this.getToken();
      if (token) {
        const user = this.decodeToken(token);
        if (user) {
          this.userSubject.next(user);
        }
      }
    }
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          if (isPlatformBrowser(this.platformId)) {
            this.setToken(response.Token);
            this.userSubject.next(response.cardiologist);
          }
        })
      );
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.tokenKey);
      this.userSubject.next(null);
    }
  }

  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }

  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUser(): { id: number; email: string } | null {
    return this.userSubject.value;
  }

  private decodeToken(token: string): { id: number; email: string } | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { id: payload.id, email: payload.email };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }
}