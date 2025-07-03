import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportPaperComponent } from './report-paper.component';

describe('ReportPaperComponent', () => {
  let component: ReportPaperComponent;
  let fixture: ComponentFixture<ReportPaperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportPaperComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ReportPaperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
