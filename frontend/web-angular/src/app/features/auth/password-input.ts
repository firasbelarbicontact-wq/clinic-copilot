import { Component, computed, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';

@Component({
  selector: 'app-password-input',
  imports: [ReactiveFormsModule, Icon],
  template: `
    <div class="relative">
      <input
        [id]="inputId()"
        [type]="show() ? 'text' : 'password'"
        [attr.autocomplete]="autocomplete()"
        class="field h-11 pr-11"
        [formControl]="control()"
      />
      <button
        type="button"
        class="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-primary"
        [attr.aria-label]="show() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
        (click)="show.set(!show())"
      >
        <app-icon [icon]="show() ? EyeOff : Eye" [size]="16" />
      </button>
    </div>
  `,
})
export class PasswordInput {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input.required<string>();
  readonly autocomplete = input('current-password');

  protected readonly Eye = LucideEye;
  protected readonly EyeOff = LucideEyeOff;
  protected readonly show = signal(false);
}

const LEVELS = [
  { label: 'Très faible', bar: 'bg-destructive' },
  { label: 'Faible', bar: 'bg-destructive' },
  { label: 'Moyen', bar: 'bg-warning' },
  { label: 'Bon', bar: 'bg-tertiary' },
  { label: 'Excellent', bar: 'bg-success' },
];

export function passwordStrength(v: string): number {
  if (!v) return 0;
  let s = 0;
  if (v.length >= 8) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 12) s++;
  return s;
}

@Component({
  selector: 'app-password-strength',
  template: `
    <div class="mt-2" aria-live="polite">
      <div class="flex gap-1">
        @for (i of bars; track i) {
          <span class="h-1.5 flex-1 rounded-full" [class]="i <= score() ? level().bar : 'bg-muted'"></span>
        }
      </div>
      @if (value()) {
        <p class="mt-1 text-xs text-muted-foreground">
          Robustesse : <span class="font-semibold text-foreground">{{ level().label }}</span>
        </p>
      }
    </div>
  `,
})
export class PasswordStrength {
  readonly value = input('');
  protected readonly bars = [1, 2, 3, 4];
  protected readonly score = computed(() => passwordStrength(this.value()));
  protected readonly level = computed(() => LEVELS[this.score()]);
}