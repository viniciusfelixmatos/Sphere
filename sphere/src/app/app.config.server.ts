// src/app/app.config.server.ts
import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { appConfig } from './app.config';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth.interceptor'; // Certifique-se de que o caminho está correto

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])) // Registra o interceptor
  ]
};

// Mescla as configurações do aplicativo com as configurações do servidor
export const config = mergeApplicationConfig(appConfig, serverConfig);
