import { Component, input } from '@angular/core';
import { LucideBrain, LucideCalendarCheck, LucideShieldCheck } from '@lucide/angular';
import { Logo } from '../../shared/layout/logo';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-auth-shell',
  imports: [Logo, Icon],
  template: `
    <div class="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside class="relative hidden overflow-hidden bg-deep p-12 text-deep-foreground lg:flex lg:flex-col lg:justify-between">
        <div class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-tertiary/20 blur-3xl"></div>
        <div class="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary/30 blur-3xl"></div>
        <div class="relative"><app-logo [dark]="true" /></div>
        <div class="relative">
          <h2 class="text-4xl font-extrabold leading-tight tracking-tight">
            De vos symptômes, <span class="text-tertiary">vers les bons soins.</span>
          </h2>
          <ul class="mt-10 space-y-6">
            @for (p of points; track p.title) {
              <li class="flex gap-4">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-deep-muted text-tertiary">
                  <app-icon [icon]="p.icon" [size]="20" />
                </span>
                <div>
                  <p class="font-semibold">{{ p.title }}</p>
                  <p class="text-sm text-deep-foreground/70">{{ p.text }}</p>
                </div>
              </li>
            }
          </ul>
        </div>
        <p class="relative text-sm text-deep-foreground/50">L'IA oriente, le médecin décide.</p>
      </aside>

      <main class="flex items-start justify-center bg-gradient-soft px-4 py-10 sm:px-8 lg:items-center">
        <div class="w-full max-w-lg">
          <div class="mb-8 lg:hidden"><app-logo /></div>
          <h1 class="text-3xl font-bold tracking-tight text-deep">{{ title() }}</h1>
          @if (subtitle()) {
            <p class="mt-2 text-muted-foreground">{{ subtitle() }}</p>
          }
          <div class="mt-8"><ng-content></ng-content></div>
        </div>
      </main>
    </div>
  `,
})
export class AuthShell {
  readonly title = input.required<string>();
  readonly subtitle = input('');

  protected readonly points = [
    { icon: LucideBrain, title: "Orientation par l'IA", text: 'Une évaluation prudente de vos symptômes.' },
    { icon: LucideCalendarCheck, title: 'Rendez-vous faciles', text: 'Le bon médecin, au bon moment.' },
    { icon: LucideShieldCheck, title: 'Données protégées', text: 'Chiffrées et partagées avec votre accord.' },
  ];
}