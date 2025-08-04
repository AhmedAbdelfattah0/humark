import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ResponsiveService } from '../../services/layout/responsive.service';
 @Injectable({
  providedIn: 'root'
})
export class LayoutService {
  private sideNavOpenSubject = new BehaviorSubject<boolean>(true);
  sideNavOpen$ = this.sideNavOpenSubject.asObservable();

  constructor(private responsiveService: ResponsiveService) {
    // Close sidenav when on mobile
    this.responsiveService.isMobile$.subscribe((isMobile: boolean) => {
      if (isMobile) {
        this.sideNavOpenSubject.next(false);
      }
    });
  }

  toggleSideNav(): void {
    this.sideNavOpenSubject.next(!this.sideNavOpenSubject.value);
  }

  getSideNavState(): boolean {
    return this.sideNavOpenSubject.value;
  }
}
