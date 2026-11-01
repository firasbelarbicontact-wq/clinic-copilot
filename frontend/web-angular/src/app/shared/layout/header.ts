import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMenu, LucideX } from '@lucide/angular';
import { Icon } from '../ui/icon';
import { Logo } from './logo';
import { navLinks } from '../../features/landing/landing.data';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo, Icon],
  template: `
    <header class="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <app-logo />
        <nav class="hidden items-center gap-8 lg:flex" aria-label="Navigation principale">
          @for (l of links; track l.fragment) {
            <a routerLink="/" [fragment]="l.fragment" class="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary">{{ l.label }}</a>
          }
          <a routerLink="/medecins" class="text-sm font-semibold text-destructive transition-opacity duration-200 hover:opacity-80">Médecins</a>
        </nav>
        <div class="hidden items-center gap-2 lg:flex">
          <a routerLink="/connexion" class="btn btn-ghost">Se connecter</a>
          <a routerLink="/inscription" class="btn btn-hero">Commencer</a>
        </div>
        <button type="button" class="btn btn-ghost btn-icon lg:hidden" (click)="open.set(!open())"
                [attr.aria-label]="open() ? 'Fermer le menu' : 'Ouvrir le menu'" [attr.aria-expanded]="open()">
          <app-icon [icon]="open() ? X : Menu" [size]="20" />
        </button>
      </div>
      @if (open()) {
        <div class="border-t border-border bg-background px-4 pb-6 pt-2 lg:hidden">
          <nav class="flex flex-col" aria-label="Navigation mobile">
            @for (l of links; track l.fragment) {
              <a routerLink="/" [fragment]="l.fragment" (click)="open.set(false)" class="rounded-lg px-3 py-3 font-medium text-foreground hover:bg-soft">{{ l.label }}</a>
            }
            <a routerLink="/medecins" (click)="open.set(false)" class="rounded-lg px-3 py-3 font-semibold text-destructive hover:bg-soft">Médecins</a>
          </nav>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <a routerLink="/connexion" class="btn btn-soft">Se connecter</a>
            <a routerLink="/inscription" class="btn btn-hero">Commencer</a>
          </div>
        </div>
      }
    </header>
  `,
})
export class Header {
  protected readonly links = navLinks;
  protected readonly open = signal(false);
  protected readonly Menu = LucideMenu;
  protected readonly X = LucideX;
}