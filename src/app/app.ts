
import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WhatsAppButton } from '@app/shared/whatsapp-button/whatsapp-button';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WhatsAppButton, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
