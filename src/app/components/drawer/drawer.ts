import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './drawer.html',
})
export class Drawer {
  @Input() isLoggedIn: boolean | null = false;
  @Output() closeDrawer = new EventEmitter<void>();
  @Output() openSearch = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();
}
