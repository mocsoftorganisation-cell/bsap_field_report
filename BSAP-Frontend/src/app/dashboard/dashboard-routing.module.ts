import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { DashboardComponent } from "./dashboard.component";
import { HomeComponent } from "./home/home.component";
import { UsersComponent } from "./users/users.component";
import { SettingsComponent } from "./settings/settings.component";
import { ProfileComponent } from "./profile/profile.component";
import { RoleComponent } from "./role/role.component";
import { PermissionsComponent } from "./permissions/permissions.component";
import { MenusComponent } from "./menus/menus.component";
import { SubmenusComponent } from "./submenus/submenus.component";
import { StateComponent } from "./state/state.component";
import { RangeComponent } from "./range/range.component";
import { DistrictComponent } from "./district/district.component";
import { UserComponent } from "./user/user.component";
import { ModulesComponent } from "./modules/modules.component";
import { TopicsComponent } from "./topics/topics.component";
import { SubtopicsComponent } from "./subtopics/subtopics.component";
import { QuestionsComponent } from "./questions/questions.component";
import { ReportComponent } from "./report/report.component";
import { CommunicationsComponent } from "./communications/communications.component";
import { PerformanceComponent } from "./performance/performance.component";
import { BattalionComponent } from "./battalion/battalion.component";
import { RolePermissionComponent } from "./role-permission/role-permission.component";
import { Company } from "./company/company";

const routes: Routes = [
  {
    path: "",
    component: DashboardComponent,
    children: [
      { path: "", redirectTo: "homePage", pathMatch: "full" },
      { path: "homePage", component: HomeComponent },
      { path: "user", component: UsersComponent },
      { path: "settings", component: SettingsComponent },
      { path: "profile", component: ProfileComponent },
      { path: "role", component: RoleComponent },
      { path: "permissions", component: PermissionsComponent },
      { path: "menus", component: MenusComponent },
      { path: "submenus", component: SubmenusComponent },
      { path: "state", component: StateComponent },
      { path: "range", component: RangeComponent },
      { path: "district", component: DistrictComponent },
      { path: "userManage", component: UserComponent },
      { path: "modules", component: ModulesComponent },
      { path: "topics", component: TopicsComponent },
      { path: "subtopics", component: SubtopicsComponent },
      { path: "questions", component: QuestionsComponent },
      { path: "report", component: ReportComponent },
      { path: "communications", component: CommunicationsComponent },
      { path: "performance", component: PerformanceComponent }, // Ensure PerformanceComponent is imported
      { path: "battalion", component: BattalionComponent },
      { path: "role-permissions", component: RolePermissionComponent },
      { path: "company", component: Company },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
