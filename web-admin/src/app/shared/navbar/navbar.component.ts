import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  // Observable so the navbar reacts instantly to login/logout anywhere in the app.
  currentUser$ = this.auth.currentUser$;

  constructor(private auth: AuthService, private router: Router) {}

  get user(): User | null {
    return this.auth.currentUser;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
