import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { tap, switchMap } from 'rxjs/operators';

interface User {
  id: string;
  username: string;
  profilePicture: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  bio: string;
  isFollowing?: boolean;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: User = {
    id: '',
    username: '',
    profilePicture: '',
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    bio: '',
    isFollowing: false
  };

  loggedInUserId: string | null = null;
  loading: boolean = true;
  errorMessage: string | null = null;

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    this.setLoggedInUserId().pipe(
      tap(id => {
        this.loggedInUserId = id;
      }),
      switchMap(() => {
        const userId = this.route.snapshot.paramMap.get('id');
        if (userId) {
          return this.loadUserProfile(userId);
        } else {
          this.errorMessage = 'ID do usuário não fornecido na URL.';
          this.loading = false;
          return new Observable<void>(); // Retorno vazio caso `userId` não esteja presente
        }
      })
    ).subscribe({
      error: err => {
        this.errorMessage = 'Erro ao carregar dados do perfil.';
        this.loading = false;
      }
    });
  }

  setLoggedInUserId(): Observable<string | null> {
    return this.userService.getLoggedInUserId().pipe(
      tap((id: string | null) => {
        this.loggedInUserId = id;
      })
    );
  }

  loadUserProfile(userId: string): Observable<void> {
    return new Observable(observer => {
      this.userService.getUserById(userId).subscribe(
        data => {
          this.user = {
            id: data.id,
            username: data.username || '',
            profilePicture: data.profilePicture || '',
            postsCount: data.postsCount || 0,
            followersCount: data.followersCount || 0,
            followingCount: data.followingCount || 0,
            bio: data.bio || '',
            isFollowing: data.isFollowing !== undefined ? data.isFollowing : false
          };
          this.loading = false;
          this.checkIfFollowing(this.user.id);
          observer.next();
          observer.complete();
        },
        error => {
          this.errorMessage = 'Não foi possível carregar o perfil do usuário.';
          this.loading = false;
          observer.error(error);
        }
      );
    });
  }

  checkIfFollowing(userId: string): void {
    this.userService.isFollowingUser(userId).subscribe(
      (isFollowing) => {
        this.user.isFollowing = isFollowing;
      },
      (error) => {
        this.errorMessage = 'Não foi possível verificar o status de seguir.';
      }
    );
  }

  followUser(): void {
    if (!this.loggedInUserId) {
      this.errorMessage = 'Você precisa estar logado para seguir ou deixar de seguir.';
      return;
    }

    if (this.user.isFollowing) {
      this.userService.unfollowUser(this.user.id).subscribe(
        () => {
          this.user.isFollowing = false;
          this.user.followersCount--;
        },
        error => {
          this.errorMessage = 'Não foi possível deixar de seguir o usuário.';
        }
      );
    } else {
      this.userService.followUser(this.user.id).subscribe(
        () => {
          this.user.isFollowing = true;
          this.user.followersCount++;
        },
        error => {
          this.errorMessage = 'Não foi possível seguir o usuário.';
        }
      );
    }
  }
}
