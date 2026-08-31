import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  // Two-way bound to the template-driven login form via [(ngModel)].
  email = '';
  password = '';

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private auth: AuthService, private router: Router) {}

  onSubmit(form: NgForm): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (form.invalid) {
      this.errorMessage = 'Preencha email e senha corretamente antes de continuar.';
      return;
    }

    this.loading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Login realizado com sucesso! Redirecionando...';
        setTimeout(() => this.router.navigate(['/home']), 400);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Não foi possível entrar. Verifique suas credenciais.';
      }
    });
  }
}
