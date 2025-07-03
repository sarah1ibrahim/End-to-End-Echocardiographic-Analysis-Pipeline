import { Component, Input } from '@angular/core';
import { SegmentationAnalysisComponent } from '../segmentation-analysis/segmentation-analysis.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  @Input() name = '';
  @Input() age = 0;
  @Input() sex = '';
  @Input() date = '';
  @Input() indication = '';

}
