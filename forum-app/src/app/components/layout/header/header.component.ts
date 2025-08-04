import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
 import { MobileNavSheetComponent } from '../mobile-nav/mobile-nav-sheet.component';
import { AuthService } from '../../../services/auth.service';
import { LayoutService } from '../../../services/layout/layout.service';
 @Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  imageLoaded = false;
  imageError = false;
  unreadCount = 0;
  notifications: Notification[] = [];
  isMobile = false;

  constructor(
    private authService: AuthService,
    private layoutService: LayoutService,
    private router: Router,
     private bottomSheet: MatBottomSheet
  ) {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isMobile = window.innerWidth < 768; // Breakpoint for mobile devices
  }

  ngOnInit(): void {

  }

  handleNotificationClick(notification: Notification): void {

  }

  viewAllNotifications(): void {
    // Navigate to notifications page or show all notifications
    this.router.navigate(['/notifications']);
  }

  toggleSideNav(): void {
    if (this.isMobile) {
      this.openMobileNav();
    } else {
      this.layoutService.toggleSideNav();
    }
  }

  private openMobileNav(): void {
    this.bottomSheet.open(MobileNavSheetComponent, {
      panelClass: 'mobile-nav-sheet'
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  handleImageError(event: Event) {
    this.imageError = true;
    this.imageLoaded = true;
    console.error('Error loading logo:', event);
  }

  onImageLoad() {
    this.imageLoaded = true;
    this.imageError = false;
  }


}
