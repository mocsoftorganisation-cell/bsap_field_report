import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';


// Add new interfaces for Topic and Question
interface ApiTopicResponse {
  id: number;
  topicName: string;
  description?: string;
  createdBy?: number;
  updatedBy?: number;
  active: boolean;
  created_date?: string;
  updated_date?: string;
}
interface ApiQuestionResponse {
  id: number;
  questionType: string;
  description?: string;
  createdBy?: number;
  updatedBy?: number;
  active: boolean;
  created_date?: string;
  updated_date?: string;
}



// Interface for API menu response
interface ApiMenuResponse {
  id: number;
  menuName: string;
  menuUrl: string;
  priority: number;
  createdBy: number;
  updatedBy: number;
  active: boolean;
  created_date: string;
  updated_date: string;
}

// Interface for API submenu response
interface ApiSubmenuResponse {
  id: number;
  menuId: number;
  subMenuId: number | null;
  menuName: string;
  menuUrl: string;
  priority: number;
  createdBy: number;
  updatedBy: number;
  active: boolean;
  created_date: string;
  updated_date: string;
  parentMenu: string;
}

// Interface for API permission response
interface ApiPermissionResponse {
  id: number;
  permissionName: string;
  permissionCode: string;
  permissionUrl: string;
  createdBy: number;
  updatedBy: number;
  active: boolean;
  created_date: string;
  updated_date: string;
}

// Interface for API response structure
interface MenuApiResponse {
  status: string;
  message: string;
  data: ApiMenuResponse[];
}

// Interface for submenu API response structure
interface SubmenuApiResponse {
  status: string;
  message: string;
  data: ApiSubmenuResponse[];
}

// Interface for permission API response structure
interface PermissionApiResponse {
  status: string;
  message: string;
  data: ApiPermissionResponse[];
}

// // Interface for role permissions response
// interface RolePermissionsResponse {
//   success: boolean;
//   message: string;
//   data: {
//     menu: number[];
//     SubMenu: number[];
//     RolePermission: number[];
//   };
// }

// Interface for permission structure
interface Permission {
  selected: boolean;
}

// Interface for menu item with permissions
interface MenuItem {
  id: number;
  name: string;
  description: string;
  permissions: Permission;
}

// Interface for submenu item with permissions
interface SubmenuItem {
  id: number;
  name: string;
  description: string;
  parentMenu: string;
  permissions: Permission;
}
// Interface for topic item with permissions
interface TopicItem {
  id: number;
  name: string;
  subName?: string;
  description: string;
  permissions: Permission;
}

// Interface for question item with permissions
interface QuestionItem {
  id: number;
  name: string;
  description: string;
  permissions: Permission;
}
// Interface for URL item with permissions
interface UrlItem {
  id: number;
  path: string;
  method: string;
  description: string;
  permissions: Permission;
}
// Interface for role permissions response
interface RolePermissionsResponse {
  success: boolean;
  message: string;
  data: {
    menu: number[];
    SubMenu: number[];
    Topic: number[];
    Question: number[];
    RolePermission: number[];
  };
}

@Component({
    selector: 'app-role-permission',
    templateUrl: './role-permission.component.html',
    styleUrl: './role-permission.component.css',
    standalone: false
})
export class RolePermissionComponent implements OnInit {
  
  roleId: number | null = null;
  roleName: string = '';
  
  // Data arrays for permissions
  menus: MenuItem[] = [];
  submenus: SubmenuItem[] = [];
  topics: TopicItem[] = [];
  questions: QuestionItem[] = [];
  urls: UrlItem[] = [];

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit(): void {
    // Get roleId from query parameters
    this.route.queryParams.subscribe(params => {
      if (params['roleId']) {
        this.roleId = +params['roleId']; // Convert string to number
        console.log('Role ID received:', this.roleId);
        this.loadRoleDetails();
        this.loadPermissionsData();
      }
    });
  }

  private loadRoleDetails(): void {
    if (this.roleId) {
      // Load role details to display role name
      this.apiService.getRoles(1, 100).subscribe({
        next: (response) => {
          const role = response.data?.find(r => r.id === this.roleId);
          if (role) {
            this.roleName = role.roleName;
            console.log('Role details loaded:', role);
          }
        },
        error: (err) => {
          console.error('Error loading role details:', err);
        }
      });
    }
  }

