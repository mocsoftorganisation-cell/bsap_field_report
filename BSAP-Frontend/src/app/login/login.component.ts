import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
    selector: 'app-login',
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  rememberMe = false;
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginData: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };

    try {
      // Use the new API-based login
      this.authService.login(loginData, this.rememberMe).subscribe({
        next: (response) => {
          if (response.status) {
            console.log('Login successful:', response.message);
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = response.message || 'Login failed';
            this.isLoading = false;
          }
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = error.message || 'Invalid credentials. Please try again.';
          this.isLoading = false;
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMessage = error.message || 'An unexpected error occurred';
      this.isLoading = false;
    }
  }

  // Legacy login method for fallback
  // async onLoginLegacy() {
  //   if (!this.email || !this.password) {
  //     this.errorMessage = 'Please fill in all fields';
  //     return;
  //   }

  //   this.isLoading = true;
  //   this.errorMessage = '';

  //   try {
  //     await this.authService.loginLegacy(this.email, this.password);
  //     this.router.navigate(['/dashboard']);
  //   } catch (error: any) {
  //     this.errorMessage = error.message || 'Invalid credentials. Please try again.';
  //   } finally {
  //     this.isLoading = false;
  //   }
  // }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onForgotPassword() {
    // Navigate to forgot password page or show modal
    console.log('Forgot password clicked');
    // You can implement forgot password functionality here
  }

  onRegister() {
    // Navigate to registration page
    console.log('Register clicked');
    // You can implement navigation to registration page here
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // Handle Enter key press
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onLogin();
    }
  }
}