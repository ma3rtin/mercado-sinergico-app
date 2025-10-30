import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsAppButton } from './whatsapp-button';

describe('WhatsAppButton', () => {
  let component: WhatsAppButton;
  let fixture: ComponentFixture<WhatsAppButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatsAppButton]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsAppButton);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
