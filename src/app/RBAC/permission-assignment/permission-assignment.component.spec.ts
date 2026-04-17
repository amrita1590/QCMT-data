import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PermissionAssignmentComponent } from './permission-assignment.component';

describe('PermissionAssignmentComponent', () => {
  let component: PermissionAssignmentComponent;
  let fixture: ComponentFixture<PermissionAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PermissionAssignmentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PermissionAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
