import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditObservationChatComponentComponent } from './audit-observation-chat-component.component';

describe('AuditObservationChatComponentComponent', () => {
  let component: AuditObservationChatComponentComponent;
  let fixture: ComponentFixture<AuditObservationChatComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditObservationChatComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditObservationChatComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
