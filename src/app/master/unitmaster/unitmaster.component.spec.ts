import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitmasterComponent } from './unitmaster.component';

describe('UnitmasterComponent', () => {
  let component: UnitmasterComponent;
  let fixture: ComponentFixture<UnitmasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitmasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitmasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
