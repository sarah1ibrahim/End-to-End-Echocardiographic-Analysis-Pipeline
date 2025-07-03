import { ReportServiceService } from './../services/report-service.service';
import { Component, inject, OnInit } from '@angular/core';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ReportPaperComponent } from './report-paper/report-paper.component';
import { SidebarService } from '../services/sidebar.service';
import { error } from 'console';
import { MarkdownModule } from 'ngx-markdown';
import { CommonModule } from '@angular/common';


declare var html2pdf: any;


@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [SidebarComponent, ReportPaperComponent,CommonModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  isSidebarCollapsed = false;
  isEditing = false;
  patient: any = {};
  measurements: { [key: string]: string } = {};
  findings !: string 
  summaryPoints: string[] = [];

  private readonly _ReportServiceService=inject(ReportServiceService)

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    this.sidebarService.isSidebarCollapsed$.subscribe((state: boolean) => {
      this.isSidebarCollapsed = state;

    this._ReportServiceService.getReportContent().subscribe({
      next:(response)=>{
        console.log("success",response.report.patient_info.patient)
        this.patient=response.report.patient_info.patient
        this.measurements=response.report.measurements
        console.log("measurements",response.report.measurements)
        this.findings=response.report.clinical_impression
        console.log("findings",this.findings)
      },
      error:(error)=>{
        console.log("fail",error)
      }
    })
    });
  
    const saved = localStorage.getItem('report');
    if (saved) {
      const data = JSON.parse(saved);
      this.patient = data.patient || {};
      // this.measurements = data.measurements || [
      //   { name: 'LVIDd', value: '', normal: '4.2 – 5.8 cm' },
      //   { name: 'LVIDs', value: '', normal: '2.0 – 4.0 cm' }
      // ];
    //   this.findings = data.findings || ['Normal LV function'];
    //   this.summaryPoints = data.summaryPoints || ['Normal study'];
    // } else {
    //   // Default values if nothing saved yet
    //   this.measurements = [
    //     { name: 'LVIDd', value: '', normal: '4.2 – 5.8 cm' },
    //     { name: 'LVIDs', value: '', normal: '2.0 – 4.0 cm' }
    //   ];
    //   this.findings = ['Normal LV function'];
    //   this.summaryPoints = ['Normal study'];
    }
  }
  

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  saveReport(): void {
    const reportData = {
      patient: this.patient,
      measurements: this.measurements,
      findings: this.findings,
      summaryPoints: this.summaryPoints
    };

    // Save locally
    localStorage.setItem('report', JSON.stringify(reportData));
    console.log('Report saved locally.');

    // Or save to API
    // this.reportService.uploadReport(reportData).subscribe(
    //   res => console.log('Uploaded to API.'),
    //   err => console.error('API error:', err)
    // );

    this.isEditing = false;
  }

  exportToPDF(): void {
    const element = document.querySelector('report-paper') as HTMLElement;
    html2pdf().from(element).save('EchoReport.pdf');
  }
  

  deleteReport(): void {
    if (confirm('Are you sure you want to delete this report?')) {
      localStorage.removeItem('report');
      this.patient = {};
      this.measurements = {};
      this.findings = "";
      this.summaryPoints = [];
      console.log('Report deleted.');
    }
  }

  handleReportSave(event: any) {
    this.patient = event.patient;
    this.measurements = event.measurements;
    this.findings = event.findings;
    this.summaryPoints = event.summaryPoints;
  }

  calcBirthDate(Bdate: string): number {
  const birthDate = new Date(Bdate);
  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    years--;
  }
  return years;
}
}
