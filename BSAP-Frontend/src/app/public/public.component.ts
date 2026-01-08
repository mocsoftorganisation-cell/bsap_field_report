import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-public',
    imports: [CommonModule],
    templateUrl: './public.component.html',
    styleUrls: ['./public.component.css']
})
export class PublicComponent {
  constructor(private router: Router) {}

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}