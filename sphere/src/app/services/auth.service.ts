import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, of } from 'rxjs'; // Importando 'of' aqui
import { map, catchError } from 'rxjs/operators';
import { ProfileService } from './profile.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
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
      catchError(error => {
        return throwError(error);
      })
    );
  }

  // Método para fazer login
  login(email: string, password: string): Observable<any> {
    return this.http.post<{ token: string, userId: string }>(`${this.baseUrl}/login`, { email, password }).pipe(
      map(response => {
        if (response && response.token) {
          this.setToken(response.token); // Usar o novo método setToken
          this.setUserId(response.userId); // Armazenar o ID do usuário
        }
        return response;
      }),
      catchError(error => {
        if (error.error && error.error.message) {
          return throwError(error.error.message); // Retorna a mensagem de erro do backend
        }
        return throwError('Erro ao tentar fazer login.'); // Mensagem genérica para outros erros
      })
    );
  }

  // Método para renovar o token
  refreshToken(): Observable<any> {
    const token = this.getToken();
    return this.http.post<{ token: string }>(`${this.baseUrl}/refresh-token`, { token }).pipe(
      map(response => {
        if (response && response.token) {
          this.setToken(response.token); // Usar o novo método setToken
        }
        return response;
      }),
      catchError(error => {
        this.logout(); // Em caso de erro, desconecte o usuário
        return throwError('Erro ao renovar o token.');
      })
    );
  }

  // Método para definir o token no localStorage
  setToken(token: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('token', token);
      this.tokenSubject.next(token); // Atualiza o BehaviorSubject com o novo token
    }
  }

  // Método para armazenar o ID do usuário no localStorage
  private setUserId(userId: string): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('userId', userId); // Armazenar o userId no localStorage
    }
  }

  // Método para fazer logout e remover o token e userId do localStorage
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId'); // Remover o userId também
      this.tokenSubject.next(null); // Atualiza o BehaviorSubject para nulo
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Método para obter o token
  getToken(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('token');
    }
    return null; // Retorna null se não estiver no navegador
  }

  // Método para obter o ID do usuário logado
  getCurrentUserId(): Observable<string | null> {
    const userId = localStorage.getItem('userId'); // Recupera o userId do localStorage
    return userId ? of(userId) : throwError('Usuário não encontrado.'); // Retorna o userId ou erro se não encontrado
  }

  loadUserProfile() {
    const headers = this.getHeaders();
    // Continue a lógica de carregamento do perfil
  }
}
