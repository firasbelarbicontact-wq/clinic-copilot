import { Component, computed, inject, input, output, signal } from '@angular/core';
import { LucideCamera, LucidePencil, LucidePlus, LucideSave, LucideX } from '@lucide/angular';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { Switch } from './switch';
import { loadJson, saveJson, sessionEmail } from './patient-storage';
import { Toasts } from './toasts';

interface Profile {
  firstName: string; lastName: string; email: string; phone: string; birthDate: string;
  allergies: string[]; history: string[]; treatments: string[];
  consentAssessments: boolean; consentReminders: boolean; language: string;
  photo: string;
}

@Component({
  selector: 'app-chip-editor',
  imports: [Icon],
  template: `
    <div>
      <p class="text-sm font-medium text-deep">{{ label() }}</p>
      <ul class="mt-2 flex flex-wrap gap-2">
        @if (items().length === 0) { <li class="text-sm text-muted-foreground">Aucun élément</li> }
        @for (it of items(); track it) {
          <li class="inline-flex items-center gap-1 rounded-full bg-soft py-1 pl-3 pr-1 text-sm font-medium text-primary">
            {{ it }}
            <button type="button" (click)="remove(it)" [attr.aria-label]="'Retirer ' + it" class="grid h-5 w-5 place-items-center rounded-full hover:bg-primary/15 focus-visible:outline-2 focus-visible:outline-ring"><app-icon [icon]="X" [size]="12" /></button>
          </li>
        }
      </ul>
      <div class="mt-2 flex gap-2">
        <input class="field h-10 flex-1" [attr.aria-label]="'Ajouter : ' + label()" placeholder="Ajouter…" [value]="draft()" (input)="draft.set($any($event.target).value)" (keydown.enter)="add($event)" />
        <button type="button" class="btn btn-soft" (click)="add()"><app-icon [icon]="Plus" [size]="16" />Ajouter</button>
      </div>
    </div>
  `,
})
export class ChipEditor {
  readonly label = input.required<string>();
  readonly items = input.required<string[]>();
  readonly changed = output<string[]>();
  protected readonly X = LucideX;
  protected readonly Plus = LucidePlus;
  protected readonly draft = signal('');
  protected add(e?: Event): void {
    e?.preventDefault();
    const v = this.draft().trim().slice(0, 60);
    if (v && !this.items().includes(v)) this.changed.emit([...this.items(), v]);
    this.draft.set('');
  }
  protected remove(it: string): void { this.changed.emit(this.items().filter((x) => x !== it)); }
}

