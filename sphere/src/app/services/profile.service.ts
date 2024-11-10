import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface UserProfile {
  username: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  bio: string;
  profilePicture: string;
  id: number;
}

interface User {
  id: number;
  username: string;
  profilePicture: string;
}

interface Comment {
  id: number;
  userId: number;
  username: string;
  profilePicture: string;
  text: string;
  timestamp: Date;
}

interface Post {
  id: number;
  title: string;
  user: User; 
  content: string;
  likes: number;
  comments: Comment[];
  favorites: boolean;
  hasLiked: boolean;
  timestamp: Date;
  profilePicture?: string; 
  userId?: number; 
  username?: string; 
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = 'http://localhost:3000/api/user'; // URL base da API
  private profilePictureSubject = new BehaviorSubject<string>('http://localhost:3000/uploads/default-profile.png');
  profilePicture$ = this.profilePictureSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Função para obter o token de forma centralizada
  // Alteração do método para public
  public getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
    console.warn('Token não encontrado no localStorage');
    }
    return token;
  }


  // Função para obter cabeçalhos com token de autenticação
  private getHeaders(): HttpHeaders {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Obter o perfil do usuário
  getUserProfile(): Observable<UserProfile> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = this.getHeaders();

    return this.http.get<UserProfile>(`${this.baseUrl}/profile`, { headers }).pipe(
      map((profile: UserProfile) => {
        const profilePictureUrl = profile.profilePicture
          ? `http://localhost:3000/uploads/${profile.profilePicture}`
          : 'http://localhost:3000/uploads/default-profile.png';
        this.profilePictureSubject.next(profilePictureUrl);
        profile.profilePicture = profilePictureUrl;
        return profile;
      }),
      catchError(error => {
        console.error('Erro ao carregar o perfil do usuário', error);
        return throwError(() => new Error('Erro ao carregar o perfil do usuário'));
      })
    );
  }

  // Atualizar o perfil do usuário
  updateUserProfile(formData: FormData): Observable<any> {
    const token = this.getToken();
    
    if (!token) {
      console.warn('Token não encontrado. Atualização do perfil não pode ser realizada.');
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = this.getHeaders();
    
    return this.http.put(`${this.baseUrl}/profile`, formData, { headers }).pipe(
      map(() => {
        this.getUserProfile().subscribe(profile => {
          const profilePictureUrl = profile.profilePicture
            ? `http://localhost:3000/uploads/${profile.profilePicture}`
            : 'http://localhost:3000/uploads/default-profile.png';
          
          this.profilePictureSubject.next(profilePictureUrl);
        });
      }),
      catchError(error => {
        console.error('Erro ao atualizar o perfil do usuário', error);
        return throwError(() => new Error('Erro ao atualizar o perfil do usuário'));
      })
    );
  }

  // Obter o nome de usuário
  getUsername(): Observable<string> {
    return this.getUserProfile().pipe(
      map(profile => profile.username)
    );
  }

  // Obter os posts do usuário
  getUserPosts(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = this.getHeaders();
    
    return this.http.get<Post[]>(`${this.baseUrl}/posts`, { headers }).pipe(
      map(posts => {
        return posts.map(post => {
          return {
            ...post,
            timestamp: new Date(post.timestamp),
            user: {
              ...post.user,
              profilePicture: post.user?.profilePicture
                ? `http://localhost:3000/uploads/${post.user.profilePicture}`
                : 'http://localhost:3000/uploads/default-profile.png',
              username: post.user.username || 'Usuário Desconhecido'
            }
          };
        });
      }),
      catchError(error => {
        console.error('Erro ao carregar os posts do usuário', error);
        return throwError(() => new Error('Erro ao carregar os posts do usuário'));
      })
    );
  }

  // Obter os likes do usuário
  getUserLikes(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
        return throwError(() => new Error('Token não encontrado'));
    }

    const headers = this.getHeaders();

    return this.http.get<Post[]>(`${this.baseUrl}/likes`, { headers }).pipe(
      map(posts => {
        return posts.map(post => {
          const profilePictureUrl = post.profilePicture
            ? `http://localhost:3000/uploads/${post.profilePicture}`
            : 'http://localhost:3000/uploads/default-profile.png';
    
          return {
            ...post,
            timestamp: new Date(post.timestamp),
            user: {
              id: post.userId !== undefined ? post.userId : 0,
              profilePicture: profilePictureUrl,
              username: post.username || 'Usuário Desconhecido'
            }
          } as Post;
        });
      }),
      catchError(error => {
        console.error('Erro ao carregar os likes do usuário', error);
        return throwError(() => new Error('Erro ao carregar os likes do usuário'));
      })
    );
  }

  // Obter os comentários do usuário
  getUserComments(): Observable<Comment[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = this.getHeaders();
    
    return this.http.get<Comment[]>(`${this.baseUrl}/comments`, { headers }).pipe(
      map(comments => {
        return comments.map(comment => ({
          ...comment,
          profilePicture: comment.profilePicture || 'http://localhost:3000/uploads/default-profile.png', 
        }));
      }),
      catchError(error => {
        console.error('Erro ao carregar os comentários do usuário', error);
        return throwError(() => new Error('Erro ao carregar os comentários do usuário'));
      })
    );
  }

  // Obter os posts favoritos do usuário
  getUserFavorites(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }
  
    const headers = this.getHeaders();
    
    return this.http.get<Post[]>(`${this.baseUrl}/favorites`, { headers }).pipe(
      map(favorites => {
        return favorites.map(post => {
          const profilePictureUrl = post.profilePicture
            ? `http://localhost:3000/uploads/${post.profilePicture}`
            : 'http://localhost:3000/uploads/default-profile.png';
  
          return {
            ...post,
            timestamp: new Date(post.timestamp),
            user: {
              id: post.userId !== undefined ? post.userId : 0,
              profilePicture: profilePictureUrl,
              username: post.username || 'Usuário Desconhecido'
            }
          } as Post;
        });
      }),
      catchError(error => {
        console.error('Erro ao carregar os favoritos do usuário', error);
        return throwError(() => new Error('Erro ao carregar os favoritos do usuário'));
      })
    );
  }
}
