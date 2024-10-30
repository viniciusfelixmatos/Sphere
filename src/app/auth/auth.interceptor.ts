// src/app/auth/auth.interceptor.ts
import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { HttpInterceptorFn } from '@angular/common/http';


// Implementa o interceptor como uma função
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn // Use HttpHandlerFn em vez de HttpHandler
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService); // Injeta o AuthService

  const token = authService.getToken();

  // Clone a requisição para adicionar o token ao cabeçalho
  let clonedRequest = req;
  if (token) {
    clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Chame 'next' como uma função, passando o clonedRequest
  return next(clonedRequest).pipe(
    catchError(error => {
      // Se o token expirou, tente renová-lo
      if (error.status === 401) { // 401 Unauthorized
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            const newToken = response.token; // Assumindo que a resposta tem um campo 'token'
            authService.setToken(newToken); // Armazena o novo token
            // Refaz a requisição original com o novo token
            clonedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`
              }
            });
            // Chame novamente o next com o clonedRequest atualizado
            return next(clonedRequest);
          }),
          catchError(err => {
            // Se a renovação falhar, redirecione para login ou mostre uma mensagem de erro
            authService.logout();
            return throwError(err);
          })
        );
      }

      return throwError(error);
    })
  );
};
