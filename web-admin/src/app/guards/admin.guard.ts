import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Only ADMIN accounts may reach the /admin management view. A logged-in
// PATIENT is bounced back to /home instead of being logged out.
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  if (auth.isAdmin()) {
    return true;
  }

  router.navigate(['/home']);
  return false;
};
