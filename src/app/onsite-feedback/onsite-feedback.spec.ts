import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnsiteFeedback } from './onsite-feedback';

describe('OnsiteFeedback', () => {
  let component: OnsiteFeedback;
  let fixture: ComponentFixture<OnsiteFeedback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnsiteFeedback],
    }).compileComponents();

    fixture = TestBed.createComponent(OnsiteFeedback);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
