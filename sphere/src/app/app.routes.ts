import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomePageComponent } from './home/home-page/home-page.component';
import { ProfileComponent } from './home/profile/profile.component';
import { PostFeedComponent } from './home/post-feed/post-feed.component';
import { UserProfileComponent } from './home/user-profile/user-profile.component'; // Adicione esta linha

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'home', 
    component: HomePageComponent,
    children: [
      { path: 'profile', component: ProfileComponent },
      { path: 'post-feed', component: PostFeedComponent },
      { path: 'user-profile/:id', component: UserProfileComponent } // Adicionando a rota aqui é correto
    ]
  },
  { path: '**', redirectTo: '/login' }
];
