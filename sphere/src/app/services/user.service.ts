import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface do usuário
interface User {
  id: string; // ID do usuário
  username: string; // Alterado de name para username
  profilePicture: string;
  postsCount?: number; // Campos opcionais
  followersCount?: number;
  followingCount?: number;
  bio?: string;
  isFollowing?: boolean; // Adicionando isFollowing
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User>({
    id: '', // Inicia com um ID vazio
    username: 'Current User', // Nome padrão
    profilePicture: '',
  });

  currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'http://localhost:3000/api/user'; // URL base da sua API

  constructor(private http: HttpClient) {}

  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }
  
  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Supondo que você armazena o token no localStorage
    return new HttpHeaders({
      Authorization: `Bearer ${token}`, // Adiciona o cabeçalho de autorização
    });
  }

  // Método para obter o ID do usuário logado a partir do token
  getLoggedInUserId(): Observable<string | null> {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Divide o token em partes
      const parts = token.split('.');
      if (parts.length !== 3) {
        return of(null); // Retorna um Observable com null se o token não estiver no formato correto
      }

      // Decodifica a parte do payload do token
      const payload = parts[1];
      const decodedPayload = JSON.parse(atob(payload)); // Usa atob para decodificar Base64

      // Verifica a validade do token
      if (!decodedPayload.userId) {
        return of(null); // Se o payload não contiver um userId válido
      }

      // Retorna o ID do usuário encapsulado em um Observable
      return of(decodedPayload.userId || null); // Retorna um Observable com o userId ou null
    }

    return of(null); // Retorna um Observable com null se não houver token
  }

  // Método para obter informações de um usuário pelo ID
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Erro ao buscar usuário por ID:', error);
          return throwError(() => new Error('Falha ao obter informações do usuário.'));
        })
      );
  }

  // Método para seguir um usuário
  followUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/follow`, { userId }, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Erro ao seguir usuário:', error);
          return throwError(() => new Error('Não foi possível seguir o usuário.'));
        })
      );
  }

  // Método para deixar de seguir um usuário
  unfollowUser(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/unfollow`, { userId }, { headers: this.getHeaders() })
      .pipe(
        catchError(error => {
          console.error('Erro ao deixar de seguir usuário:', error);
          return throwError(() => new Error('Não foi possível deixar de seguir o usuário.'));
        })
      );
  }

  // Método para verificar se o usuário está seguindo outro usuário
  isFollowingUser(userId: string): Observable<boolean> {
    return this.http.get<{ isFollowing: boolean }>(`${this.apiUrl}/${userId}/isFollowing`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.isFollowing), // Extrai o valor booleano isFollowing
        catchError(error => {
          console.error('Erro ao verificar se está seguindo:', error);
          return throwError(() => new Error('Erro ao verificar se o usuário está seguindo.'));
        })
      );
  }

  // Outros métodos relacionados a usuários podem ser adicionados aqui, se necessário
}
