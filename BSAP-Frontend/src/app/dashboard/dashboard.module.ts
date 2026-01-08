import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { HomeComponent } from './home/home.component';
import { UsersComponent } from './users/users.component';
import { SettingsComponent } from './settings/settings.component';
import { ProfileComponent } from './profile/profile.component';
import { RoleComponent } from './role/role.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { MenusComponent } from './menus/menus.component';
import { SubmenusComponent } from './submenus/submenus.component';
import { StateComponent } from './state/state.component';
import { RangeComponent } from './range/range.component';
import { DistrictComponent } from './district/district.component';
import { UserComponent } from './user/user.component';
import { ModulesComponent } from './modules/modules.component';
import { TopicsComponent } from './topics/topics.component';
import { SubtopicsComponent } from './subtopics/subtopics.component';
import { QuestionsComponent } from './questions/questions.component';
import { ReportComponent } from './report/report.component';
import { CommunicationsComponent } from './communications/communications.component';
import { PerformanceComponent } from './performance/performance.component';
import { BattalionComponent } from './battalion/battalion.component';
import { RolePermissionComponent } from './role-permission/role-permission.component';
import { Company } from './company/company';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DashboardRoutingModule,
    DashboardComponent,
    HomeComponent,
    SettingsComponent,
    ProfileComponent,
    PerformanceComponent,
    ReportComponent,
  ],
  declarations: [
    UsersComponent,
    RoleComponent,
    PermissionsComponent,
    MenusComponent,
    SubmenusComponent,
    StateComponent,
    RangeComponent,
    DistrictComponent,
    UserComponent,
    ModulesComponent,
    TopicsComponent,
    SubtopicsComponent,
    QuestionsComponent,
    // ReportComponent,
    CommunicationsComponent,
    BattalionComponent,
    RolePermissionComponent,
    Company,
  ]
})
export class DashboardModule { }