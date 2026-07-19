import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginationComponent } from './paginacion';

describe('PaginationComponent', () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('totalItems', 100);
    fixture.componentRef.setInput('currentPage', 1);
    fixture.componentRef.setInput('itemsPerPage', 10);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
