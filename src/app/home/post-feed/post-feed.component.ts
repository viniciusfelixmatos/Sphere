import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { PostService } from '../../services/post.service';
import { ProfileService } from '../../services/profile.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

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
  timestamp: Date;
  isCommenting?: boolean;
  hasLiked?: boolean;
  showAllComments?: boolean; // Novo campo para controlar a exibição de comentários
  newComment?: string; // Novo campo para armazenar o novo comentário
}

@Component({
  selector: 'app-post-feed',
  templateUrl: './post-feed.component.html',
  styleUrls: ['./post-feed.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule]
})
export class PostFeedComponent implements OnInit {
  private apiUrl = 'http://localhost:3000/api/posts';
  posts$!: Observable<Post[]>;
  userProfile$!: Observable<User>;
  newComment: string = ''; // Inicializa newComment como uma string vazia

  constructor(
    private postService: PostService,
    private profileService: ProfileService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPosts();
    this.loadUserProfile();
  }

  loadPosts() {
    this.posts$ = this.postService.posts$.pipe(
      map((posts: Post[]) => {
        if (!posts || posts.length === 0) {
          return []; // Retorna um array vazio se não houver posts
        }

        return posts.map(post => {
          return {
            ...post,
            user: this.getUserDetails(post.user),
            comments: this.processComments(post.comments),
            hasLiked: post.hasLiked || false,
            showAllComments: false,
            newComment: ''
          };
        });
      }),
      catchError(error => {
        return of([]); // Retorna um array vazio em caso de erro
      })
    );

    this.posts$.subscribe(posts => {
      if (posts.length > 0) {
        // Pode adicionar uma mensagem de sucesso aqui se desejar
      } else {
        // Pode adicionar uma mensagem de aviso aqui se desejar
      }
    });
  }

  private getUserDetails(user: any) {
    return user?.username
      ? user
      : {
          id: 0,
          username: 'desconhecido',
          name: 'Usuário Desconhecido',
          profilePicture: 'assets/default-profile.png',
        };
  }

  private processComments(comments: any[]) {
    return comments?.map(comment => ({
      ...comment,
      user: this.getUserDetails(comment.user),
    })) || []; // Retorna um array vazio se não houver comentários
  }

  loadUserProfile() {
    this.userProfile$ = this.profileService.getUserProfile().pipe(
      map(userProfile => {
        return {
          id: userProfile.id,
          username: userProfile.username,
          name: userProfile.username,
          profilePicture: userProfile.profilePicture || 'assets/default-profile.png'
        };
      }),
      catchError(error => {
        return of({
          id: 0,
          username: 'desconhecido',
          name: 'Usuário Desconhecido',
          profilePicture: 'assets/default-profile.png'
        });
      })
    );

    this.userProfile$.subscribe(profile => {
      // Pode adicionar uma mensagem de sucesso aqui se desejar
    });
  }

  getToken(): string | null {
    const token = localStorage.getItem('token');
    return token;
  }

  likePost(post: Post): void {
    const token = this.getToken(); 

    if (!token) {
      return;
    }

    if (post.hasLiked) {
      this.unlikePost(post);
      return;
    }

    this.http.post(`${this.apiUrl}/${post.id}/like`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .pipe(
      catchError((error) => {
        return throwError(error);
      })
    )
    .subscribe(() => {
      post.likes++;
      post.hasLiked = true;
    });
  }

  unlikePost(post: Post): void {
    const token = this.getToken();

    if (!token) {
      return;
    }

    this.http.delete(`${this.apiUrl}/${post.id}/like`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .pipe(
      catchError((error) => {
        return throwError(error);
      })
    )
    .subscribe(() => {
      post.likes--;
      post.hasLiked = false;
    });
  }

  toggleCommenting(post: Post): void {
    post.isCommenting = !post.isCommenting;
  }

  addComment(post: Post, comment: string | undefined): void {
    if (comment && comment.trim()) { // Certifique-se de que não é undefined e não é vazio
      firstValueFrom(this.userProfile$).then(userProfile => {
          const newComment: Comment = {
              user: userProfile,
              text: comment,
              timestamp: new Date()
          };
          post.comments.unshift(newComment); // Altera para unshift para adicionar o novo comentário no início
          this.newComment = ''; // Reseta o campo de novo comentário
          post.isCommenting = false;

          this.postService.addComment(post.id, comment).subscribe({
              next: () => {
                  // Pode adicionar uma mensagem de sucesso aqui se desejar
              },
              error: (error) => {
                  // Pode adicionar uma mensagem de erro aqui se desejar
              }
          });
      }).catch(error => {
          // Pode adicionar uma mensagem de erro ao obter perfil do usuário se desejar
      });
    }
  }

  viewAllComments(post: Post): void {
    post.showAllComments = !post.showAllComments;
  }

  favoritePost(post: Post): void {
    if (post.favorites) {
      this.postService.unfavoritePost(post.id).subscribe({
        next: () => {
          post.favorites = false;
        },
        error: (error) => {
          // Pode adicionar uma mensagem de erro ao desfavoritar o post se desejar
        }
      });
    } else {
      this.postService.favoritePost(post.id).subscribe({
        next: () => {
          post.favorites = true;
        },
        error: (error) => {
          // Pode adicionar uma mensagem de erro ao favoritar o post se desejar
        }
      });
    }
  }

  navigateToUserProfile(userId: number) {
    this.router.navigate(['/profile', userId]);
  }

  // Getter para obter a URL da foto de perfil
  getProfilePictureUrl(profilePicture: string): string {
    return profilePicture ? `http://localhost:3000/uploads/${profilePicture}` : 'assets/default-profile.png';
  }
}
