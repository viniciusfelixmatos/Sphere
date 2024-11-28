import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileService } from './profile.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(this.getToken());

  constructor(
    private http: HttpClient,
    private profileService: ProfileService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // Método para registrar um novo usuário
  register(username: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, { username, email, password }).pipe(
      catchError((error) => {
        return throwError(() => new Error(error));
      })
    );
  }

  // Método para fazer login
  login(email: string, password: string): Observable<any> {
    return this.http.post<{ token: string; userId: string }>(`${this.baseUrl}/login`, { email, password }).pipe(
      map((response) => {
        if (response && response.token) {
          this.setToken(response.token);
          this.setUserId(response.userId);
        }
        return response;
      }),
      catchError((error) => {
        let errorMessage = 'Erro ao tentar fazer login.';
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  // Método para renovar o token
  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado.'));
    }

    return this.http.post<{ token: string }>(`${this.baseUrl}/refresh-token`, { token }).pipe(
      map((response) => {
        if (response && response.token) {
          this.setToken(response.token);
        }
        return response;
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => new Error('Erro ao renovar o token.'));
      })
    );
  }

  // Método para definir o token no localStorage
  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      this.tokenSubject.next(token);
    }
  }

  // Método para armazenar o ID do usuário no localStorage
  private setUserId(userId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userId', userId);
    }
  }

  // Método para fazer logout
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      this.tokenSubject.next(null);
    }
  }

  // Método para obter o token
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token não encontrado no localStorage');
      }
      return token;
    }
    return null;
  }

  // Método para obter o ID do usuário logado
  getCurrentUserId(): Observable<string | null> {
    if (isPlatformBrowser(this.platformId)) {
      const userId = localStorage.getItem('userId');
      return userId ? of(userId) : throwError(() => new Error('Usuário não encontrado.'));
    }
    return of(null); // Retorna null se estiver no servidor
  }

  // Método para carregar o perfil do usuário
  loadUserProfile(): Observable<any> {
    const headers = this.getHeaders();
    return this.http.get<any>(`${this.baseUrl}/profile`, { headers }).pipe(
      catchError((error) => {
        console.error('Erro ao carregar perfil:', error);
        return throwError(() => new Error('Erro ao carregar perfil.'));
      })
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      this.logout();
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }
}
