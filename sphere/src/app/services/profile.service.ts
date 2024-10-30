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

  public getToken(): string | null {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Token não encontrado no localStorage');
    }
    return token;
  }

  getUserProfile(): Observable<UserProfile> {
    const token = this.getToken();

    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

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
        return throwError(() => new Error('Erro ao carregar o perfil do usuário'));
      })
    );
  }

  updateUserProfile(formData: FormData): Observable<any> {
    const token = this.getToken();
    
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
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
        return throwError(() => new Error('Erro ao atualizar o perfil do usuário'));
      })
    );
  }

  getUsername(): Observable<string> {
    return this.getUserProfile().pipe(
      map(profile => profile.username)
    );
  }

  getUserPosts(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
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
        return throwError(() => new Error('Erro ao carregar os posts do usuário'));
      })
    );
  }

  getUserLikes(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
        return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

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
        return throwError(() => new Error('Erro ao carregar os likes do usuário'));
      })
    );
  }

  getUserComments(): Observable<Comment[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.get<Comment[]>(`${this.baseUrl}/comments`, { headers }).pipe(
      map(comments => {
        return comments.map(comment => ({
          ...comment,
          profilePicture: comment.profilePicture || 'http://localhost:3000/uploads/default-profile.png', 
        }));
      }),
      catchError(error => {
        return throwError(() => new Error('Erro ao carregar os comentários do usuário'));
      })
    );
  }

  getUserFavorites(): Observable<Post[]> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('Token não encontrado'));
    }
  
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
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
        return throwError(() => new Error('Erro ao carregar os favoritos do usuário'));
      })
    );
  }
}