@Component({
  selector: 'app-patient-profile-page',
  imports: [Icon, Panel, RevealDirective, Switch, ChipEditor],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <div appReveal>
          <h1 class="text-2xl font-bold text-deep sm:text-3xl">Mon profil</h1>
          <p class="mt-1 text-muted-foreground">Vos informations personnelles et vos préférences.</p>
        </div>

        <app-panel title="Carte d'identité">
          <div panelAction>
            @if (editing()) {
              <div class="flex gap-2">
                <button type="button" class="btn btn-ghost" (click)="cancel()">Annuler</button>
                <button type="button" class="btn btn-hero" (click)="save()"><app-icon [icon]="Save" [size]="16" />Enregistrer</button>
              </div>
            } @else {
              <button type="button" class="btn btn-soft" (click)="edit()"><app-icon [icon]="Pencil" [size]="16" />Modifier</button>
            }
          </div>
          <div class="flex flex-col gap-6 sm:flex-row">
            <div class="flex shrink-0 flex-col items-center gap-2">
              <div class="relative">
                @if (profile().photo) {
                  <img [src]="profile().photo" alt="Photo de profil" class="h-24 w-24 rounded-full border-4 border-card object-cover shadow-soft" />
                } @else {
                  <span class="grid h-24 w-24 place-items-center rounded-full bg-gradient-primary text-3xl font-bold text-white shadow-soft">{{ initials() }}</span>
                }
                <label class="absolute -bottom-1 -right-1 grid h-9 w-9 cursor-pointer place-items-center rounded-full bg-primary text-white shadow-soft transition-transform duration-200 hover:scale-105 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring" title="Changer la photo">
                  <app-icon [icon]="Camera" [size]="16" />
                  <input type="file" accept="image/png,image/jpeg,image/webp" class="sr-only" aria-label="Changer la photo de profil" (change)="onPhoto($event)" />
                </label>
              </div>
              @if (profile().photo) {
                <button type="button" class="text-xs font-medium text-destructive hover:underline" (click)="removePhoto()">Supprimer la photo</button>
              }
            </div>
            <dl class="grid flex-1 gap-4 sm:grid-cols-2">
              @for (f of fields; track f.key) {
                <div>
                  @if (editing()) {
                    <label class="text-sm font-medium text-deep" [attr.for]="'f-' + f.key">{{ f.label }}</label>
                    <input class="field mt-1.5 w-full" [id]="'f-' + f.key" [type]="f.type" [value]="form()[f.key]" (input)="setField(f.key, $any($event.target).value)" />
                  } @else {
                    <dt class="text-sm text-muted-foreground">{{ f.label }}</dt>
                    <dd class="mt-0.5 font-semibold text-deep">{{ display(f.key) }}</dd>
                  }
                </div>
              }
            </dl>
          </div>
          @if (formError()) { <p role="alert" class="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ formError() }}</p> }
        </app-panel>

        <div class="grid gap-6 lg:grid-cols-2">
          <app-panel title="Informations de santé">
            <div class="space-y-5">
              <app-chip-editor label="Allergies" [items]="profile().allergies" (changed)="update({ allergies: $event })" />
              <app-chip-editor label="Antécédents" [items]="profile().history" (changed)="update({ history: $event })" />
              <app-chip-editor label="Traitements en cours" [items]="profile().treatments" (changed)="update({ treatments: $event })" />
            </div>
          </app-panel>
          <div class="space-y-6">
            <app-panel title="Consentement">
              <div class="space-y-4">
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm leading-snug text-deep">Autoriser l'enregistrement de mes évaluations de symptômes</span>
                  <app-switch [checked]="profile().consentAssessments" label="Évaluations de symptômes" (changed)="update({ consentAssessments: $event })" />
                </div>
                <div class="flex items-center justify-between gap-4">
                  <span class="text-sm leading-snug text-deep">Autoriser les rappels</span>
                  <app-switch [checked]="profile().consentReminders" label="Rappels" (changed)="update({ consentReminders: $event })" />
                </div>
                <p class="text-sm text-muted-foreground">Vous pouvez retirer votre consentement à tout moment.</p>
              </div>
            </app-panel>
            <app-panel title="Langue">
              <select class="field w-full" aria-label="Langue de l'application" (change)="update({ language: $any($event.target).value })">
                @for (l of languages; track l.value) {
                  <option [value]="l.value" [disabled]="!l.enabled" [selected]="profile().language === l.value">{{ l.label }}{{ l.enabled ? '' : ' (bientôt)' }}</option>
                }
              </select>
            </app-panel>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PatientProfilePage {
  private readonly toasts = inject(Toasts);
  private readonly key = `cc_patient_profile_${sessionEmail()}`;
  protected readonly Pencil = LucidePencil;
  protected readonly Save = LucideSave;
  protected readonly Camera = LucideCamera;
  protected readonly languages = [
    { value: 'fr', label: 'Français', enabled: true },
    { value: 'ar', label: 'العربية', enabled: false },
    { value: 'en', label: 'English', enabled: false },
  ];
  protected readonly fields: { key: 'firstName' | 'lastName' | 'email' | 'phone' | 'birthDate'; label: string; type: string }[] = [
    { key: 'firstName', label: 'Prénom', type: 'text' },
    { key: 'lastName', label: 'Nom', type: 'text' },
    { key: 'email', label: 'E-mail', type: 'email' },
    { key: 'phone', label: 'Téléphone', type: 'tel' },
    { key: 'birthDate', label: 'Date de naissance', type: 'date' },
  ];

  protected readonly profile = signal<Profile>(
    loadJson<Profile>(this.key, {
      firstName: 'Sarra', lastName: 'Ben Salah', email: sessionEmail(), phone: '+216 22 345 678', birthDate: '1992-04-14',
      allergies: ['Pénicilline', 'Pollen'], history: ['Asthme léger'], treatments: ['Ventoline au besoin'],
      consentAssessments: true, consentReminders: true, language: 'fr', photo: '',
    }),
  );
  protected readonly form = signal<Profile>(this.profile());
  protected readonly editing = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly initials = computed(() => `${this.profile().firstName[0] ?? ''}${this.profile().lastName[0] ?? ''}`.toUpperCase());

  protected display(k: 'firstName' | 'lastName' | 'email' | 'phone' | 'birthDate'): string {
    const v = this.profile()[k];
    if (k === 'birthDate' && v) return new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    return v || '—';
  }

  protected edit(): void { this.form.set(this.profile()); this.formError.set(null); this.editing.set(true); }
  protected cancel(): void { this.editing.set(false); }
  protected setField(k: string, v: string): void { this.form.update((f) => ({ ...f, [k]: v })); }

  protected update(patch: Partial<Profile>): void {
    this.profile.update((p) => ({ ...p, ...patch }));
    saveJson(this.key, this.profile());
  }

  protected save(): void {
    const f = this.form();
    if (!f.firstName.trim() || !f.lastName.trim()) { this.formError.set('Le prénom et le nom sont obligatoires.'); return; }
    if (!/^\S+@\S+\.\S+$/.test(f.email)) { this.formError.set('Adresse e-mail invalide.'); return; }
    this.update({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phone: f.phone.trim(), birthDate: f.birthDate });
    this.editing.set(false);
    this.toasts.success('Vos informations ont été enregistrées.');
  }

  protected onPhoto(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
      this.toasts.error('Format non supporté', 'Choisissez une image PNG, JPEG ou WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toasts.error('Image trop lourde', 'La taille maximale est de 5 Mo.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const side = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        this.update({ photo: canvas.toDataURL('image/jpeg', 0.85) });
        this.toasts.success('Photo de profil mise à jour');
      };
      img.onerror = () => this.toasts.error('Image illisible', 'Essayez un autre fichier.');
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  protected removePhoto(): void {
    this.update({ photo: '' });
    this.toasts.success('Photo supprimée');
  }
}