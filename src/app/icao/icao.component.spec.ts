import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IcaoComponent } from './icao.component';

describe('IcaoComponent', () => {
  let component: IcaoComponent;
  let fixture: ComponentFixture<IcaoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IcaoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IcaoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
