import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileService } from './profile.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = 'http://localhost:3000/api/auth';
  private tokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(this.getToken());
  
  constructor(
    private http: HttpClient,
    private profileService: ProfileService
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
    return this.http.post<{ token: string }>(`${this.baseUrl}/login`, { email, password }).pipe(
      map(response => {
        if (response && response.token) {
          this.setToken(response.token); // Usar o novo método setToken
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
    localStorage.setItem('token', token);
    this.tokenSubject.next(token); // Atualiza o BehaviorSubject com o novo token
  }

  // Método para fazer logout e remover o token do localStorage
  logout(): void {
    localStorage.removeItem('token');
    this.tokenSubject.next(null); // Atualiza o BehaviorSubject para nulo
  }

  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado. Faça login novamente.');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para obter o ID do usuário logado
  getCurrentUserId(): Observable<string | null> {
    return this.profileService.getUserProfile().pipe(
      map(userProfile => userProfile ? userProfile.id.toString() : null),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  loadUserProfile() {
    const headers = this.getHeaders();
    // Continue a lógica de carregamento do perfil
  }
}
