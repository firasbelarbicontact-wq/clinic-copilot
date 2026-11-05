import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideChevronsLeft, LucideLogOut } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { Icon } from '../ui/icon';
import { Logo } from './logo';

export interface NavItem {
  label: string;
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  exact?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, Logo],
  template: `
    <div class="flex min-h-screen bg-background">
      <aside
        class="sticky top-0 hidden h-screen shrink-0 flex-col bg-deep text-deep-foreground transition-[width] duration-300 ease-out md:flex"
        [class]="collapsed() ? 'w-[76px]' : 'w-64'">
        <div class="flex h-16 items-center overflow-hidden px-4"><app-logo [dark]="true" /></div>

        <nav class="mt-4 flex-1 space-y-1 px-3" [attr.aria-label]="'Navigation ' + label()">
          @for (l of links(); track l.to) {
            <a [routerLink]="l.to" routerLinkActive #rla="routerLinkActive"
               [routerLinkActiveOptions]="{ exact: !!l.exact }"
               [title]="collapsed() ? l.label : ''" [attr.aria-current]="rla.isActive ? 'page' : null"
               class="flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200"
               [class]="rla.isActive ? 'bg-gradient-primary text-primary-foreground shadow-soft' : 'text-deep-foreground/70 hover:bg-deep-muted hover:text-deep-foreground'">
              <app-icon [icon]="l.icon" [size]="20" />
              <span class="whitespace-nowrap">{{ l.label }}</span>
            </a>
          }
        </nav>

        <div class="space-y-1 border-t border-deep-foreground/10 p-3">
          <button type="button" (click)="collapsed.set(!collapsed())"
            class="flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm text-deep-foreground/70 hover:bg-deep-muted hover:text-deep-foreground"
            [attr.aria-label]="collapsed() ? 'Déplier la barre latérale' : 'Réduire la barre latérale'">
            <span class="inline-flex transition-transform duration-300" [class.rotate-180]="collapsed()"><app-icon [icon]="Collapse" [size]="20" /></span>
            <span class="whitespace-nowrap">Réduire</span>
          </button>
          <button type="button" (click)="auth.logout()"
            class="flex w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm text-deep-foreground/70 hover:bg-destructive/20 hover:text-deep-foreground">
            <app-icon [icon]="Logout" [size]="20" />
            <span class="whitespace-nowrap">Se déconnecter</span>
          </button>
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div class="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6">
            <span class="font-semibold text-deep">{{ label() }}</span>
            <div class="flex items-center gap-3">
              <span class="hidden max-w-[220px] truncate text-sm text-muted-foreground sm:block">{{ auth.session()?.email }}</span>
              <span class="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground" aria-hidden="true">{{ initial() }}</span>
            </div>
          </div>
        </header>

        <main class="flex-1 pb-20 md:pb-0"><router-outlet /></main>
      </div>

      <nav aria-label="Navigation mobile"
        class="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        [style.grid-template-columns]="'repeat(' + links().length + ', minmax(0, 1fr))'">
        @for (l of links(); track l.to) {
          <a [routerLink]="l.to" routerLinkActive #rlb="routerLinkActive"
             [routerLinkActiveOptions]="{ exact: !!l.exact }" [attr.aria-current]="rlb.isActive ? 'page' : null"
             class="flex flex-col items-center gap-1 py-2.5 text-xs font-medium"
             [class]="rlb.isActive ? 'text-primary' : 'text-muted-foreground'">
            <app-icon [icon]="l.icon" [size]="20" />{{ l.label }}
          </a>
        }
      </nav>
    </div>
  `,
})
export class DashboardLayout {
  protected readonly auth = inject(AuthService);
  readonly links = input.required<NavItem[]>();
  readonly label = input('Espace');

  protected readonly Collapse = LucideChevronsLeft;
  protected readonly Logout = LucideLogOut;
  protected readonly collapsed = signal(false);
  protected readonly initial = computed(() => (this.auth.session()?.email?.[0] ?? '?').toUpperCase());
}