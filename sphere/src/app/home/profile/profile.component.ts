import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProfileService } from '../../services/profile.service';

interface UserProfile {
  id: number;
  username: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  bio: string;
  profilePicture: string;
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

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  @ViewChild('profilePictureInput', { static: false }) profilePictureInput!: ElementRef;

  defaultProfilePicture = 'http://localhost:3000/uploads/default-profile.png';
  
  src: string = this.defaultProfilePicture;

  user: UserProfile = {
    id: 0,
    username: '',
    postsCount: 0,
    followersCount: 0,
    followingCount: 0,
    bio: '',
    profilePicture: this.defaultProfilePicture
  };

  isEditProfileOpen = false;
  editedUsername = '';
  editedBio = '';
  profilePicture: File | string = this.defaultProfilePicture;
  profilePicturePreview: string = this.defaultProfilePicture;

  errorMessage: string | null = null;

  likedPosts: Post[] = [];
  userComments: Comment[] = [];
  favoritePosts: Post[] = [];

  showLikesContent = false;
  showCommentsContent = false;
  showFavoritesContent = false;

  activeTab: string = 'likes'; // Inicializa com 'likes'

  constructor(private profileService: ProfileService) {}

  ngOnInit() {
    this.loadUserProfile();
    this.loadUserLikes();
    this.loadUserComments();
    this.loadUserFavorites();
    this.showLikes(); // Exibe inicialmente os likes
  }

  loadUserProfile() {
    this.profileService.getUserProfile().subscribe(
      (profile: UserProfile) => {
        this.user = profile;
        this.profilePicture = profile.profilePicture || this.defaultProfilePicture;
        this.profilePicturePreview = this.profilePicture;
        this.editedUsername = profile.username;
        this.editedBio = profile.bio;
      },
      error => {
        this.errorMessage = 'Não foi possível carregar o perfil. Tente novamente mais tarde.';
      }
    );
  }

  loadUserLikes() {
    this.profileService.getUserLikes().subscribe(
      (likes: Post[]) => {
        this.likedPosts = likes; 
      },
      error => {
        this.errorMessage = 'Não foi possível carregar os posts curtidos. Tente novamente mais tarde.';
      }
    );
  }

  loadUserComments() {
    this.profileService.getUserComments().subscribe(
      (comments: Comment[]) => {
        this.userComments = comments.map(comment => ({
          ...comment,
          username: comment.username || 'Usuário Desconhecido',
          profilePicture: comment.profilePicture || this.defaultProfilePicture
        }));
      },
      error => {
        this.errorMessage = 'Não foi possível carregar os comentários. Tente novamente mais tarde.';
      }
    );
  }

  loadUserFavorites() {
    this.profileService.getUserFavorites().subscribe(
      (favorites: Post[]) => {
        this.favoritePosts = favorites;
      },
      error => {
        this.errorMessage = 'Não foi possível carregar os favoritos. Tente novamente mais tarde.';
      }
    );
  }

  openEditProfile() {
    this.isEditProfileOpen = true;
    this.editedUsername = this.user.username;
    this.editedBio = this.user.bio;
    this.errorMessage = null;
  }

  closeEditProfile() {
    this.isEditProfileOpen = false;
    this.errorMessage = null;
  }

  validateProfileData(): boolean {
    if (!this.editedUsername || this.editedUsername.trim().length < 3) {
      this.errorMessage = 'O campo Nome de Usuário é obrigatório e deve ter pelo menos 3 caracteres.';
      return false;
    }
    return true;
  }

  saveProfileChanges() {
    if (!this.validateProfileData()) {
      return;
    }

    const formData = new FormData();
    formData.append('username', this.editedUsername.trim());
    formData.append('bio', this.editedBio.trim());

    if (this.profilePicture instanceof File) {
      formData.append('profilePicture', this.profilePicture, this.profilePicture.name);
    } else {
      formData.append('profilePicture', this.profilePicture);
    }

    this.profileService.updateUserProfile(formData).subscribe(
      () => {
        this.user.username = this.editedUsername.trim();
        this.user.bio = this.editedBio.trim();
        this.user.profilePicture = this.profilePicture instanceof File ? this.profilePicturePreview : this.defaultProfilePicture;
        this.closeEditProfile();
        this.loadUserProfile();
      },
      error => {
        this.errorMessage = 'Não foi possível salvar as alterações. Tente novamente mais tarde.';
      }
    );
  }

  triggerFileInput() {
    this.profilePictureInput.nativeElement.click();
  }

  getProfilePictureUrl(): string {
    return this.user.profilePicture || this.defaultProfilePicture;
  }

  onProfilePictureChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        this.errorMessage = 'O arquivo deve ser menor que 10MB.';
        event.target.value = '';
        return;
      }

      const validFormats = ['image/jpeg', 'image/png'];
      if (!validFormats.includes(file.type)) {
        this.errorMessage = 'Formato inválido! Por favor, escolha uma imagem em formato JPG ou PNG.';
        event.target.value = '';
        return;
      }

      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };

      img.onload = () => {
        const width = img.width;
        const height = img.height;

        if (width > 1200 || height > 800) {
          this.errorMessage = 'A imagem deve ter dimensões menores que 1200x800 pixels.';
          event.target.value = '';
        } else {
          this.profilePicture = file;
          this.profilePicturePreview = URL.createObjectURL(file);
          this.errorMessage = null;
        }
      };

      reader.readAsDataURL(file);
    }
  }

  showLikes() {
    this.showLikesContent = true;
    this.showCommentsContent = false;
    this.showFavoritesContent = false;
    this.activeTab = 'likes'; // Atualiza a aba ativa
  }

  showComments() {
    this.showLikesContent = false;
    this.showCommentsContent = true;
    this.showFavoritesContent = false;
    this.activeTab = 'comments'; // Atualiza a aba ativa
  }

  showFavorites() {
    this.showLikesContent = false;
    this.showCommentsContent = false;
    this.showFavoritesContent = true;
    this.activeTab = 'favorites'; // Atualiza a aba ativa
  }
}
