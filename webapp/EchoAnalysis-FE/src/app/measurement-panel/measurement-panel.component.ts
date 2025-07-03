import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-measurement-panel',
  standalone: true,
  imports: [],
  templateUrl: './measurement-panel.component.html',
  styleUrl: './measurement-panel.component.css'
})
export class MeasurementPanelComponent {
  @Input() measurements: { label: string; value: string }[] = [];
}
