import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-admin-create-wrapper',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-create-wrapper.html',
})
export class AdminCreateWrapperComponent {
  titulo = input.required<string>();
}
