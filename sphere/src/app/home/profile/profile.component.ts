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
    console.log('Loading user profile...');
    this.profileService.getUserProfile().subscribe(
      (profile: UserProfile) => {
        console.log('User profile loaded:', profile);
        this.user = profile;
        this.profilePicture = profile.profilePicture || this.defaultProfilePicture;
        this.profilePicturePreview = this.profilePicture;
        this.editedUsername = profile.username;
        this.editedBio = profile.bio;
      },
      error => {
        console.error('Error loading user profile:', error);
        this.errorMessage = 'Não foi possível carregar o perfil. Tente novamente mais tarde.';
      }
    );
  }

  loadUserLikes() {
    console.log('Loading user likes...');
    this.profileService.getUserLikes().subscribe(
      (likes: Post[]) => {
        console.log('User likes loaded:', likes);
        this.likedPosts = likes; 
      },
      error => {
        console.error('Error loading user likes:', error);
        this.errorMessage = 'Não foi possível carregar os posts curtidos. Tente novamente mais tarde.';
      }
    );
  }

  loadUserComments() {
    console.log('Loading user comments...');
    this.profileService.getUserComments().subscribe(
      (comments: Comment[]) => {
        console.log('User comments loaded:', comments);
        this.userComments = comments.map(comment => ({
          ...comment,
          username: comment.username || 'Usuário Desconhecido',
          profilePicture: comment.profilePicture || this.defaultProfilePicture
        }));
      },
      error => {
        console.error('Error loading user comments:', error);
        this.errorMessage = 'Não foi possível carregar os comentários. Tente novamente mais tarde.';
      }
    );
  }

  loadUserFavorites() {
    console.log('Loading user favorites...');
    this.profileService.getUserFavorites().subscribe(
      (favorites: Post[]) => {
        console.log('User favorites loaded:', favorites);
        this.favoritePosts = favorites;
      },
      error => {
        console.error('Error loading user favorites:', error);
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
      console.log('Profile picture is a file:', this.profilePicture.name);
    } else {
      console.log('Profile picture is a URL:', this.profilePicture);
      formData.append('profilePicture', this.profilePicture);
    }

    console.log('Saving profile changes:', formData);
    this.profileService.updateUserProfile(formData).subscribe(
      () => {
        console.log('Profile updated successfully');
        this.user.username = this.editedUsername.trim();
        this.user.bio = this.editedBio.trim();
        this.user.profilePicture = this.profilePicture instanceof File ? this.profilePicturePreview : this.defaultProfilePicture;
        this.closeEditProfile();
        this.loadUserProfile();
      },
      error => {
        console.error('Error saving profile changes:', error);
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
        console.log('Selected file for profile picture:', file.name, 'Size:', file.size);

        // Alterado de 5MB para 10MB
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

            console.log('Image dimensions:', width, height);
            // Alterado de 800x600 para 1200x800
            if (width > 1200 || height > 800) {
                this.errorMessage = 'A imagem deve ter dimensões menores que 1200x800 pixels.';
                event.target.value = '';
            } else {
                this.profilePicture = file;
                this.profilePicturePreview = URL.createObjectURL(file);
                this.errorMessage = null;
                console.log('Profile picture selected and preview set:', this.profilePicturePreview);
            }
        };

        reader.readAsDataURL(file);
    }
  }


  // Método para registrar o post clicado
  logPost(post: Post) {
    console.log('Post clicked:', post);
  }

  // Métodos para alternar o conteúdo de likes, comentários e favoritos
  showLikes() {
    this.showLikesContent = true;
    this.showCommentsContent = false;
    this.showFavoritesContent = false;
    this.activeTab = 'likes'; // Atualiza a aba ativa
    console.log('Showing likes content');
  }

  showComments() {
    this.showLikesContent = false;
    this.showCommentsContent = true;
    this.showFavoritesContent = false;
    this.activeTab = 'comments'; // Atualiza a aba ativa
    console.log('Showing comments content');
  }

  showFavorites() {
    this.showLikesContent = false;
    this.showCommentsContent = false;
    this.showFavoritesContent = true;
    this.activeTab = 'favorites'; // Atualiza a aba ativa
    console.log('Showing favorites content');
  }
}
