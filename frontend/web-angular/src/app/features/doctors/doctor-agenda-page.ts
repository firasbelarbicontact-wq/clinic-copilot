import { Component, computed, inject, signal } from '@angular/core';
import { LucideBuilding2, LucideCalendarDays, LucideCheck, LucideClock, LucideVideo, LucideX } from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { Appointment } from '../../core/mock/mock.models';
import { AppointmentCalendar } from '../../shared/ui/appointment-calendar';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { Panel } from '../../shared/ui/panel';
import { StatusBadge } from '../../shared/ui/status-badge';

@Component({
  selector: 'app-doctor-agenda-page',
  imports: [AppointmentCalendar, Icon, PageHeader, Panel, StatusBadge],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-7xl space-y-6">
        <app-page-header title="Agenda" subtitle="Votre planning et vos demandes de rendez-vous." />

        <div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-success"></span>Confirmé</span>
          <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-warning"></span>En attente</span>
          <span class="flex items-center gap-2"><span class="h-2.5 w-2.5 rounded-full bg-muted-foreground"></span>Terminé</span>
          <label class="ml-auto inline-flex cursor-pointer items-center gap-2">
            <input type="checkbox" class="h-4 w-4 accent-teal-600" [checked]="showCancelled()" (change)="showCancelled.set($any($event.target).checked)" />
            Afficher les annulés
          </label>
        </div>

        <div class="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section class="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <app-appointment-calendar [appointments]="events()" [selectedId]="selectedId()" person="patient" (eventClick)="selectedId.set($event.id)" />
          </section>

          <aside class="space-y-6 xl:sticky xl:top-24">
            @if (selected(); as a) {
              <app-panel title="Rendez-vous">
                <button panelAction type="button" class="text-sm font-semibold text-muted-foreground hover:text-deep" (click)="selectedId.set(null)">Fermer</button>
                <div class="flex items-center gap-4">
                  <span class="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-primary text-lg font-bold text-primary-foreground">{{ ini(a.patientName) }}</span>
                  <div class="min-w-0">
                    <p class="truncate text-lg font-bold text-deep">{{ a.patientName }}</p>
                    <app-status-badge [status]="a.status" />
                  </div>
                </div>
                <dl class="mt-5 space-y-3 text-sm">
                  <div class="flex items-center gap-3"><dt class="text-muted-foreground"><app-icon [icon]="Calendar" [size]="16" /></dt><dd class="font-medium text-deep">{{ heading(a.start) }}</dd></div>
                  <div class="flex items-center gap-3"><dt class="text-muted-foreground"><app-icon [icon]="Clock" [size]="16" /></dt><dd class="font-medium text-deep">{{ time(a.start) }} · {{ a.durationMin }} min</dd></div>
                  <div class="flex items-center gap-3"><dt class="text-muted-foreground"><app-icon [icon]="a.mode === 'VIDEO' ? Video : Building" [size]="16" /></dt><dd class="font-medium text-deep">{{ a.mode === 'VIDEO' ? 'Téléconsultation' : 'Au cabinet' }}</dd></div>
                </dl>
                <p class="mt-4 rounded-xl bg-soft/60 p-3 text-sm leading-relaxed text-muted-foreground"><span class="font-semibold text-deep">Motif :</span> {{ a.reason }}</p>

                <div class="mt-5 flex flex-wrap gap-2">
                  @if (a.status === 'PENDING') {
                    <button type="button" class="btn btn-hero" (click)="set(a, 'CONFIRMED')"><app-icon [icon]="Check" [size]="16" />Confirmer</button>
                    <button type="button" class="btn btn-soft" (click)="set(a, 'CANCELLED')"><app-icon [icon]="X" [size]="16" />Refuser</button>
                  } @else if (a.status === 'CONFIRMED') {
                    <button type="button" class="btn btn-hero" (click)="set(a, 'COMPLETED')"><app-icon [icon]="Check" [size]="16" />Marquer terminé</button>
                    <button type="button" class="btn btn-soft" (click)="set(a, 'CANCELLED')">Annuler</button>
                  }
                </div>
              </app-panel>
            }

            <app-panel title="Demandes en attente">
              @if (pending().length) {
                <ul class="space-y-3">
                  @for (a of pending(); track a.id) {
                    <li class="rounded-xl bg-soft/60 p-3">
                      <button type="button" class="block w-full text-left" (click)="selectedId.set(a.id)">
                        <p class="font-semibold text-deep">{{ a.patientName }}</p>
                        <p class="text-sm text-muted-foreground">{{ heading(a.start) }} · {{ time(a.start) }}</p>
                      </button>
                      <div class="mt-3 flex gap-2">
                        <button type="button" class="btn btn-hero" (click)="set(a, 'CONFIRMED')"><app-icon [icon]="Check" [size]="16" />Confirmer</button>
                        <button type="button" class="btn btn-soft" (click)="set(a, 'CANCELLED')"><app-icon [icon]="X" [size]="16" />Refuser</button>
                      </div>
                    </li>
                  }
                </ul>
              } @else {
                <p class="text-sm text-muted-foreground">Aucune demande en attente.</p>
              }
            </app-panel>
          </aside>
        </div>
      </div>
    </div>
  `,
})
export class DoctorAgendaPage {
  private readonly store = inject(MockStore);

  protected readonly Calendar = LucideCalendarDays;
  protected readonly Clock = LucideClock;
  protected readonly Check = LucideCheck;
  protected readonly X = LucideX;
  protected readonly Video = LucideVideo;
  protected readonly Building = LucideBuilding2;

  protected readonly ini = initials;
  protected readonly time = timeLabel;
  protected readonly heading = dayHeading;

  protected readonly showCancelled = signal(false);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly events = computed(() =>
    this.store.doctorAppointments().filter((a) => this.showCancelled() || a.status !== 'CANCELLED'));
  protected readonly pending = computed(() => this.store.doctorAppointments().filter((a) => a.status === 'PENDING'));
  protected readonly selected = computed(() => this.store.doctorAppointments().find((a) => a.id === this.selectedId()) ?? null);

  protected set(a: Appointment, status: Appointment['status']) {
    this.store.setStatus(a.id, status);
  }
}