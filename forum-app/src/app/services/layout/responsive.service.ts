import { Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveService {
  isMobile$: Observable<boolean>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.isMobile$ = this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.TabletPortrait
    ]).pipe(
      map(result => result.matches)
    );
  }
}
