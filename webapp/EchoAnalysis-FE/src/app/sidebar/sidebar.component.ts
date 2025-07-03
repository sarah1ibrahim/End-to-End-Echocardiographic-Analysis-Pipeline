import { Component, HostListener, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SidebarService } from '../../app/services/sidebar.service';
import { AuthService } from '../services/auth-service.service';
// import { Router } from 'express';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  isSidebarCollapsed = false;
  isMobile = false;
  isBrowser: boolean;
  private readonly _AuthService=inject(AuthService)
  // private readonly _AuthService = inject(AuthService);
  private readonly _Router = inject(Router);
  // private readonly _ToastrService = inject(ToastrService);


  constructor(
    private sidebarService: SidebarService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId); //this to remove error of  window is not defined

    if (this.isBrowser) {
      this.checkScreenSize();
      window.addEventListener('resize', () => this.checkScreenSize());
    }
// this.sidebarService.isSidebarCollapsed$.subscribe(...)
// /is just listening for changes, and every time the value changes, it automatically updates the local variable isSidebarCollapsed
    this.sidebarService.isSidebarCollapsed$.subscribe((state) => {
      this.isSidebarCollapsed = state;
    });
  }

  checkScreenSize() {
    if (this.isBrowser) {
      this.isMobile = window.innerWidth < 768;
      if (this.isMobile) {
        this.isSidebarCollapsed = true;
        this.sidebarService.toggleSidebar();
      }
    }
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }

  logout(): void {
    this._AuthService.logout();
    this._Router.navigate(['']);
    // this._ToastrService.info('Logged out successfully', 'Info');
  }

}
