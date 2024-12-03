import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface do usuário
interface User {
  id: string;
  username: string;
  profilePicture: string;
  postsCount?: number;
  followersCount?: number;
  followingCount?: number;
  bio?: string;
  isFollowing?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User>({
    id: '',
    username: 'Current User',
    profilePicture: '',
  });

  currentUser$ = this.currentUserSubject.asObservable();
  private apiUrl = 'http://212.28.179.131:3000/api/user'; // URL base da API

  constructor(private http: HttpClient) {}

  // Define o usuário atual no BehaviorSubject
  setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  // Obtém o usuário atual do BehaviorSubject
  getCurrentUser(): User {
    return this.currentUserSubject.value;
  }

  // Retorna os cabeçalhos com o token de autorização
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Obtém o ID do usuário logado a partir do token JWT
  getLoggedInUserId(): Observable<string | null> {
    const userId = localStorage.getItem('userId');
    console.log('ID do usuário no localStorage:', userId); // Verifique se o ID está sendo recuperado corretamente
    return of(userId); // Retorna o ID ou null caso não esteja presente
  }

  // Obtém as informações de um usuário pelo ID
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError<User>('Erro ao obter informações do usuário')));
  }

  // Segue um usuário
  followUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/follow`, { userId }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError<void>('Erro ao seguir o usuário')));
  }

  // Deixa de seguir um usuário
  unfollowUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/unfollow`, { userId }, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError<void>('Erro ao deixar de seguir o usuário')));
  }

  // Verifica se o usuário está seguindo outro usuário
  isFollowingUser(userId: string): Observable<boolean> {
    return this.http.get<{ isFollowing: boolean }>(`${this.apiUrl}/${userId}/isFollowing`, { headers: this.getHeaders() })
      .pipe(
        map(response => response.isFollowing),
        catchError(this.handleError<boolean>('Erro ao verificar se está seguindo'))
      );
  }

  // Função centralizada para tratamento de erros
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(error); // Loga o erro no console
      // Você pode retornar um valor alternativo para manter o fluxo, ou re-throw o erro se preferir
      return of(result as T); // Retorna um valor padrão para o fluxo
    };
  }
}
