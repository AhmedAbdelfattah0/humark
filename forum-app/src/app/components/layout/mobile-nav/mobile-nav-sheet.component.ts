import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mobile-nav-sheet',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule],
  templateUrl: './mobile-nav-sheet.component.html',
  styleUrls: ['./mobile-nav-sheet.component.scss']
})
export class MobileNavSheetComponent {
  constructor(
    private bottomSheetRef: MatBottomSheetRef<MobileNavSheetComponent>,
    private router: Router
  ) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.bottomSheetRef.dismiss();
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }
}
