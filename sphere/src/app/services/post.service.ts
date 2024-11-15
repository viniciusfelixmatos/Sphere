import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

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
  providedIn: 'root'
})
export class PostService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  posts$ = this.postsSubject.asObservable().pipe(shareReplay(1));  // Compartilha o valor com outros subscribers
  private apiUrl = 'http://localhost:3000/api/posts';  // URL da API

  constructor(private http: HttpClient) {}

  // Função para gerar os headers de autenticação
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Função para buscar todos os posts
  getPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
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
    const method = isLiked ? this.http.delete<Post>(actionUrl, { headers: this.getHeaders() }) 
                           : this.http.post<Post>(actionUrl, {}, { headers: this.getHeaders() });
    return method.pipe(
      catchError((error) => {
        console.error(`Erro ao ${isLiked ? 'descurtir' : 'curtir'} post:`, error);
        return throwError(() => new Error(`Erro ao ${isLiked ? 'descurtir' : 'curtir'} post: ${error.message}`));
      })
    );
  }
  

  // Função para adicionar um comentário a um post
  addComment(postId: number, text: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comment`, { text }, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erro ao adicionar comentário'))
    );
  }

  // Atualiza os comentários no estado do post após adicionar um novo comentário
  updateComments(postId: number, comment: Comment): void {
    this.posts$.subscribe(posts => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.comments.push(comment);
        this.postsSubject.next([...posts]); // Atualiza o estado dos posts
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
      return throwError(() => new Error(`${message}: ${error.statusText || error.message}`));
    };
  }
}
