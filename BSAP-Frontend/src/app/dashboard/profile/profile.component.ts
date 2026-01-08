import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class ProfileComponent implements OnInit, OnDestroy {
  // User data
  user: User = {
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    contactNo: '',
    role: { id: 0, roleName: '' },
    permissions: [],
    created_date: '',
    joining_date: ''
  };

  // Password change fields
  currentPassword = '';
  newPassword = '';

  // Form states
  isLoading = false;
  saveSuccess = false;
  passwordChangeSuccess = false;
  errorMessage = '';
  isFormSubmitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    console.log('Profile Component Initialized');
    this.loadUserProfile();
  }

  ngOnDestroy(): void {
    this.lockScroll(false);
  }

  private loadUserProfile(): void {
    this.isLoading = true;
    
    this.authService.loadUserProfile().subscribe({
      next: (userData) => {
        console.log('✅ User profile loaded from API:', {
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          mobileNo: userData.mobileNo,
          contactNo: userData.contactNo,
          fullData: userData
        });
        
        this.user = {
          ...userData,
          contactNo: userData.contactNo || '', // Ensure contactNo is set
          mobileNo: userData.mobileNo || '',
          created_date: userData.created_date || '',
          joining_date: userData.joining_date || ''
        };
        
        console.log('User object after load:', {
          mobileNo: this.user.mobileNo,
          contactNo: this.user.contactNo
        });
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Error loading profile from API:', error);
        this.loadFromCachedData();
        this.isLoading = false;
      }
    });
  }

  private loadFromCachedData(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = {
        ...currentUser,
        contactNo: currentUser.contactNo || '',
        mobileNo: currentUser.mobileNo || '',
        created_date: currentUser.created_date || '',
        joining_date: currentUser.joining_date || ''
      };
      console.log('Loaded user from cached data:', this.user);
    } else {
      this.user.firstName = localStorage.getItem('firstName') || '';
      this.user.lastName = localStorage.getItem('lastName') || '';
      this.user.email = localStorage.getItem('userEmail') || '';
      this.user.mobileNo = localStorage.getItem('mobileNo') || '';
      this.user.contactNo = localStorage.getItem('contactNo') || '';
      this.user.role.roleName = localStorage.getItem('roleName') || '';
    }
  }

  onSave(): void {
    console.log('=== DEBUG: onSave() called ===');
    console.log('User object before validation:', {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      mobileNo: this.user.mobileNo,
      contactNo: this.user.contactNo
    });
    
    this.isFormSubmitted = true;
    this.errorMessage = '';
    
    // Validate required fields
    if (!this.user.firstName?.trim()) {
      this.errorMessage = 'First name is required';
      return;
    }

    if (!this.user.email?.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email.trim())) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    // Validate contact number (required, 10 digits)
    const cleanContactNo = this.user.contactNo?.replace(/\D/g, '') || '';
    if (!cleanContactNo) {
      this.errorMessage = 'Contact number is required';
      return;
    }

    if (cleanContactNo.length !== 10) {
      this.errorMessage = 'Contact number must be exactly 10 digits';
      return;
    }

    // Update user object with cleaned contact number
    this.user.contactNo = cleanContactNo;

    // Validate password change
    const isChangingPassword = this.currentPassword || this.newPassword;
    if (isChangingPassword) {
      const passwordError = this.validatePasswordChange();
      if (passwordError) {
        this.errorMessage = passwordError;
        return;
      }
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.passwordChangeSuccess = false;
    
    this.lockScroll(true);

    // Prepare update data for backend
    const updateData: any = {
      firstName: this.user.firstName.trim(),
      lastName: (this.user.lastName || '').trim(),
      email: this.user.email.trim(),
      contactNo: this.user.contactNo
    };

    console.log('=== DEBUG: Update data being sent ===');
    console.log('Update Data:', updateData);
    console.log('Sending contactNo:', updateData.contactNo);
    console.log('=== END DEBUG ===');

    // Execute updates
    if (isChangingPassword) {
      this.changePasswordAndProfile(updateData);
    } else {
      this.updateProfileOnly(updateData);
    }
  }

  private validatePasswordChange(): string | null {
    // Both fields required for password change
    if (!this.currentPassword) {
      return 'Current password is required';
    }

    if (!this.newPassword) {
      return 'New password is required';
    }

    if (this.newPassword.length < 8) {
      return 'New password must be at least 8 characters long';
    }

    // Password strength validation
    const hasLetter = /[A-Za-z]/.test(this.newPassword);
    const hasNumber = /\d/.test(this.newPassword);
    
    if (!hasLetter || !hasNumber) {
      return 'Password must contain at least one letter and one number';
    }

    return null;
  }

  private changePasswordAndProfile(profileData: any): void {
    console.log('Changing password...');
    
    this.authService.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: (passwordResponse) => {
        console.log('✅ Password change successful:', passwordResponse);
        this.passwordChangeSuccess = true;
        
        this.updateProfileOnly(profileData);
      },
      error: (err) => {
        console.error('❌ Password change failed:', err);
        this.isLoading = false;
        this.lockScroll(false);
        
        this.handlePasswordError(err);
      }
    });
  }

  private handlePasswordError(err: any): void {
  console.error('❌ Password change failed:', err);
  this.isLoading = false;
  this.lockScroll(false);
  
  // Specific error messages for password failures
  if (err.status === 400 || err.message?.toLowerCase().includes('current password')) {
    this.errorMessage = err.message || 'Current password is incorrect';
  } else if (err.status === 401) {
    // For password change, 401 means wrong password, not session expired
    if (err.message?.toLowerCase().includes('current password') || 
        err.message?.toLowerCase().includes('incorrect')) {
      this.errorMessage = 'Current password is incorrect';
    } else {
      this.errorMessage = 'Session expired. Please login again.';
      setTimeout(() => this.router.navigate(['/login']), 2000);
    }
  } else if (err.status === 422) {
    this.errorMessage = 'New password does not meet security requirements';
  } else {
    this.errorMessage = err.message || 'Failed to change password. Please try again.';
  }
  
  // Clear password fields on error
  this.currentPassword = '';
  this.newPassword = '';
  
  setTimeout(() => {
    this.errorMessage = '';
  }, 5000);
}

  private updateProfileOnly(profileData: any): void {
    console.log('Updating profile with data:', profileData);
    
    this.authService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        console.log('✅ Profile update successful:', updatedUser);
        console.log('Updated contactNo:', updatedUser.contactNo);
        
        // Update local user data
        if (updatedUser) {
          this.user = { ...this.user, ...updatedUser };
          
          // Update localStorage
          localStorage.setItem('firstName', this.user.firstName);
          localStorage.setItem('lastName', this.user.lastName || '');
          localStorage.setItem('userEmail', this.user.email);
          if (this.user.contactNo) {
            localStorage.setItem('contactNo', this.user.contactNo);
          }
        }
        
        this.completeSave();
      },
      error: (err) => {
        this.handleProfileError(err);
      }
    });
  }

  private handleProfileError(err: any): void {
    console.error('❌ Profile update failed:', err);
    this.isLoading = false;
    this.lockScroll(false);
    
    if (err.status === 400) {
      if (err.error?.message?.toLowerCase().includes('email already')) {
        this.errorMessage = 'Email already exists. Please use a different email.';
      } else if (err.error?.message?.toLowerCase().includes('contact number already')) {
        this.errorMessage = 'Contact number already in use. Please use a different number.';
      } else {
        this.errorMessage = err.error?.message || 'Invalid data provided';
      }
    } else if (err.status === 409) {
      this.errorMessage = 'Email already exists. Please use a different email.';
    } else if (err.status === 500) {
      this.errorMessage = 'Server error. Please try again later.';
    } else {
      this.errorMessage = err.message || 'Failed to update profile. Please try again.';
    }
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  private completeSave(): void {
    this.isLoading = false;
    this.saveSuccess = true;
    this.isFormSubmitted = false;
    this.clearPasswordFields();
    
    this.lockScroll(false);
    
    setTimeout(() => {
      this.saveSuccess = false;
      this.passwordChangeSuccess = false;
    }, 4000);
  }

  private clearPasswordFields(): void {
    this.currentPassword = '';
    this.newPassword = '';
  }

  private lockScroll(lock: boolean): void {
    if (lock) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
    } else {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
  }

  // Helper methods for template
  getUserInitial(): string {
    if (this.user.firstName) {
      const first = this.user.firstName.substring(0, 1).toUpperCase();
      const last = this.user.lastName ? this.user.lastName.substring(0, 1).toUpperCase() : '';
      return first + last;
    }
    return 'US';
  }

  getUserRole(): string {
    return this.user.role?.roleName || 'User';
  }

  getJoiningDate(): string {
    return this.formatDate(this.user.joining_date);
  }

  getMemberSince(): string {
    return this.formatDate(this.user.created_date);
  }

  private formatDate(dateString?: string): string {
    if (!dateString) return 'Not available';
    
    try {
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else if (dateString.includes('-')) {
        date = new Date(dateString.replace(/-/g, '/'));
      } else {
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) {
        return 'Not available';
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Not available';
    }
  }

  // Form validation helper
  isFormValid(): boolean {
    if (!this.user.firstName?.trim() || 
        !this.user.email?.trim() || 
        !this.user.contactNo?.trim()) {
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.user.email.trim())) {
      return false;
    }

    const cleanContactNo = this.user.contactNo.replace(/\D/g, '');
    if (cleanContactNo.length !== 10) {
      return false;
    }

    return true;
  }

  // Input validation for contact number
  validateNumber(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    
    if (
      (charCode < 48 || charCode > 57) &&
      charCode !== 8 &&
      charCode !== 9 &&
      charCode !== 46 &&
      (charCode < 37 || charCode > 40)
    ) {
      event.preventDefault();
      return false;
    }
    
    return true;
  }

  formatContactNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.length > 10) {
      value = value.substring(0, 10);
    }
    
    this.user.contactNo = value;
    event.target.value = value;
  }

  goback(): void {
    if (!this.isLoading) {
      this.router.navigate(['/dashboard']);
    }
  }
}