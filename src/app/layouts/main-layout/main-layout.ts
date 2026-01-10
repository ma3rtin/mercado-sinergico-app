import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { Header} from '@app/components/header/header';
import { Footer } from '@app/components/footer/footer';
import { WhatsAppButton } from "@app/shared/whatsapp-button/whatsapp-button";

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, Header, Footer, WhatsAppButton],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout {

}
