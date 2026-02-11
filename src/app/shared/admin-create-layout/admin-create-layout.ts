import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-create-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-create-layout.html',
})
export class AdminCreateLayoutComponent {
  titulo = input.required<string>();
}
