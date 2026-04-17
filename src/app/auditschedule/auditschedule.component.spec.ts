import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditscheduleComponent } from './auditschedule.component';

describe('AuditscheduleComponent', () => {
  let component: AuditscheduleComponent;
  let fixture: ComponentFixture<AuditscheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditscheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditscheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
