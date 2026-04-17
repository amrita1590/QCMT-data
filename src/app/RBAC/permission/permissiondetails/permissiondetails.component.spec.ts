import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissiondetailsComponent } from './permissiondetails.component';

describe('PermissiondetailsComponent', () => {
  let component: PermissiondetailsComponent;
  let fixture: ComponentFixture<PermissiondetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissiondetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissiondetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
