import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  // user = {
  //   name: 'John Doe',
  //   email: '',
  //   role: 'Administrator',
  //   joinDate: 'January 2024',
  //   avatar: ''
  // };
  user: User | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    // this.user.email = this.authService.getUserEmail() || '';
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.authService.user$.subscribe(user => {
      this.user = user;
    });

    // Fallback if not loaded yet
    if (!this.user) {
      const storedEmail = localStorage.getItem('email') || localStorage.getItem('userEmail');
      const storedFirstName = localStorage.getItem('firstName');
      const storedLastName = localStorage.getItem('lastName');
      const storedRoleName = localStorage.getItem('roleName');

      this.user = {
        id: 0,
        firstName: storedFirstName || '',
        lastName: storedLastName || '',
        email: storedEmail || '',
        role: { id: 0, roleName: storedRoleName || '' },
        permissions: []
      };
    }
  }

  getUserDisplayName(): string {
    if (this.user?.firstName) return this.user.firstName;
    const firstName = localStorage.getItem('firstName');
    if (firstName) return firstName;
    const email = this.user?.email || localStorage.getItem('email') || localStorage.getItem('userEmail');
    if (email) return email.split('@')[0];
    return 'User';
  }

  getUserInitial(): string {
    const name = this.user?.firstName || localStorage.getItem('firstName');
    if(name){
      return name.substring(0, 2).toUpperCase();
    }
    
    const email = this.user?.email || localStorage.getItem('email') || localStorage.getItem('userEmail');
    if(email){
      return email.substring(0, 2).toUpperCase();
    }
    return 'US';
  }

  getUserEmail(): string {
    return this.user?.email || localStorage.getItem('email') || localStorage.getItem('userEmail') || '';
  }

  getUserRole(): string {
    return this.user?.role?.roleName || localStorage.getItem('roleName') || '';
  }

  getUserJoinDate(): string {
    if(this.user?.created_date){
      const date = new Date(this.user.created_date);
      return date.toLocaleString();
    }

    const storedJoinDate = localStorage.getItem('joinDate');
    if(storedJoinDate) return new Date(storedJoinDate).toLocaleString();

    return 'Date not Available';
  }

  getUserAvatar(): string {
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.getUserDisplayName()) + '&background=6366f1&color=fff&size=80';
  }

  onSave() {
    console.log('Profile updated:', this.user);
  }
  goback() {
    this.router.navigate(['/dashboard']);
  }
}