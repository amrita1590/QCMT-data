import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IqcuAuditComponent } from './iqcu-audit.component';

describe('IqcuAuditComponent', () => {
  let component: IqcuAuditComponent;
  let fixture: ComponentFixture<IqcuAuditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IqcuAuditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IqcuAuditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
