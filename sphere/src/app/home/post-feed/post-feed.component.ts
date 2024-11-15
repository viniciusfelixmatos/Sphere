import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { ProfileService } from '../../services/profile.service';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';

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
  showAllComments?: boolean;
  newComment?: string;
}

@Component({
  selector: 'app-post-feed',
  templateUrl: './post-feed.component.html',
  styleUrls: ['./post-feed.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RouterModule]
})
export class PostFeedComponent implements OnInit {
  posts$!: Observable<Post[]>;
  userProfile$!: Observable<User>;

  constructor(
    private postService: PostService,
    private profileService: ProfileService,
    private router: Router,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.posts$ = this.postService.getPosts().pipe(
      map(posts => posts.map(post => ({
        ...post,
        user: this.getUserDetails(post.user),
        comments: this.processComments(post.comments),
        hasLiked: post.hasLiked || false,
        showAllComments: false,
        newComment: '' // Garantir que newComment sempre tenha um valor (string)
      }))),
      catchError(error => {
        console.error('Error loading posts:', error);
        return of([]); // Retorna um array vazio em caso de erro
      })
    );

    this.userProfile$ = this.profileService.getUserProfile().pipe(
      map(userProfile => ({
        id: userProfile.id,
        username: userProfile.username,
        profilePicture: userProfile.profilePicture || 'assets/default-profile.png'
      })),
      catchError(error => {
        console.error('Error loading user profile:', error);
        return of({ id: 0, username: 'desconhecido', profilePicture: 'assets/default-profile.png' });
      })
    );
  }

  private getUserDetails(user: any): User {
    return user?.username
      ? user
      : { id: 0, username: 'desconhecido', profilePicture: 'assets/default-profile.png' };
  }

  private processComments(comments: any[]): Comment[] {
    return comments?.map(comment => ({
      ...comment,
      user: this.getUserDetails(comment.user),
    })) || [];
  }

  likePost(post: Post): void {
    if (!post.id) {
      console.error('Erro: ID do post está indefinido.');
      return; // Se o post não tiver ID, não executa a ação
    }
    
    const hasLiked = post.hasLiked ?? false; // Verifica se o post já foi curtido
    this.postService.toggleLike(post.id, hasLiked).subscribe({
      next: () => {
        post.likes += hasLiked ? -1 : 1;
        post.hasLiked = !hasLiked;
        this.cdRef.detectChanges(); // Força a detecção de mudanças para atualizar o UI
      },
      error: (error: HttpErrorResponse) => console.error('Error liking/unliking post:', error)
    });
  }

  addComment(post: Post, comment: string): void {
    if (!comment.trim()) return; // Não permite comentário vazio

    this.userProfile$.pipe(
      switchMap(userProfile => {
        const newComment: Comment = {
          user: userProfile,
          text: comment.trim(),
          timestamp: new Date()
        };
        post.comments.unshift(newComment); // Adiciona o novo comentário no topo
        post.newComment = ''; // Limpa o campo de novo comentário
        post.isCommenting = false; // Fecha o campo de adicionar comentário

        return this.postService.addComment(post.id, comment);
      })
    ).subscribe({
      next: () => {
        this.cdRef.detectChanges(); // Força a detecção de mudanças para atualizar a lista de comentários
      },
      error: (error: HttpErrorResponse) => console.error('Error adding comment:', error)
    });
  }

  toggleCommenting(post: Post): void {
    post.isCommenting = !post.isCommenting; // Alterna a visibilidade da seção de comentário
  }

  viewAllComments(post: Post): void {
    post.showAllComments = !post.showAllComments; // Alterna a exibição dos comentários
    this.cdRef.detectChanges();
  }

  favoritePost(post: Post): void {
    if (!post || !post.id) {
      console.error("ID do post está indefinido.");
      return; // Evita que o serviço seja chamado se o ID do post for inválido
    }
  
    if (post.favorites) {
      this.postService.unfavoritePost(post.id).subscribe({
        next: () => {
          post.favorites = false;
          this.cdRef.detectChanges(); // Força a detecção de mudanças para atualizar a UI
        },
        error: error => console.error('Erro ao desfavoritar post:', error)
      });
    } else {
      this.postService.favoritePost(post.id).subscribe({
        next: () => {
          post.favorites = true;
          this.cdRef.detectChanges(); // Força a detecção de mudanças para atualizar a UI
        },
        error: error => console.error('Erro ao favoritar post:', error)
      });
    }
  }

  navigateToUserProfile(userId: number): void {
    this.router.navigate(['/profile', userId]); // Navega para o perfil do usuário
  }

  getProfilePictureUrl(profilePicture: string): string {
    return profilePicture ? `http://localhost:3000/uploads/${profilePicture}` : 'assets/default-profile.png';
  }
}
