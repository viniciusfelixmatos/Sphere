// src/app/app.config.server.ts
import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomePageComponent } from './home/home-page/home-page.component';
import { ProfileComponent } from './home/profile/profile.component';
import { PostFeedComponent } from './home/post-feed/post-feed.component';
import { UserProfileComponent } from './home/user-profile/user-profile.component';
import { authInterceptor } from './auth/auth.interceptor'; // Ajuste para minúsculo


export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'home', 
    component: HomePageComponent,
    children: [
      { path: '', component: PostFeedComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'user-profile/:id', component: UserProfileComponent }
    ]
  },
  { path: '**', redirectTo: '/login' }
];

export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])) // Registra o interceptor
  ]
};
