import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'report-paper',
  standalone: true,
  imports: [FormsModule, CommonModule,MarkdownModule],
  templateUrl: './report-paper.component.html',
  styleUrl: './report-paper.component.css'
})
export class ReportPaperComponent {
  @Input() isEditing = false;
  @Input() patient!: any;
  @Input() measurements!: { [key: string]: string };
  @Input() findings!: string;
  @Input() summaryPoints!: string[];

  @Output() reportSaved = new EventEmitter<any>();

  onSave() {
    this.reportSaved.emit({
      patient: this.patient,
      measurements: this.measurements,
      findings: this.findings,
      summaryPoints: this.summaryPoints
    });
  }

}