  private loadPermissionsData(): void {
    // Load all permission data first, then apply role-specific permissions
    Promise.all([
      this.loadMenusAsync(),
      this.loadSubmenusAsync(),
       this.loadTopicsAsync(),
      this.loadQuestionsAsync(),
      this.loadUrlsAsync()
    ]).then(() => {
      // After all data is loaded, apply role permissions
      this.loadRolePermissions();
    });
  }

  private loadTopicsAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getActiveTopics().subscribe({
        next: (response: any) => {
          console.log('Active topics response:', response);
          
          if (response.status === 'SUCCESS' && response.data) {
            this.topics = response.data.map((topic: any) => ({
              id: topic.id,
              name: topic.topicName,
               subName: topic.subName || '',
              description: topic.description || `Topic ID: ${topic.id}`,
              permissions: { selected: false }
            }));
             console.log('Mapped topics:', this.topics);
          } else {
            console.error('Invalid response format or no data received for topics');
            this.topics = [];
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading topics:', err);
          // Fallback dummy data for testing
          this.topics = [
            {
              id: 1,
              name: 'Mathematics',
              description: 'Math related topics',
              permissions: { selected: false }
              },
            {
              id: 2,
              name: 'Science',
              description: 'Science related topics',
              permissions: { selected: false }
            },
            {
              id: 3,
              name: 'History',
              description: 'History related topics',
              permissions: { selected: false }
            }
          ];
          resolve(); // Resolve even on error with fallback data

           }
      });
    });
  }

  private loadQuestionsAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getActiveQuestions().subscribe({
        next: (response: any) => {
          console.log('Active question types response:', response);

 if (response.status === 'SUCCESS' && response.data) {
            this.questions = response.data.map((question: any) => ({
              id: question.id,
              name: question.title || question.question || `Question ${question.id}`,
              description: question.description || question.content || `Question ID: ${question.id}`,
              permissions: { selected: false }
            }));
            
            console.log('Mapped questions:', this.questions);
          } else {
            console.error('Invalid response format or no data received for questions');
            this.questions = [];
          }
           resolve();
        },
        error: (err) => {
          console.error('Error loading question types:', err);
          // Fallback dummy data for testing
          this.questions = [
            {
              id: 1,
              name: 'Multiple Choice',
              description: 'MCQ questions',
              permissions: { selected: false }
            },
         

 ];
          resolve(); // Resolve even on error with fallback data
        }
      });
    });
  }


  // Convert existing methods to return promises for proper sequencing
  private loadMenusAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getActiveMenus().subscribe({
        next: (response) => {
          console.log('Active menus response:', response);
          
          if (response.status === 'SUCCESS' && response.data) {
            this.menus = response.data.map((menu: any) => ({
              id: menu.id,
              name: menu.menuName,
              description: `${menu.menuUrl} - Priority: ${menu.priority}`,
              permissions: { selected: false }
            }));
            
            console.log('Mapped menus:', this.menus);
          } else {
            console.error('Invalid response format or no data received');
            this.menus = [];
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading menus:', err);
          this.menus = [];
          reject(err);
        }
      });
    });
  }

  private loadSubmenusAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getActiveSubMenus().subscribe({
        next: (response) => {
          console.log('Active submenus response:', response);
          
          if (response.status === 'SUCCESS' && response.data) {
            this.submenus = response.data.map((submenu: any) => ({
              id: submenu.id,
              name: submenu.menuName,
              description: `${submenu.menuUrl} - Priority: ${submenu.priority}`,
              parentMenu: submenu.parentMenu,
              permissions: { selected: false }
            }));
            
            console.log('Mapped submenus:', this.submenus);
          } else {
            console.error('Invalid response format or no data received');
            this.submenus = [];
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading submenus:', err);
          this.submenus = [];
          reject(err);
        }
      });
    });
  }

  private loadUrlsAsync(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getActivePermissions().subscribe({
        next: (response) => {
          console.log('Active permissions response:', response);

          if (response.status === 'SUCCESS' && response.data) {
            this.urls = response.data.map((permission: any) => ({
              id: permission.id,
              path: `${permission.permissionName} - ${permission.permissionCode}`,
              method: permission.permissionUrl,
              description: permission.permissionName,
              permissions: { selected: false }
            }));

            console.log('Mapped permissions:', this.urls);
          } else {
            console.error('Invalid response format or no data received');
            this.urls = [];
          }
          resolve();
        },
        error: (err) => {
          console.error('Error loading permissions:', err);
          this.urls = [
            {
              id: 1,
              path: '/api/auth/login',
              method: 'POST',
              description: 'User login',
              permissions: { selected: false }
            },
            {
              id: 2,
              path: '/api/roles',
              method: 'GET',
              description: 'View all roles',
              permissions: { selected: false }
            },
            {
              id: 3,
              path: '/api/users',
              method: 'GET',
              description: 'View all users',
              permissions: { selected: false }
            }
          ];
          reject(err);
        }
      });
    });
  }
  
  private loadRolePermissions(): void {
    if (this.roleId) {
      this.apiService.getRolePermissions(this.roleId).subscribe({
        next: (response: any) => {
          console.log('Role permissions response:', response);
          
          if (response.success && response.data) {
            // Pre-select menus based on role permissions
            this.preselectMenuPermissions(response.data.menu);
            
            // Pre-select submenus based on role permissions
            this.preselectSubmenuPermissions(response.data.SubMenu);

              // Pre-select topics based on role permissions
            this.preselectTopicPermissions(response.data.Topic || []);
            
            // Pre-select questions based on role permissions
            this.preselectQuestionPermissions(response.data.Question || []);
            
            // Pre-select URLs/permissions based on role permissions
            this.preselectUrlPermissions(response.data.RolePermission);
            
            console.log('Role permissions applied successfully');
          }
        },
        error: (err) => {
          console.error('Error loading role permissions:', err);
        }
      });
    }
  }

  // Helper method to pre-select menu permissions
  private preselectMenuPermissions(menuIds: number[]): void {
    this.menus.forEach(menu => {
      if (menuIds.includes(menu.id)) {
        menu.permissions.selected = true;
      }
    });
  }

  // Helper method to pre-select submenu permissions
  private preselectSubmenuPermissions(submenuIds: number[]): void {
    this.submenus.forEach(submenu => {
      if (submenuIds.includes(submenu.id)) {
        submenu.permissions.selected = true;
      }
    });
  }
   // Helper method to pre-select topic permissions
  private preselectTopicPermissions(topicIds: number[]): void {
    this.topics.forEach(topic => {
      if (topicIds.includes(topic.id)) {
        topic.permissions.selected = true;
      }
    });
  }

    // Helper method to pre-select question permissions
  private preselectQuestionPermissions(questionIds: number[]): void {
    this.questions.forEach(question => {
      if (questionIds.includes(question.id)) {
        question.permissions.selected = true;
      }
    });
  }

  // Helper method to pre-select URL/permission permissions
  private preselectUrlPermissions(permissionIds: number[]): void {
    this.urls.forEach(url => {
      if (permissionIds.includes(url.id)) {
        url.permissions.selected = true;
      }
    });
  }

  // Bulk actions
  selectAllPermissions(): void {
    this.setAllPermissions(true);
  }

  deselectAllPermissions(): void {
    this.setAllPermissions(false);
  }

  private setAllPermissions(value: boolean): void {
    // Set all menu permissions
    this.menus.forEach(menu => {
      menu.permissions.selected = value;
    });

    // Set all submenu permissions
    this.submenus.forEach(submenu => {
      submenu.permissions.selected = value;
    });

    // Set all URL permissions
    this.urls.forEach(url => {
      url.permissions.selected = value;
    });
  }

  toggleAllMenus(event: any): void {
    const checked = event.target.checked;
    this.menus.forEach(menu => {
      menu.permissions.selected = checked;
    });
  }

  toggleAllSubmenus(event: any): void {
    const checked = event.target.checked;
    this.submenus.forEach(submenu => {
      submenu.permissions.selected = checked;
    });
  }

    toggleAllTopics(event: any): void {
    const checked = event.target.checked;
    this.topics.forEach(topic => {
      topic.permissions.selected = checked;
    });
  }

  toggleAllQuestions(event: any): void {
    const checked = event.target.checked;
    this.questions.forEach(question => {
      question.permissions.selected = checked;
    });
  }

  toggleAllUrls(event: any): void {
    const checked = event.target.checked;
    this.urls.forEach(url => {
      url.permissions.selected = checked;
    });
  }

  // Check methods for section-level checkboxes
  areAllMenusSelected(): boolean {
    return this.menus.length > 0 && this.menus.every(menu => 
      menu.permissions.selected
    );
  }

  areAllSubmenusSelected(): boolean {
    return this.submenus.length > 0 && this.submenus.every(submenu => 
      submenu.permissions.selected
    );
  }

  areAllTopicsSelected(): boolean {
    return this.topics.length > 0 && this.topics.every(topic => 
      topic.permissions.selected
    );
  }

  areAllQuestionsSelected(): boolean {
    return this.questions.length > 0 && this.questions.every(question => 
      question.permissions.selected
    );
  }

  areAllUrlsSelected(): boolean {
    return this.urls.length > 0 && this.urls.every(url => 
      url.permissions.selected
    );
  }

  // Permission change handler
  onPermissionChange(): void {
    // This can be used for real-time validation or updates
    console.log('Permission changed');
  }

  // Summary methods
  getSelectedPermissionsCount(): number {
    let count = 0;
    
    this.menus.forEach(menu => {
      if (menu.permissions.selected) count++;
    });

    this.submenus.forEach(submenu => {
      if (submenu.permissions.selected) count++;
    });

    this.topics.forEach(topic => {
      if (topic.permissions.selected) count++;
    });

    this.questions.forEach(question => {
      if (question.permissions.selected) count++;
    });

    this.urls.forEach(url => {
      if (url.permissions.selected) count++;
    });

    return count;
  }

  getMenuPermissionsCount(): number {
    let count = 0;
    this.menus.forEach(menu => { if (menu.permissions.selected) count++; });
    return count;
  }

  getSubmenuPermissionsCount(): number {
    let count = 0;
    this.submenus.forEach(submenu => { if (submenu.permissions.selected) count++; });
    return count;
  }

   getTopicPermissionsCount(): number {
    let count = 0;
    this.topics.forEach(topic => { if (topic.permissions.selected) count++; });
    return count;
  }

  getQuestionPermissionsCount(): number {
    let count = 0;
    this.questions.forEach(question => { if (question.permissions.selected) count++; });
    return count;
  }

  getUrlPermissionsCount(): number {
    let count = 0;
    this.urls.forEach(url => { if (url.permissions.selected) count++; });
    return count;
  }

  // Save permissions
  savePermissions(): void {
    if (!this.roleId) {
      alert('Role ID is required to save permissions');
      return;
    }

    // Collect selected menu IDs
    const selectedMenuIds = this.menus
      .filter(menu => menu.permissions.selected)
      .map(menu => menu.id);

    // Collect selected submenu IDs
    const selectedSubmenuIds = this.submenus
      .filter(submenu => submenu.permissions.selected)
      .map(submenu => submenu.id);


       // Collect selected topic IDs
    const selectedTopicIds = this.topics
      .filter(topic => topic.permissions.selected)
      .map(topic => topic.id);

    // Collect selected question IDs
    const selectedQuestionIds = this.questions
      .filter(question => question.permissions.selected)
      .map(question => question.id);

    // Collect selected permission IDs
    const selectedPermissionIds = this.urls
      .filter(url => url.permissions.selected)
      .map(url => url.id);

    // Prepare data in the required format
    const permissionsData = {
      menu: selectedMenuIds,
      SubMenu: selectedSubmenuIds,
      Topic: selectedTopicIds,
      Question: selectedQuestionIds,
      RolePermission: selectedPermissionIds
    };

    console.log('Saving permissions for Role ID:', this.roleId);
    console.log('Permissions data:', permissionsData);
     console.log('Topics to save:', selectedTopicIds);
  console.log('Questions to save:', selectedQuestionIds);

    // Call the API to save role permissions
    this.apiService.createRolePermissions(this.roleId, permissionsData).subscribe({
      next: (response) => {
        console.log('Permissions saved successfully:', response);
        alert('Permissions saved successfully!');
         this.loadRolePermissions();
      },
      error: (err) => {
        console.error('Error saving permissions:', err);
        alert('Failed to save permissions. Please try again.');
      }
    });
  }

}
