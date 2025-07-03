import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  private isSidebarCollapsed = new BehaviorSubject<boolean>(false);
  isSidebarCollapsed$ = this.isSidebarCollapsed.asObservable();

  toggleSidebar() {
    this.isSidebarCollapsed.next(!this.isSidebarCollapsed.value);
  }

  getSidebarState() {
    return this.isSidebarCollapsed.value;
  }
}