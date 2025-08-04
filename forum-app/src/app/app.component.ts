import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatBadgeModule } from '@angular/material/badge';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { HeaderComponent } from './components/layout/header/header.component';
import { SideNavComponent } from './components/layout/side-nav/side-nav.component';
import { LayoutService } from './services/layout/layout.service';
import { ResponsiveService } from './services/layout/responsive.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatBadgeModule,
     HeaderComponent,
    SideNavComponent,

  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('fadeInOut', [
      state('void', style({
        opacity: 0
      })),
      transition('void <=> *', animate(300)),
    ])
  ]
})
export class AppComponent {
  sidenavOpened = false;
  isAuthenticated: any;
  isSideNavOpen: any;
  isMobile: any;

  constructor(public authService: AuthService, private layoutService: LayoutService, private responsiveService: ResponsiveService) {
    this.isAuthenticated = this.authService.isAuthenticated();

    // Subscribe to sidenav state changes
    this.layoutService.sideNavOpen$.subscribe(
      isOpen => this.isSideNavOpen = isOpen
    );
    // Subscribe to responsive changes
    this.responsiveService.isMobile$.subscribe(
      isMobile => this.isMobile = isMobile
    );

  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  logout() {
    this.authService.logout();
  }
}
