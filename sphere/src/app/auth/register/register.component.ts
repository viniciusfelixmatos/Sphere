import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class RegisterComponent {
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private authService: AuthService) {}

  onRegister() {
    // Limpa mensagens anteriores
    this.successMessage = '';
    this.errorMessage = '';

    // Verifica se todos os campos estão preenchidos
    if (!this.email || !this.username || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Todos os campos são obrigatórios.';
      return;
    }

    // Verifica se as senhas coincidem
    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'As senhas não correspondem.';
      return;
    }

    // Faz a requisição de registro
    this.authService.register(this.username, this.email, this.password).subscribe(
      response => {
        this.successMessage = 'Registro bem-sucedido!';
        // Aqui você pode redirecionar o usuário ou realizar outra ação após o registro
      },
      error => {
        // Adiciona tratamento de erro mais específico
        if (error.status === 400) {
          if (error.error.msg === 'Usuário já está cadastrado com este e-mail.') {
            this.errorMessage = 'Este e-mail já está cadastrado.';
          } else {
            this.errorMessage = error.error.msg || 'Erro no registro. Verifique os dados fornecidos.';
          }
        } else {
          // Caso não seja um erro 400, trata como erro genérico
          this.errorMessage = 'Erro no registro. Verifique os dados fornecidos.';
        }
      }
    );
  }
}
