import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { Observable, of, EMPTY } from 'rxjs';
import { tap, switchMap, catchError, mapTo } from 'rxjs/operators';

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
  showFollowButton: boolean = false;
  followLoading: boolean = false; // Indica o carregamento da ação de seguir/desseguir
  isClicked: boolean = false; // Variável para controlar o estado de clique do botão

  constructor(
    private route: ActivatedRoute,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    console.log('Iniciando a carga do perfil do usuário...');
    this.setLoggedInUserId()
      .pipe(
        tap(id => {
          console.log('ID do usuário logado:', id);
          this.loggedInUserId = id;
        }),
        switchMap(() => this.loadUserProfile())
      )
      .subscribe({
        next: () => {
          console.log('Dados do perfil carregados com sucesso:', this.user);
          this.showFollowButton = this.user.id !== this.loggedInUserId; // Só mostra o botão se o perfil não for o do usuário logado
          this.loading = false;
        },
        error: () => {
          console.error('Erro ao carregar dados do perfil.');
          this.errorMessage = 'Erro ao carregar dados do perfil.';
          this.loading = false;
        }
      });
  }

  setLoggedInUserId(): Observable<string | null> {
    console.log('Buscando o ID do usuário logado...');
    return this.userService.getLoggedInUserId().pipe(
      tap((id: string | null) => {
        console.log('ID do usuário logado recuperado:', id);
        this.loggedInUserId = id;
      }),
      catchError(() => {
        console.error('Erro ao obter ID do usuário logado.');
        this.errorMessage = 'Erro ao obter ID do usuário logado.';
        return of(null);
      })
    );
  }

  loadUserProfile(): Observable<void> {
    const userId = this.route.snapshot.paramMap.get('id');
    if (!userId) {
      console.error('ID do usuário não fornecido na URL.');
      this.errorMessage = 'ID do usuário não fornecido na URL.';
      this.loading = false;
      return EMPTY;
    }

    console.log('Carregando perfil do usuário com ID:', userId);
    return this.userService.getUserById(userId).pipe(
      tap(data => {
        console.log('Dados do usuário recuperados:', data);
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
      }),
      switchMap(() => this.checkIfFollowing(this.user.id).pipe(
        tap(isFollowing => {
          console.log('Status de seguir para o usuário:', isFollowing);
          this.user.isFollowing = isFollowing;
        }),
        mapTo(void 0),
        catchError(() => EMPTY)
      ))
    );
  }

  checkIfFollowing(userId: string): Observable<boolean> {
    console.log('Verificando se está seguindo o usuário com ID:', userId);
    return this.userService.isFollowingUser(userId).pipe(
      catchError(() => {
        console.error('Erro ao verificar se está seguindo o usuário.');
        this.errorMessage = 'Erro ao verificar o status de seguir.';
        return of(false);
      })
    );
  }

  followUser(): void {
    console.log('Tentando seguir ou deixar de seguir o usuário...');

    if (!this.loggedInUserId) {
      console.log('Usuário não logado.');
      this.errorMessage = 'Você precisa estar logado para seguir ou deixar de seguir.';
      return;
    }

    if (this.isClicked || this.followLoading) {
      return; // Impede múltiplos cliques simultâneos
    }

    this.isClicked = true; // Marca como clicado
    this.followLoading = true; // Indica que a ação de seguir/desseguir está em progresso

    console.log('ID do usuário logado:', this.loggedInUserId);
    console.log('Status de seguir do usuário:', this.user.isFollowing);

    const followAction = this.user.isFollowing
      ? this.userService.unfollowUser(this.user.id)
      : this.userService.followUser(this.user.id);

    followAction.subscribe({
      next: () => {
        console.log('Ação de seguir executada com sucesso.');
        this.user.isFollowing = !this.user.isFollowing;

        // Atualiza a contagem de seguidores
        if (this.user.isFollowing) {
          this.user.followersCount += 1;
        } else {
          this.user.followersCount -= 1;
        }

        console.log('Novo status de seguir:', this.user.isFollowing);
        console.log('Contagem de seguidores atualizada:', this.user.followersCount);
        this.isClicked = false; // Desmarca o botão
        this.followLoading = false; // Fim da ação
      },
      error: () => {
        console.error(`Não foi possível ${this.user.isFollowing ? 'deixar de seguir' : 'seguir'} o usuário.`);
        this.errorMessage = `Não foi possível ${this.user.isFollowing ? 'deixar de seguir' : 'seguir'} o usuário.`;
        this.isClicked = false; // Desmarca o botão
        this.followLoading = false; // Fim da ação
      }
    });
  }
}
