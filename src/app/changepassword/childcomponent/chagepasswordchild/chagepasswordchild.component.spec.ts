import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChagepasswordchildComponent } from './chagepasswordchild.component';

describe('ChagepasswordchildComponent', () => {
  let component: ChagepasswordchildComponent;
  let fixture: ComponentFixture<ChagepasswordchildComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChagepasswordchildComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChagepasswordchildComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
