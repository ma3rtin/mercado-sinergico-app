import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorVariantes } from './selector-variantes';

describe('SelectorVariantes', () => {
  let component: SelectorVariantes;
  let fixture: ComponentFixture<SelectorVariantes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorVariantes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectorVariantes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
