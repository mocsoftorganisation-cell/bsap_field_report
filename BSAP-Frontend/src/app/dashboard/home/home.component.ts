import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-home',
    imports: [CommonModule],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  // user/profile information shown in header (populated from API)
  user: { name: string; email: string; contact: string; mobile: string; joiningDate?: string,userImage:string } = {
    name: '',
    email: '',
    contact: '',
    mobile: '',
    joiningDate: '',
        userImage:''

  };
users:any
  // cards shown in the dashboard grid (title + count + gradient)
  cards = [
    { title: 'Roles', count: 0, gradient: 'linear-gradient(90deg,#2dd4bf,#16a34a)' },
    { title: 'Permission', count: 0, gradient: 'linear-gradient(90deg,#fb7185,#f97316)' },
    { title: 'Menus', count: 0, gradient: 'linear-gradient(90deg,#6366f1,#06b6d4)' },
    { title: 'SubMenus', count: 0, gradient: 'linear-gradient(90deg,#f59e0b,#f97316)' },
    { title: 'State', count: 0, gradient: 'linear-gradient(90deg,#a78bfa,#c084fc)' },
    { title: 'Modules', count: 0, gradient: 'linear-gradient(90deg,#06b6d4,#60a5fa)' },
    { title: 'Zone', count: 0, gradient: 'linear-gradient(90deg,#fb7185,#ef4444)' },
    { title: 'Battalions', count: 0, gradient: 'linear-gradient(90deg,#fda4af,#fecaca)' },
    { title: 'Topic', count: 0, gradient: 'linear-gradient(90deg,#60a5fa,#93c5fd)' },
    { title: 'SubTopic', count: 0, gradient: 'linear-gradient(90deg,#0ea5a4,#075985)' },
    { title: 'Questions', count: 0, gradient: 'linear-gradient(90deg,#c084fc,#bfdbfe)' }
  ];

  isLoading = false;

  // sidebar data-entry status list
  dataStatus: { name: string; progress: string }[] = [];
  roleId: any;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadTopicsAndSubtopics();
    // this.loadOverview();
    // this.loadPerformanceStatus();
  }

  private loadTopicsAndSubtopics(): void {
    this.api.getActiveTopics().subscribe({
      next: (res) => {
        if (res && res.status === 'SUCCESS' && res.data) {
          const topicsToShow = ['Reserve Office', 'Strength & Vacancy', 'TradesMen, Ministrial, Supporting Staff'];
          this.dataStatus = res.data
            .filter(topic => topicsToShow.includes(topic.topicName))
            .map(topic => ({
              name: topic.topicName,
              progress: topic.subName || 'No subnames'
            }));
        }
      },
      error: (err) => {
        console.error('Failed to load topics', err);
      }
    });
  }

  private loadOverview(): void {
    this.isLoading = true;
    this.api.getDashboardOverview().subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res && res.status === 'SUCCESS' && res.data) {
          const d: any = res.data;

          // update cards where matching values exist in overview response
          this.cards = this.cards.map(card => {
            switch (card.title) {
              case 'Roles':
                return { ...card, count: d.roles !== undefined ? d.roles : card.count };
              case 'Permission':
                return { ...card, count: d.permissions !== undefined ? d.permissions : card.count };
              case 'Menus':
                return { ...card, count: d.menus !== undefined ? d.menus : card.count };
              case 'SubMenus':
                return { ...card, count: d.subMenus !== undefined ? d.subMenus : card.count };
              case 'State':
                return { ...card, count: d.states !== undefined ? d.states : card.count };
              case 'Modules':
                return { ...card, count: d.modules !== undefined ? d.modules : card.count };
              case 'Zone':
                return { ...card, count: d.ranges !== undefined ? d.ranges : card.count };
              case 'Battalions':
                return { ...card, count: d.battalions !== undefined ? d.battalions : card.count };
              case 'Topic':
                return { ...card, count: d.topics !== undefined ? d.topics : card.count };
              case 'SubTopic':
                return { ...card, count: d.subTopics !== undefined ? d.subTopics : card.count };
              case 'Questions':
                return { ...card, count: d.questions !== undefined ? d.questions : card.count };
              default:
                return card;
            }
          });

          // set sidebar recent performance entries using recentPerformanceCount if available
          if (d.recentPerformanceCount !== undefined) {
            const n = Math.max(0, Number(d.recentPerformanceCount));
            this.dataStatus = Array.from({ length: n }).map((_, i) => ({
              name: `Recent Perf ${i + 1}`,
              progress: '0 out of 9'
            }));
          }
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to load dashboard overview', err);
      }
    });
  }

  private loadUserProfile(): void {
    this.api.getUserSelf().subscribe({
      next: (res) => {
        if (res && res.status === 'SUCCESS' && res.data) {
          this.users = res.data;
          const d: any = res.data;
          // map incoming API fields into the header user object
          this.user.name = `${d.firstName || ''}${d.lastName ? ' ' + d.lastName : ''}`.trim();
          this.user.email = d.email || '';
          this.user.mobile = d.mobileNo || d.mobile || '';
          this.user.contact = d.contactNo || '';
          this.roleId = d.roleId || '';
                    this.user.userImage = d.userImage || '';

          // keep joining date if present (formatting can be adjusted)
          this.user.joiningDate = d.joiningDate ? new Date(d.joiningDate).toLocaleDateString() : '';

          if (d.battalion && d.battalion.battalionName) {
            localStorage.setItem("battalionName", d.battalion.battalionName);
            console.log("Saved battalion:", d.battalion.battalionName);
          }
        }
        if(this.roleId==1){
          this.loadOverview();
          this.loadPerformanceStatus();
        }
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
      }
    });
  }

  // private loadPerformanceStatus(): void {
  //   this.api.getPerformanceOverview().subscribe({
  //     next: (res) => {
  //       if (res && res.status === 'SUCCESS' && res.data) {
  //         const d: any = res.data;
  //         // if battalionStats available, map to dataStatus items
  //         if (Array.isArray(d.battalionStats) && d.battalionStats.length > 0) {
  //           this.dataStatus = d.battalionStats.map((b: any) => ({
  //             name: b.battalionName || `Battalion ${b.battalionId}`,
  //             progress: `${b.modulesWithData} of ${b.totalActiveModules}`
  //           }));
  //           return;
  //         }

  //         // Fallback: if recentPerformanceCount exists use that
  //         if (d.recentPerformanceCount !== undefined) {
  //           const n = Math.max(0, Number(d.recentPerformanceCount));
  //           this.dataStatus = Array.from({ length: n }).map((_, i) => ({
  //             name: `Recent Perf ${i + 1}`,
  //             progress: '0 out of 9'
  //           }));
  //         }
  //       }
  //     },
  //     error: (err) => {
  //       console.error('Failed to load performance overview', err);
  //     }
  //   });
  // }
    private loadPerformanceStatus(): void {
  this.api.getPerformanceOverview().subscribe({
    next: (res) => {
      if (res && res.status === 'SUCCESS' && res.data) {
        const d: any = res.data;
        
        // if battalionStats available, map to dataStatus items
        if (Array.isArray(d.battalionStats) && d.battalionStats.length > 0) {
          this.dataStatus = d.battalionStats.map((b: any) => {
            // Determine total active modules based on battalionId
            let totalActiveModules = b.totalActiveModules;
            
            // Check if battalionId is 24, 25, 26, or 27
            const specialBattalionIds = [24, 25, 26, 27];
            if (specialBattalionIds.includes(b.battalionId)) {
              totalActiveModules = 6; // Set to 6 for these specific battalions
            }
            
            return {
              name: b.battalionName || `Battalion ${b.battalionId}`,
              progress: `${b.modulesWithData} of ${totalActiveModules}`
            };
          });
          return;
        }

        // Fallback: if recentPerformanceCount exists use that
        if (d.recentPerformanceCount !== undefined) {
          const n = Math.max(0, Number(d.recentPerformanceCount));
          this.dataStatus = Array.from({ length: n }).map((_, i) => ({
            name: `Recent Perf ${i + 1}`,
            progress: '0 out of 9'
          }));
        }
      }
    },
    error: (err) => {
      console.error('Failed to load performance overview', err);
    }
  });
}
}