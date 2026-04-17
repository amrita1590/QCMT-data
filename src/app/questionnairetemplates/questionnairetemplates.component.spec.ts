import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionnairetemplatesComponent } from './questionnairetemplates.component';

describe('QuestionnairetemplatesComponent', () => {
  let component: QuestionnairetemplatesComponent;
  let fixture: ComponentFixture<QuestionnairetemplatesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionnairetemplatesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionnairetemplatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
