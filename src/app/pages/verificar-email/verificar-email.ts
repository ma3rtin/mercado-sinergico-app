import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario/usuario.service';
import { ToastService } from '@app/services/toast/toast.service';

@Component({
  selector: 'app-verificar-email',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './verificar-email.html',
})
export class VerificarEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private toast = inject(ToastService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.toast.error('No se encontró un enlace de activación válido.', 'Atención');
      this.router.navigate(['/login']);
      return;
    }

    this.verificar(token);
  }

  private verificar(token: string): void {
    this.usuarioService.verificarEmail(token).subscribe({
      next: (res) => {
        this.toast.success(
          res?.message || '¡Tu cuenta fue verificada con éxito! Ya podés iniciar sesión.',
          'Éxito'
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        const msg = err?.error?.message || 'El enlace de activación es inválido o venció.';
        this.toast.error(msg, 'Error');
        this.router.navigate(['/login']);
      },
    });
  }
}
