import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuditorresponseformComponent } from './auditorresponseform.component';

describe('AuditorresponseformComponent', () => {
  let component: AuditorresponseformComponent;
  let fixture: ComponentFixture<AuditorresponseformComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditorresponseformComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuditorresponseformComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
