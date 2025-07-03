import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SidebarService } from '../../app/services/sidebar.service';
import { NgClass } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { PatientListComponent } from '../patient-list/patient-list.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, NgClass],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  isSidebarCollapsed = false;

  constructor(private sidebarService: SidebarService) {
    this.sidebarService.isSidebarCollapsed$.subscribe((state) => {
      this.isSidebarCollapsed = state;
    });
  }
}