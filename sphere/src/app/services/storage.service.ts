import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Método para verificar se estamos no ambiente do navegador
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Método para verificar se o item existe no localStorage
  private hasItem(key: string): boolean {
    return this.isBrowser() && localStorage.getItem(key) !== null;
  }

  // Método para obter um item do localStorage
  getItem(key: string): string | null {
    if (this.isBrowser()) {
      if (this.hasItem(key)) {
        return localStorage.getItem(key);
      } else {
        console.warn(`Item "${key}" não encontrado no localStorage.`);
      }
    } else {
      console.warn(`Tentativa de acessar localStorage em um ambiente não-navegador.`);
    }
    return null;
  }

  // Método para definir um item no localStorage
  setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error(`Erro ao definir item "${key}" no localStorage:`, error);
      }
    } else {
      console.warn(`Tentativa de definir localStorage em um ambiente não-navegador.`);
    }
  }

  // Método para remover um item do localStorage
  removeItem(key: string): void {
    if (this.isBrowser()) {
      if (this.hasItem(key)) {
        localStorage.removeItem(key);
      } else {
        console.warn(`Item "${key}" não encontrado no localStorage para remoção.`);
      }
    } else {
      console.warn(`Tentativa de remover item do localStorage em um ambiente não-navegador.`);
    }
  }

  // Método para limpar o localStorage
  clear(): void {
    if (this.isBrowser()) {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('Erro ao limpar o localStorage:', error);
      }
    } else {
      console.warn(`Tentativa de limpar localStorage em um ambiente não-navegador.`);
    }
  }

  // Método para obter e verificar o token de autenticação (por exemplo, JWT)
  getToken(): string | null {
    return this.getItem('token');
  }

  // Método para definir o token de autenticação (exemplo: JWT)
  setToken(token: string): void {
    this.setItem('token', token);
  }

  // Método para remover o token de autenticação
  removeToken(): void {
    this.removeItem('token');
  }
}
