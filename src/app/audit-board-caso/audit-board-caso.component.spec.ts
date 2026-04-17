import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditBoardCasoComponent } from './audit-board-caso.component';

describe('AuditBoardCasoComponent', () => {
  let component: AuditBoardCasoComponent;
  let fixture: ComponentFixture<AuditBoardCasoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditBoardCasoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditBoardCasoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
