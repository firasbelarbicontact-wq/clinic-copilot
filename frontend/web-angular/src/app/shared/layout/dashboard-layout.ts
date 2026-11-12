import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideBell, LucideChevronsLeft, LucideLogOut, LucideUserRound } from '@lucide/angular';
import { AuthService } from '../../core/auth/auth.service';
import { MockStore } from '../../core/mock/mock-store';
import { Icon } from '../ui/icon';
import { Logo } from './logo';

export interface NavItem {
  label: string;
  to: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  exact?: boolean;
  section?: string;
}

const KEY = 'clinic-copilot.sidebar-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

@Component({
  selector: 'app-dashboard-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon, Logo],
  host: { '(document:click)': 'menuOpen.set(false)' },
  template: `
    <div class="flex min-h-screen bg-background">
      <aside
        class="sticky top-0 z-40 hidden h-screen shrink-0 flex-col bg-deep text-deep-foreground transition-[width] duration-300 ease-out md:flex"
        [class]="collapsed() ? 'w-[84px]' : 'w-72'">
        <!-- Décor -->
        <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div class="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-tertiary/25 blur-3xl"></div>
          <div class="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl"></div>
          <svg class="absolute inset-x-0 bottom-28 h-16 w-full opacity-[0.12]" viewBox="0 0 300 60" preserveAspectRatio="none">
            <path d="M0 32 H60 L68 28 L76 32 H100 L108 24 L116 32 H140 L148 34 L156 4 L166 56 L176 24 L184 32 H230 L238 29 L246 32 H300"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>

        <!-- Bouton réduire -->
        <button type="button" (click)="toggle()"
          class="absolute -right-3 top-[4.6rem] z-10 grid h-6 w-6 place-items-center rounded-full border border-border bg-card text-deep shadow-soft transition-colors hover:bg-soft"
          [attr.aria-label]="collapsed() ? 'Déplier la barre latérale' : 'Réduire la barre latérale'">
          <span class="inline-flex transition-transform duration-300" [class.rotate-180]="collapsed()"><app-icon [icon]="Collapse" [size]="14" /></span>
        </button>

        <!-- Logo -->
        <div class="flex h-16 items-center px-5" [class.justify-center]="collapsed()" [class.px-0]="collapsed()">
          @if (collapsed()) {
          <div class="w-10 overflow-hidden" title="Clinic Copilot" aria-label="Clinic Copilot">
            <app-logo [dark]="true" />
          </div>
        } @else {
          <app-logo [dark]="true" />
        }
                </div>

        <!-- Navigation -->
        <nav class="mt-2 flex-1 overflow-y-auto px-3 pb-4" [attr.aria-label]="'Navigation ' + label()">
          @for (l of links(); track l.to; let i = $index) {
            @if (l.section && l.section !== links()[i - 1]?.section) {
              @if (collapsed()) {
                <div class="mx-3 my-3 border-t border-deep-foreground/10"></div>
              } @else {
                <p class="px-3 pb-1.5 pt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-deep-foreground/40">{{ l.section }}</p>
              }
            }
            <a [routerLink]="l.to" routerLinkActive #rla="routerLinkActive"
               [routerLinkActiveOptions]="{ exact: !!l.exact }"
               [title]="collapsed() ? l.label : ''" [attr.aria-label]="l.label" [attr.aria-current]="rla.isActive ? 'page' : null"
               class="mb-1 flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
               [class]="itemClass(rla.isActive)">
              <app-icon [icon]="l.icon" [size]="20" />
              @if (!collapsed()) {
                <span class="whitespace-nowrap">{{ l.label }}</span>
              }
            </a>
          }
        </nav>

        <!-- Utilisateur -->
        <div class="border-t border-deep-foreground/10 p-3">
          @if (collapsed()) {
            <div class="flex flex-col items-center gap-2">
              <span class="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground" [title]="displayName()">{{ initial() }}</span>
              <button type="button" (click)="auth.logout()" title="Se déconnecter" aria-label="Se déconnecter"
                class="grid h-10 w-10 place-items-center rounded-xl text-deep-foreground/70 hover:bg-destructive/20 hover:text-deep-foreground">
                <app-icon [icon]="Logout" [size]="20" />
              </button>
            </div>
          } @else {
            <div class="flex items-center gap-3 rounded-2xl bg-deep-muted/60 p-3">
              <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                {{ initial() }}
                <span class="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-deep bg-success"></span>
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold">{{ displayName() }}</p>
                <p class="truncate text-xs text-deep-foreground/60">{{ label() }}</p>
              </div>
              <button type="button" (click)="auth.logout()" title="Se déconnecter" aria-label="Se déconnecter"
                class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-deep-foreground/70 hover:bg-destructive/20 hover:text-deep-foreground">
                <app-icon [icon]="Logout" [size]="18" />
              </button>
            </div>
          }
        </div>
      </aside>

      <div class="flex min-w-0 flex-1 flex-col">
        <header class="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
          <div class="flex h-14 items-center justify-between gap-3 px-4 md:h-16 md:px-6">
            <div class="flex items-center gap-3">
              <span class="font-semibold text-deep">{{ label() }}</span>
              <span class="hidden items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success sm:inline-flex">
                <span class="h-1.5 w-1.5 rounded-full bg-success"></span>En ligne
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground lg:block">{{ today }}</span>
              @if (notificationsLink(); as nl) {
                <a [routerLink]="nl" class="relative grid h-10 w-10 place-items-center rounded-full text-deep hover:bg-soft"
                   [attr.aria-label]="'Notifications, ' + store.unreadCount() + ' non lues'">
                  <app-icon [icon]="Bell" [size]="20" />
                  @if (store.unreadCount() > 0) {
                    <span class="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{{ store.unreadCount() }}</span>
                  }
                </a>
              }
              <div class="relative">
                <button type="button" (click)="$event.stopPropagation(); menuOpen.set(!menuOpen())"
                  class="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-soft focus-visible:outline-2 focus-visible:outline-ring"
                  aria-label="Menu du compte" [attr.aria-expanded]="menuOpen()">
                  <span class="grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground" aria-hidden="true">{{ initial() }}</span>
                  <span class="hidden max-w-[160px] truncate text-sm font-semibold text-deep sm:block">{{ displayName() }}</span>
                </button>
                @if (menuOpen()) {
                  <div class="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-border bg-card p-1.5 shadow-soft">
                    <p class="truncate px-3 py-2 text-xs text-muted-foreground">{{ auth.session()?.email }}</p>
                    @if (profileLink(); as pl) {
                      <a [routerLink]="pl" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-deep hover:bg-soft"><app-icon [icon]="User" [size]="16" />Mon profil</a>
                    }
                    <button type="button" (click)="auth.logout()" class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"><app-icon [icon]="Logout" [size]="16" />Se déconnecter</button>
                  </div>
                }
              </div>
            </div>
          </div>
        </header>

        <main class="bg-mesh flex-1 pb-20 md:pb-0"><router-outlet /></main>
      </div>

      <nav aria-label="Navigation mobile"
        class="fixed inset-x-0 bottom-0 z-40 grid border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        [style.grid-template-columns]="'repeat(' + mobileLinks().length + ', minmax(0, 1fr))'">
        @for (l of mobileLinks(); track l.to) {
          <a [routerLink]="l.to" routerLinkActive #rlb="routerLinkActive"
             [routerLinkActiveOptions]="{ exact: !!l.exact }" [attr.aria-current]="rlb.isActive ? 'page' : null"
             class="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
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
  protected readonly store = inject(MockStore);

  readonly links = input.required<NavItem[]>();
  readonly label = input('Espace');
  readonly profileLink = input<string | null>(null);
  readonly notificationsLink = input<string | null>(null);

  protected readonly Collapse = LucideChevronsLeft;
  protected readonly Logout = LucideLogOut;
  protected readonly Bell = LucideBell;
  protected readonly User = LucideUserRound;

  protected readonly collapsed = signal(readCollapsed());
  protected readonly menuOpen = signal(false);

  protected readonly today = (() => {
    const s = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  })();

  protected readonly initial = computed(() => (this.auth.session()?.email?.[0] ?? '?').toUpperCase());
  protected readonly displayName = computed(() => {
    const local = (this.auth.session()?.email ?? '').split('@')[0] ?? '';
    const words = local.split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1));
    return words.join(' ') || 'Utilisateur';
  });
  protected readonly mobileLinks = computed(() => this.links().slice(0, 5));

  constructor() {
    effect(() => {
      const value = this.collapsed() ? '1' : '0';
      try {
        localStorage.setItem(KEY, value);
      } catch {
        /* stockage indisponible : on ignore */
      }
    });
  }

  protected toggle() {
    this.collapsed.update((c) => !c);
  }

  protected itemClass(active: boolean): string {
    const layout = this.collapsed() ? 'justify-center px-0' : 'px-3';
    const look = active
      ? 'bg-gradient-primary text-primary-foreground shadow-soft'
      : 'text-deep-foreground/70 hover:bg-deep-muted hover:text-deep-foreground';
    return `${layout} ${look}`;
  }
}