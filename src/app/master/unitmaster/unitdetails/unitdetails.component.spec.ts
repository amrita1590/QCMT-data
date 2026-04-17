import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitdetailsComponent } from './unitdetails.component';

describe('UnitdetailsComponent', () => {
  let component: UnitdetailsComponent;
  let fixture: ComponentFixture<UnitdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitdetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
