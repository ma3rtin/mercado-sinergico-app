import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FaqItemComponent } from './faq-item';
import { NgIconsModule } from '@ng-icons/core';

@Component({
  standalone: true,
  imports: [FaqItemComponent],
  template: `<app-faq-item [pregunta]="'¿Cómo funciona?'">Respuesta de prueba</app-faq-item>`,
})
class HostFaq {}

describe('FaqItemComponent', () => {
  let fixture: ComponentFixture<HostFaq>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostFaq, NgIconsModule.withIcons({})],
    }).compileComponents();
    fixture = TestBed.createComponent(HostFaq);
    fixture.detectChanges();
  });

  it('muestra la pregunta recibida', () => {
    expect(fixture.nativeElement.querySelector('summary').textContent).toContain(
      '¿Cómo funciona?'
    );
  });

  it('proyecta la respuesta dentro del contenido', () => {
    expect(fixture.nativeElement.textContent).toContain('Respuesta de prueba');
  });

  it('arranca cerrado', () => {
    expect(fixture.nativeElement.querySelector('details').open).toBe(false);
  });
});
