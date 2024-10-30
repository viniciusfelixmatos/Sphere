import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Certifique-se de que o caminho está correto

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    // Limpa mensagens anteriores
    this.errorMessage = '';
    this.successMessage = '';

    // Verifica se todos os campos estão preenchidos
    if (!this.email || !this.password) {
      this.errorMessage = 'Todos os campos são obrigatórios.';
      return;
    }

    // Faz a requisição de login
    this.authService.login(this.email, this.password).subscribe(
      response => {
        this.successMessage = 'Login bem-sucedido!';
        
        // Redireciona para a página inicial ou outra página após login
        this.router.navigate(['/home']);
      },
      error => {
        // Aqui verificamos se há uma mensagem específica de erro retornada do backend
        // Agora estamos acessando diretamente a mensagem de erro do serviço
        this.errorMessage = error.message || 'Email ou senha incorretos. Verifique os dados fornecidos.';
      }
    );
  }
}
