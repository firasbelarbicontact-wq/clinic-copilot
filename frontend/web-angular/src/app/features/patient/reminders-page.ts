import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideBell, LucideCalendarClock, LucidePill, LucidePlus, LucideTrash2 } from '@lucide/angular';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Icon } from '../../shared/ui/icon';
import { Panel } from '../../shared/ui/panel';
import { Switch } from './switch';
import { PatientAppointments } from './patient-appointments';
import { formatLongDate, parseLocal } from './appointment-utils';
import { loadJson, saveJson, sessionEmail } from './patient-storage';

interface Treatment { id: number; title: string; time: string; active: boolean }

@Component({
  selector: 'app-reminders-page',
  imports: [RouterLink, Icon, Panel, RevealDirective, Switch],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <div appReveal>
          <h1 class="text-2xl font-bold text-deep sm:text-3xl">Rappels</h1>
          <p class="mt-1 text-muted-foreground">Vos rappels de rendez-vous et de traitements.</p>
        </div>

        <div class="grid gap-6 lg:grid-cols-2">
          <app-panel title="Rendez-vous à venir">
            @if (svc.groups().avenir.length === 0) {
              <p class="text-sm text-muted-foreground">Aucun rendez-vous à venir.</p>
              <a routerLink="/espace-patient/medecins" class="btn btn-soft mt-3">Prendre rendez-vous</a>
            } @else {
              <ul class="space-y-3">
                @for (a of svc.groups().avenir; track a.id) {
                  <li class="flex items-center gap-3 rounded-xl border border-border p-3">
                    <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-soft text-primary"><app-icon [icon]="Cal" [size]="22" /></span>
                    <div class="min-w-0 flex-1">
                      <p class="truncate font-semibold text-deep">{{ svc.getDoctor(a.doctorId)?.name }}</p>
                      <p class="text-sm text-muted-foreground">{{ fmt(a.start) }}</p>
                    </div>
                    <span class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{{ inDays(a.start) }}</span>
                  </li>
                }
              </ul>
            }
          </app-panel>

          <app-panel title="Traitements">
            <ul class="space-y-3">
              @for (t of treatments(); track t.id) {
                <li class="flex items-center gap-3 rounded-xl border border-border p-3" [class.opacity-60]="!t.active">
                  <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-soft text-primary"><app-icon [icon]="Pill" [size]="22" /></span>
                  <div class="min-w-0 flex-1"><p class="truncate font-semibold text-deep">{{ t.title }}</p><p class="text-sm text-muted-foreground">Tous les jours à {{ t.time }}</p></div>
                  <app-switch [checked]="t.active" [label]="'Activer ' + t.title" (changed)="toggle(t.id, $event)" />
                  <button type="button" class="btn btn-ghost btn-icon text-destructive" (click)="remove(t.id)" [attr.aria-label]="'Supprimer ' + t.title"><app-icon [icon]="Trash" [size]="16" /></button>
                </li>
              }
              @if (treatments().length === 0) { <li class="text-sm text-muted-foreground">Aucun rappel de traitement.</li> }
            </ul>
            <form class="mt-4 flex flex-wrap gap-2" (submit)="$event.preventDefault(); add()">
              <input class="field min-w-0 flex-1" placeholder="Ex. : Vitamine D" aria-label="Nom du traitement" [value]="title()" (input)="title.set($any($event.target).value)" />
              <input class="field w-28" type="time" aria-label="Heure" [value]="time()" (input)="time.set($any($event.target).value)" />
              <button type="submit" class="btn btn-hero" [disabled]="!title().trim()"><app-icon [icon]="Plus" [size]="16" />Ajouter</button>
            </form>
          </app-panel>
        </div>

        <p class="flex items-center gap-2 text-sm text-muted-foreground"><app-icon [icon]="Bell" [size]="16" />Les rappels sont envoyés si vous les avez autorisés dans votre profil.</p>
      </div>
    </div>
  `,
})
export class RemindersPage {
  protected readonly svc = inject(PatientAppointments);
  protected readonly Cal = LucideCalendarClock;
  protected readonly Pill = LucidePill;
  protected readonly Plus = LucidePlus;
  protected readonly Trash = LucideTrash2;
  protected readonly Bell = LucideBell;
  protected readonly fmt = formatLongDate;
  private readonly key = `cc_treatments_${sessionEmail()}`;

  protected readonly treatments = signal<Treatment[]>(
    loadJson<{ list: Treatment[] }>(this.key, { list: [
      { id: 1, title: 'Ventoline (2 inhalations)', time: '08:00', active: true },
      { id: 2, title: 'Vitamine D', time: '12:30', active: true },
    ] }).list,
  );
  protected readonly title = signal('');
  protected readonly time = signal('08:00');
  private readonly count = computed(() => Math.max(0, ...this.treatments().map((t) => t.id)));

  private persist(list: Treatment[]): void { this.treatments.set(list); saveJson(this.key, { list }); }
  protected toggle(id: number, v: boolean): void { this.persist(this.treatments().map((t) => (t.id === id ? { ...t, active: v } : t))); }
  protected remove(id: number): void { this.persist(this.treatments().filter((t) => t.id !== id)); }
  protected add(): void {
    const t = this.title().trim().slice(0, 60);
    if (!t) return;
    this.persist([...this.treatments(), { id: this.count() + 1, title: t, time: this.time() || '08:00', active: true }]);
    this.title.set('');
  }

  protected inDays(start: string): string {
    const now = new Date();
    const diff = Math.ceil((parseLocal(start).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400000);
    return diff <= 0 ? "Aujourd'hui" : diff === 1 ? 'Demain' : `Dans ${diff} jours`;
  }
}