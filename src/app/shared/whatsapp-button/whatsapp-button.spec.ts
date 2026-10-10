import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { WhatsAppButton } from './whatsapp-button';

describe('WhatsAppButton', () => {
  let fixture: ComponentFixture<WhatsAppButton>;
  let component: WhatsAppButton;
  let openSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [WhatsAppButton] }).compileComponents();
    fixture = TestBed.createComponent(WhatsAppButton);
    component = fixture.componentInstance;
    fixture.detectChanges();

    openSpy = vi.fn();
    vi.stubGlobal('open', openSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('abre wa.me en una pestaña nueva', () => {
    component.openWhatsApp();

    expect(openSpy).toHaveBeenCalledTimes(1);
    const [url, target] = openSpy.mock.calls[0];
    expect(url).toContain('https://wa.me/5491123053347');
    expect(target).toBe('_blank');
  });

  it('manda el mensaje predefinido codificado en la URL', () => {
    component.openWhatsApp();

    const [url] = openSpy.mock.calls[0] as [string];
    const texto = new URL(url).searchParams.get('text');
    expect(texto).toContain('estoy interesado/a en comprar');
  });
});
