import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangepasswordpageComponent } from './changepasswordpage.component';

describe('ChangepasswordpageComponent', () => {
  let component: ChangepasswordpageComponent;
  let fixture: ComponentFixture<ChangepasswordpageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangepasswordpageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangepasswordpageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
