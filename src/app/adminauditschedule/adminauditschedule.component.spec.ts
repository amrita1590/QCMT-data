import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminauditscheduleComponent } from './adminauditschedule.component';

describe('AdminauditscheduleComponent', () => {
  let component: AdminauditscheduleComponent;
  let fixture: ComponentFixture<AdminauditscheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminauditscheduleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminauditscheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
