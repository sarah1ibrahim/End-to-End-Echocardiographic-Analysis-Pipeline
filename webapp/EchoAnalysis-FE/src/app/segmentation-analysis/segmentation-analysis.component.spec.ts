import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SegmentationAnalysisComponent } from './segmentation-analysis.component';

describe('SegmentationAnalysisComponent', () => {
  let component: SegmentationAnalysisComponent;
  let fixture: ComponentFixture<SegmentationAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentationAnalysisComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SegmentationAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
