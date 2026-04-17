import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditboardComponent } from './auditboard.component';

describe('AuditboardComponent', () => {
  let component: AuditboardComponent;
  let fixture: ComponentFixture<AuditboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
