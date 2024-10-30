import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

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
  comments: Comment[]; // Espera que os comentários venham na estrutura
  favorites: boolean;
  hasLiked: boolean;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private postsSubject = new BehaviorSubject<Post[]>([]);
  posts$ = this.postsSubject.asObservable().pipe(shareReplay(1));
  private apiUrl = 'http://localhost:3000/api/posts';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token não encontrado');
    }
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Adiciona um novo post apenas com texto
  addPost(content: string): Observable<Post> {
    const postData = { content };

    return this.http.post<Post>(this.apiUrl, postData, { headers: this.getHeaders() })
      .pipe(catchError(this.handleError('Erro ao criar post')));
  }

  // Busca todos os posts
  fetchPosts(): void {
    this.http.get<Post[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      shareReplay(1),
      catchError(this.handleError('Erro ao buscar posts'))
    ).subscribe(
      data => this.postsSubject.next(data),
      error => {} // Erro tratado sem console.log
    );
  }

  // Função para curtir ou remover o like de um post
  toggleLike(postId: number, isLiked: boolean): Observable<Post> {
    const action = isLiked ? 'unlike' : 'like';
    return this.http.post<Post>(`${this.apiUrl}/${postId}/${action}`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError(`Erro ao ${action} post`))
    );
  }

  // Adiciona um comentário a um post
  addComment(postId: number, text: string): Observable<Comment> { // Altere 'content' para 'text'
    return this.http.post<Comment>(`${this.apiUrl}/${postId}/comment`, { text }, { headers: this.getHeaders() }) // Altere 'content' para 'text' no corpo da requisição
      .pipe(
        catchError(this.handleError('Erro ao adicionar comentário'))
      );
  }

  // Método para atualizar os comentários no estado do post após adicionar um novo comentário
  updateComments(postId: number, comment: Comment): void {
    this.posts$.subscribe(posts => {
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.comments.push(comment);
        this.postsSubject.next([...posts]); // Atualiza o estado
      }
    });
  }

  // Favorita um post
  favoritePost(postId: number): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}/${postId}/favorite`, {}, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError('Erro ao favoritar post'))
    );
  }

  // Desfavorita um post
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
