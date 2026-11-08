import { Component, inject, signal } from '@angular/core';
import { LucideTrash2 } from '@lucide/angular';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { Modal } from './overlays';
import { Switch } from './switch';
import { loadJson, saveJson, sessionEmail } from './patient-storage';
import { Toasts } from './toasts';

interface Settings { emailNotif: boolean; smsNotif: boolean; reminders: boolean; marketing: boolean; shareHistory: boolean }

@Component({
  selector: 'app-settings-page',
  imports: [Icon, Panel, RevealDirective, Switch, Modal],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-3xl space-y-6">
        <div appReveal>
          <h1 class="text-2xl font-bold text-deep sm:text-3xl">Paramètres</h1>
          <p class="mt-1 text-muted-foreground">Gérez les préférences de votre compte.</p>
        </div>

        <app-panel title="Notifications">
          <div class="divide-y divide-border">
            @for (o of notifOptions; track o.key) {
              <div class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div><p class="font-medium text-deep">{{ o.label }}</p><p class="text-sm text-muted-foreground">{{ o.hint }}</p></div>
                <app-switch [checked]="s()[o.key]" [label]="o.label" (changed)="set(o.key, $event)" />
              </div>
            }
          </div>
        </app-panel>

        <app-panel title="Confidentialité">
          <div class="flex items-center justify-between gap-4">
            <div><p class="font-medium text-deep">Partager mon historique avec mes médecins</p><p class="text-sm text-muted-foreground">Facilite le suivi entre praticiens que vous avez consultés.</p></div>
            <app-switch [checked]="s().shareHistory" label="Partager mon historique" (changed)="set('shareHistory', $event)" />
          </div>
        </app-panel>

        <app-panel title="Données de démonstration">
          <p class="text-sm text-muted-foreground">Réinitialise vos rendez-vous, votre profil et vos rappels enregistrés sur cet appareil.</p>
          <button type="button" class="btn btn-ghost mt-3 text-destructive hover:bg-destructive/10" (click)="confirm.set(true)"><app-icon [icon]="Trash" [size]="16" />Réinitialiser les données</button>
        </app-panel>

        <app-modal [open]="confirm()" title="Réinitialiser les données ?" description="Les données de démonstration seront restaurées." (closed)="confirm.set(false)">
          <div modalFooter class="contents">
            <button type="button" class="btn btn-ghost" (click)="confirm.set(false)">Annuler</button>
            <button type="button" class="btn rounded-full bg-destructive text-white hover:opacity-90" (click)="reset()">Réinitialiser</button>
          </div>
        </app-modal>
      </div>
    </div>
  `,
})
export class SettingsPage {
  private readonly toasts = inject(Toasts);
  private readonly email = sessionEmail();
  private readonly key = `cc_settings_${this.email}`;
  protected readonly Trash = LucideTrash2;
  protected readonly confirm = signal(false);
  protected readonly notifOptions: { key: 'emailNotif' | 'smsNotif' | 'reminders' | 'marketing'; label: string; hint: string }[] = [
    { key: 'emailNotif', label: 'Notifications par e-mail', hint: 'Confirmations et modifications de rendez-vous.' },
    { key: 'smsNotif', label: 'Notifications par SMS', hint: 'Rappel la veille de chaque consultation.' },
    { key: 'reminders', label: 'Rappels de traitement', hint: 'Alertes pour vos prises de médicaments.' },
    { key: 'marketing', label: 'Conseils santé', hint: 'Recevoir des conseils de prévention occasionnels.' },
  ];
  protected readonly s = signal<Settings>(
    loadJson<Settings>(this.key, { emailNotif: true, smsNotif: false, reminders: true, marketing: false, shareHistory: true }),
  );

  protected set(k: keyof Settings, v: boolean): void {
    this.s.update((x) => ({ ...x, [k]: v }));
    saveJson(this.key, this.s());
  }

  protected reset(): void {
    try {
      localStorage.removeItem(`cc_appointments_${this.email}`);
      localStorage.removeItem(`cc_patient_profile_${this.email}`);
      localStorage.removeItem(`cc_treatments_${this.email}`);
      localStorage.removeItem(this.key);
    } catch { /* ignore */ }
    this.toasts.success('Données réinitialisées', 'La page va se recharger.');
    setTimeout(() => location.reload(), 900);
  }
}