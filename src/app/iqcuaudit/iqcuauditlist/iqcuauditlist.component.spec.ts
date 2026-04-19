import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IqcuauditlistComponent } from './iqcuauditlist.component';

describe('IqcuauditlistComponent', () => {
  let component: IqcuauditlistComponent;
  let fixture: ComponentFixture<IqcuauditlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IqcuauditlistComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IqcuauditlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
