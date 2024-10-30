// user-profile.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

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

  loggedInUserId: string | null = null; // Novo campo para armazenar o ID do usuário logado
  loading: boolean = true;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private userService: UserService) {}

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserProfile(userId);
    }
    this.setLoggedInUserId(); // Obtém o ID do usuário logado
  }

  loadUserProfile(userId: string): void {
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

        this.checkIfFollowing(this.user.id);
        this.loading = false;
      },
      error => {
        this.error = 'Não foi possível carregar o perfil do usuário.';
        this.loading = false;
      }
    );
  }

  setLoggedInUserId(): void {
    this.userService.getLoggedInUserId().subscribe(
      (id: string | null) => {
        this.loggedInUserId = id; // Aqui você pode lidar com o valor null conforme necessário
      },
      (error: any) => { // Especifica o tipo de erro
        this.error = 'Não foi possível obter o ID do usuário logado.';
      }
    );
  }
  
  checkIfFollowing(userId: string): void {
    this.userService.isFollowingUser(userId).subscribe(
      (isFollowing) => {
        this.user.isFollowing = isFollowing;
      },
      (error) => {
        this.error = 'Não foi possível verificar o status de seguir.';
      }
    );
  }

  followUser(): void {
    if (this.user.isFollowing) {
      this.userService.unfollowUser(this.user.id).subscribe(
        () => {
          this.user.isFollowing = false;
          this.user.followersCount--;
        },
        error => {
          this.error = 'Não foi possível deixar de seguir o usuário.';
        }
      );
    } else {
      this.userService.followUser(this.user.id).subscribe(
        () => {
          this.user.isFollowing = true;
          this.user.followersCount++;
        },
        error => {
          this.error = 'Não foi possível seguir o usuário.';
        }
      );
    }
  }
}
