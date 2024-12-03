import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../services/auth.service';  // Importa o AuthService
import { ProfileService } from '../../services/profile.service';  // Importa o ProfileService

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
  standalone: true,
  imports: [
    MatIconModule,
    RouterModule,
    FormsModule,
    CommonModule
  ]
})
export class HomePageComponent implements OnInit {
  isCreatePostOpen = false;
  isDevelopmentModalOpen = false;
  postText = '';
  userProfilePicture = 'http://212.28.179.131:3000/uploads/default-profile.png';
  userId: number | null = null;
  progress = 0;
  private progressInterval: any;

  constructor(
    private router: Router, 
    private postService: PostService,
    private authService: AuthService,  // Injeta o AuthService
    private profileService: ProfileService  // Injeta o ProfileService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    this.postService.getPosts();
  }

  loadUserProfile() {
    const token = this.authService.getToken();  // Usa o AuthService para obter o token
    if (!token) {
      return;
    }

    // Agora usa o profileService corretamente para obter o perfil
    this.profileService.getUserProfile().subscribe(
      (profile: any) => {
        if (profile) {
          this.userProfilePicture = profile.profilePicture || 'http://212.28.179.131:3000/uploads/default-profile.png';
          this.userId = profile.id;
        }
      },
      () => {
        // Erro ao carregar o perfil do usuário não registrado no console
      }
    );
  }

  // Métodos de navegação e de modal
  navigateToHome() {
    this.router.navigate(['/home']);
  }

  navigateToProfile() {
    this.router.navigate(['/home/profile']);
  }

  navigateToCreatePost() {
    this.openCreatePost();
  }

  navigateToSearch() {
    this.openDevelopmentModal();
  }

  navigateToNotifications() {
    this.openDevelopmentModal();
  }

  navigateToMessages() {
    this.openDevelopmentModal();
  }

  openCreatePost() {
    this.isCreatePostOpen = true;
  }

  closeCreatePost() {
    this.isCreatePostOpen = false;
  }

  openDevelopmentModal() {
    this.isDevelopmentModalOpen = true;
    this.startProgressBar();
  }

  closeDevelopmentModal() {
    this.isDevelopmentModalOpen = false;
    this.progress = 0;
    clearInterval(this.progressInterval);
  }

  startProgressBar() {
    this.progress = 0;
    this.progressInterval = setInterval(() => {
      this.progress += 1;
      if (this.progress >= 100) {
        this.closeDevelopmentModal();
      }
    }, 100); // 100 ms * 100 = 10 segundos
  }

  savePost() {
    if (this.postText.trim() && this.userId !== null) {
      this.postService.addPost(this.postText).subscribe(
        () => {
          this.postText = '';
          this.closeCreatePost();
          this.postService.getPosts();
        },
        () => {
          // Erro ao criar post não registrado no console
        }
      );
    }
  }
}
