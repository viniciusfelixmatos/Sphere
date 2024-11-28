import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';

// Definindo a estrutura dos objetos User, Comment e Post
interface User {
  id: number;
  username: string;
  profilePicture: string;
}

interface Comment {
  user: User;
  text: string;
  timestamp: Date;
}

interface Post {
  id: number;
  user: User;
  content: string;
  likes: number;
  comments: Comment[];
  favorites: boolean;
  hasLiked: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class PostService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  posts$ = this.postsSubject.asObservable().pipe(shareReplay(1));
  private apiUrl = 'http://localhost:3000/api/posts';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadPosts();
  }

  // Método para carregar posts ao inicializar o serviço
  private loadPosts(): void {
    this.getPosts().subscribe({
      next: (posts) => this.postsSubject.next(posts),
      error: (err) => console.error('Erro ao carregar posts iniciais:', err),
    });
  }

  // Função para gerar os headers de autenticação
  private getHeaders(): HttpHeaders {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('Token não encontrado');
          return new HttpHeaders();
        }
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
      } catch (error) {
        throw new Error('Erro ao acessar o token no localStorage');
      }
    }
    throw new Error('Ambiente não suporta localStorage');
  }

  // Função para buscar todos os posts
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      map((posts) =>
        posts.map((post) => ({
          ...post,
          timestamp: new Date(post.timestamp),
          comments: post.comments.map((comment) => ({
            ...comment,
            timestamp: new Date(comment.timestamp),
          })),
        }))
      ),
      catchError(this.handleError('Erro ao buscar posts'))
    );
  }

  // Função para adicionar um novo post
  addPost(content: string): Observable<Post> {
    const postData = { content };
    return this.http.post<Post>(this.apiUrl, postData, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erro ao criar post'))
    );
  }

  // Função para curtir ou remover o like de um post
  toggleLike(postId: number, isLiked: boolean): Observable<Post> {
    const actionUrl = `${this.apiUrl}/${postId}/like`;
    const method = isLiked
      ? this.http.delete<Post>(actionUrl, { headers: this.getHeaders() })
      : this.http.post<Post>(actionUrl, {}, { headers: this.getHeaders() });

    return method.pipe(
      catchError(this.handleError(`Erro ao ${isLiked ? 'descurtir' : 'curtir'} o post`))
    );
  }

  // Função para adicionar um comentário a um post
  addComment(postId: number, text: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comment`, { text }, { headers: this.getHeaders() }).pipe(
      map((comment) => ({
        ...comment,
        timestamp: new Date(comment.timestamp),
      })),
      catchError(this.handleError('Erro ao adicionar comentário'))
    );
  }

  // Atualiza os comentários no estado do post após adicionar um novo comentário
  updateComments(postId: number, comment: Comment): void {
    this.posts$.pipe(take(1)).subscribe((posts) => {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        post.comments.push(comment);
        this.postsSubject.next([...posts]);
      }
    });
  }

  // Função para favoritar um post
  favoritePost(postId: number): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${postId}/favorite`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erro ao favoritar post'))
    );
  }

  // Função para desfavoritar um post
  unfavoritePost(postId: number): Observable<Post> {
    return this.http.delete<Post>(`${this.apiUrl}/${postId}/favorite`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erro ao desfavoritar post'))
    );
  }

  // Função genérica para tratamento de erros
  private handleError(message: string) {
    return (error: any) => {
      console.error(`${message}:`, error);
      return throwError(() => new Error(`${message}: ${error.statusText || error.message}`));
    };
  }
}
