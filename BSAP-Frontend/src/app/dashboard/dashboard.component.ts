
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { AuthService, User } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('sidebarContainer') sidebarContainer!: ElementRef;

  ngOnInit() {
    this.loadUserMenu();
    this.loadUserData();
    document.addEventListener('click', this.handleOutsideClick);
  }

  ngAfterViewInit() {
    // Ensure initial route scroll too
    setTimeout(() => this.scrollToActiveItem(), 200);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.handleOutsideClick);
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  handleOutsideClick = (event: MouseEvent) => {
    const dropdown = document.querySelector('.user-profile-container');
    if (dropdown && !dropdown.contains(event.target as Node)) {
      this.userDropdownOpen = false;
    }
  };

  userDropdownOpen = false;

  isSidenavCollapsed = false;
  user: User | null = null;
  isLoadingMenu = true;
  menuData: any[] = [];
  expandedMenus: { [id: number]: boolean } = {};
  expandedSubmenus: { [id: number]: boolean } = {};
  expandedSubchildren: { [id: number]: boolean } = {};
  toggleUserDropdown() {
    this.userDropdownOpen = !this.userDropdownOpen;
  }

  logout() {
    // this.authService.clearAuthData();
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  toggleMenu(menuId: number) {
    const wasOpen = !!this.expandedMenus[menuId];
    Object.keys(this.expandedMenus).forEach(id => {
      this.expandedMenus[+id] = false;
    });
    // If it was open, close it; otherwise, open it
    this.expandedMenus[menuId] = !wasOpen;
  }

  toggleSubmenu(submenuId: number) {
    const wasOpen = !!this.expandedSubmenus[submenuId];
    Object.keys(this.expandedSubmenus).forEach(id => {
      this.expandedSubmenus[+id] = false;
    });
    this.expandedSubmenus[submenuId] = !wasOpen;
  }

  toggleSubchild(subchildId: number) {
    this.expandedSubchildren[subchildId] = !this.expandedSubchildren[subchildId];
  }
  private subscriptions: Subscription[] = [];

  currentUrl: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl = event.urlAfterRedirects || this.router.url;
        this.openParentsForUrl(this.currentUrl);
        this.scrollToActiveItem();
      });
  }

  //to center the topic in sidebar
  // helper used in template
  isActive(url?: string | null): boolean {
    if (!url) return false;

    const current = new URL(window.location.href);
    const target = new URL(url, window.location.origin);

    const currentParams = current.searchParams;
    const targetParams = target.searchParams;

    const targetObj: { [key: string]: string } = {};

    // Convert target search params into an object
    targetParams.forEach((value, key) => {
      targetObj[key] = value;
    });

    // If the current URL does not contain these query params → NOT active
    for (const key in targetObj) {
      if (currentParams.get(key) !== targetObj[key]) {
        return false;
      }
    }

    return true;
  }




  /** Finds the menu/submenu/subchild that matches the url and opens parent menus */
  openParentsForUrl(url: string) {
    if (!url || !this.menuData?.length) return;

    // normalize function
    const normalize = (s: string) => (s || '').toString().replace(/\/+$/, '').toLowerCase();

    const target = normalize(url);

    // Reset expansions? keep existing but ensure parents of target are open
    for (const menu of this.menuData) {
      if (menu.children && menu.children.length) {
        for (const submenu of menu.children) {
          if (submenu.children && submenu.children.length) {
            const found = submenu.children.find((sc: any) => {
              return normalize(sc.url) && target.includes(normalize(sc.url));
            });
            if (found) {
              // Expand menu and submenu to reveal the subchild
              this.expandedMenus[menu.id] = true;
              this.expandedSubmenus[submenu.id] = true;
              // we don't break everything — there could be multiple matches; keep loop
            }
          }
          // also handle direct submenu url matches
          if (submenu.url && target.includes(normalize(submenu.url))) {
            this.expandedMenus[menu.id] = true;
          }
        }
      }
    }
    // Let Angular view update
    this.cdr.detectChanges();
  }

  /** Scroll the active item into the vertical center of the sidebar container */

  private scrollToActiveItem() {
    setTimeout(() => {
      const container = this.sidebarContainer?.nativeElement;
      if (!container) {
        console.warn("Sidebar container not found");
        return;
      }

      const activeItem = container.querySelector('.active-page') as HTMLElement;

      if (!activeItem) {
        console.warn("⚠ No active-page item found for scrolling.");
        return;
      }

      activeItem.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

    }, 400); // allow Angular to render submenus
  }


  // Removed duplicate ngOnInit

  private loadUserData() {
    const userSub = this.authService.user$.subscribe(user => {
      this.user = user;
    });
    this.subscriptions.push(userSub);

    // Load user profile if not already loaded
    if (!this.user) {
      // Try to get user data from localStorage first
      const storedEmail = localStorage.getItem('email') || localStorage.getItem('userEmail');
      const storedFirstName = localStorage.getItem('firstName');
      const storedLastName = localStorage.getItem('lastName');
      const storedRoleName = localStorage.getItem('roleName');

      if (storedEmail && storedFirstName && storedRoleName) {
        // Create user object from localStorage
        this.user = {
          id: 0, // Will be updated when API loads
          firstName: storedFirstName,
          lastName: storedLastName || '',
          email: storedEmail,
          role: {
            id: 0,
            roleName: storedRoleName
          },
          permissions: []
        };
      }

      // Still try to load from API for complete data
      const profileSub = this.authService.loadUserProfile().subscribe({
        next: (user) => {
          this.user = user;
        },
        error: (error) => {
          console.error('Failed to load user profile:', error);
          // If profile loading fails and we don't have localStorage data, user might need to re-login
          if (!this.user) {
            //this.logout();
          }
        }
      });
      this.subscriptions.push(profileSub);
    }
  }

  loadUserMenu() {
    this.isLoadingMenu = true;
    const menuSub = this.apiService.get_user_menu().subscribe({
      next: (res) => {
        // Expecting res.status, res.message, res.data
        if (res.status === 'SUCCESS' && Array.isArray(res.data)) {
          this.menuData = res.data;
        } else {
          this.menuData = [];
        }
        console.log('User menu loaded:', res);
        this.isLoadingMenu = false;
      },
      error: (error) => {
        console.error('Failed to load user menu:', error);
        this.isLoadingMenu = false;
        this.menuData = [];
      }
    });
    this.subscriptions.push(menuSub);
  }

  toggleSidenav() {
    this.isSidenavCollapsed = !this.isSidenavCollapsed;
  }
  navigate(url: string) {
    if (url.includes('?')) {
      const [path, queryString] = url.split('?');
      const queryParams: { [key: string]: string } = {};

      // Parse query parameters
      if (queryString) {
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key && value) {
            queryParams[key] = decodeURIComponent(value);
          }
        });
      }
      const relativePath = path.startsWith('/') ? path.substring(1) : path;

      // Navigate with query parameters
      this.router.navigate([relativePath], {
        relativeTo: this.route,
        queryParams: queryParams
      });
    } else {

      // Remove leading slash to make it relative navigation
      const relativePath = url.startsWith('/') ? url.substring(1) : url;
      this.router.navigate([relativePath], { relativeTo: this.route });
    }
  }

  getUserDisplayName(): string {
    if (this.user?.firstName) {
      return this.user.firstName;
    }
    // Fallback to localStorage
    const firstName = localStorage.getItem('firstName');
    if (firstName) {
      return firstName;
    }
    // Fallback to email from localStorage
    const email = this.user?.email || localStorage.getItem('email') || localStorage.getItem('userEmail');
    if (email) {
      return email.split('@')[0];
    }
    return 'User';
  }

  getUserEmail(): string {
    return this.user?.email || localStorage.getItem('email') || localStorage.getItem('userEmail') || '';
  }

  getUserRole(): string {
    return this.user?.role?.roleName || localStorage.getItem('roleName') || '';
  }

  getUserAvatar(): string {
    // Return a default avatar or user's profile image
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(this.getUserDisplayName()) + '&background=6366f1&color=fff&size=40';
  }

  editProfile(): void {
    // Prevent dropdown close propagation and navigate to profile
    event?.stopPropagation();
    this.userDropdownOpen = false;
    console.log('Edit profile clicked');
    this.router.navigate(['/dashboard/profile']);
    // Add navigation logic here
  }

  widgetSettings(): void {
    event?.stopPropagation();
    this.userDropdownOpen = false;
    console.log('Widget settings clicked');
    // Add widget settings logic here
  }

  upgradeToPro(): void {
    event?.stopPropagation();
    this.userDropdownOpen = false;
    console.log('Upgrade to professional clicked');
    // Add upgrade logic here
  }

  hasRole(role: string): boolean {
    return this.authService.hasRole(role);
  }

  hasPermission(permission: string): boolean {
    return this.authService.hasPermission(permission);
  }

  // Method to handle menu item badge updates


}