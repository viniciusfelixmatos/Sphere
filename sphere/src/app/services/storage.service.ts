import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  // Método para verificar se estamos no ambiente do navegador
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // Método para obter um item do localStorage
  getItem(key: string): string | null {
    if (this.isBrowser()) {
      return localStorage.getItem(key);
    }
    console.warn(`Tentativa de acessar localStorage em um ambiente não-navegador.`);
    return null;
  }

  // Método para definir um item no localStorage
  setItem(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    } else {
      console.warn(`Tentativa de definir localStorage em um ambiente não-navegador.`);
    }
  }

  // Método para remover um item do localStorage
  removeItem(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    } else {
      console.warn(`Tentativa de remover item do localStorage em um ambiente não-navegador.`);
    }
  }

  // Método para limpar o localStorage
  clear(): void {
    if (this.isBrowser()) {
      localStorage.clear();
    } else {
      console.warn(`Tentativa de limpar localStorage em um ambiente não-navegador.`);
    }
  }
}
