import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="flex items-center gap-2.5" aria-label="Clinic Copilot, accueil">
      <span class="grid h-10 w-10 shrink-0 place-items-center" [class]="dark() ? 'rounded-xl bg-card p-1' : ''">
        <img src="images/logo.png" alt="" width="695" height="572" class="h-full w-full object-contain" />
      </span>
      <span class="text-lg font-bold tracking-tight" [class]="dark() ? 'text-deep-foreground' : 'text-deep'">
        Clinic <span [class]="dark() ? 'text-tertiary' : 'text-primary'">Copilot</span>
      </span>
    </a>
  `,
})
export class Logo {
  readonly dark = input(false);
}