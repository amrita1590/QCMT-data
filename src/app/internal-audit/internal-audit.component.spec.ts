import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InternalAuditComponent } from './internal-audit.component';

describe('InternalAuditComponent', () => {
  let component: InternalAuditComponent;
  let fixture: ComponentFixture<InternalAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalAuditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InternalAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
