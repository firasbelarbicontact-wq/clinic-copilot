import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from './logo';
import { navLinks } from '../../features/landing/landing.data';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Logo],
  template: `
    <footer class="bg-deep text-deep-foreground">
      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <app-logo [dark]="true" />
          <p class="mt-4 text-lg font-semibold">L'IA oriente, le médecin décide.</p>
          <p class="mt-2 text-sm text-deep-foreground/60">Orientation, pas un diagnostic. En cas d'urgence, appelez le 190 (SAMU).</p>
        </div>
        <nav aria-label="Liens du pied de page">
          <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-tertiary">Découvrir</p>
          <ul class="space-y-2 text-sm">
            @for (l of links; track l.fragment) {
              <li><a routerLink="/" [fragment]="l.fragment" class="text-deep-foreground/75 hover:text-deep-foreground">{{ l.label }}</a></li>
            }
          </ul>
        </nav>
        <div>
          <p class="mb-3 text-sm font-semibold uppercase tracking-wider text-tertiary">Espaces</p>
          <ul class="space-y-2 text-sm">
            <li><a routerLink="/espace-patient" class="text-deep-foreground/75 hover:text-deep-foreground">Espace Patient</a></li>
            <li><a routerLink="/espace-medecin" class="text-deep-foreground/75 hover:text-deep-foreground">Espace Médecin</a></li>
            <li><a routerLink="/espace-admin" class="text-deep-foreground/75 hover:text-deep-foreground">Espace Administrateur</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-deep-foreground/10 py-6 text-center text-xs text-deep-foreground/50">© 2026 Clinic Copilot. Tous droits réservés.</div>
    </footer>
  `,
})
export class Footer {
  protected readonly links = navLinks;
}