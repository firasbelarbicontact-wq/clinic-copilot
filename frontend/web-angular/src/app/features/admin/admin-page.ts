import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideCheck, LucideDownload, LucideX } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { AdminDoctorDetail, AdminDoctorSummary, AdminService, Verification } from './admin.service';

@Component({
  selector: 'app-admin-page',
  imports: [DatePipe, FormsModule, Icon],
  template: `
    <section class="bg-gradient-soft">
      <div class="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 class="text-3xl font-bold tracking-tight text-deep">Vérification des médecins</h1>
        <p class="mt-2 text-muted-foreground">Contrôlez les diplômes avant que les médecins n'apparaissent dans l'annuaire.</p>

        <div class="mt-6 flex gap-2" role="tablist">
          @for (t of tabs; track t.value) {
            <button type="button" role="tab" class="btn" [class]="tab() === t.value ? 'btn-hero' : 'btn-soft'" (click)="load(t.value)">{{ t.label }}</button>
          }
        </div>

        <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div class="space-y-3">
            @if (loading()) { <p class="text-muted-foreground">Chargement…</p> }
            @else if (!doctors().length) {
              <p class="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">Aucun médecin dans cette liste.</p>
            }
            @for (d of doctors(); track d.id) {
              <button type="button" (click)="open(d)"
                class="w-full rounded-2xl border-2 bg-card p-4 text-left transition"
                [class]="selected()?.profile?.id === d.id ? 'border-primary shadow-soft' : 'border-border hover:border-primary/40'">
                <p class="font-semibold text-deep">Dr {{ d.firstName }} {{ d.lastName }}</p>
                <p class="text-sm text-muted-foreground">N° {{ d.licenseNumber }} · {{ d.city || '—' }}</p>
                <p class="mt-1 text-xs text-muted-foreground">Inscrit le {{ d.createdAt | date: 'dd/MM/yyyy' }} · {{ d.professionalStatus }}</p>
              </button>
            }
          </div>

          <div>
            @if (selected(); as s) {
              <div class="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 class="text-xl font-bold text-deep">Dr {{ s.profile.firstName }} {{ s.profile.lastName }}</h2>
                <p class="text-sm text-muted-foreground">N° {{ s.profile.licenseNumber }} · {{ s.profile.phone || 'Pas de téléphone' }}</p>
                <p class="text-sm text-muted-foreground">{{ s.profile.addressLine }} {{ s.profile.city }}</p>

                <h3 class="mt-6 font-semibold text-deep">Diplômes</h3>
                <ul class="mt-3 space-y-4">
                  @for (dip of s.diplomas; track dip.id) {
                    <li class="rounded-xl border border-border p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div>
                          <p class="font-medium text-deep">{{ dip.title }}</p>
                          <p class="text-xs text-muted-foreground">{{ dip.originalFilename }} · {{ (dip.sizeBytes / 1024).toFixed(0) }} Ko</p>
                        </div>
                        <span class="rounded-full px-2.5 py-1 text-xs font-semibold"
                          [class]="dip.status === 'VERIFIED' ? 'bg-success/15 text-deep' : dip.status === 'REJECTED' ? 'bg-destructive/10 text-destructive' : 'bg-warning/15 text-deep'">
                          {{ dip.status }}
                        </span>
                      </div>
                      @if (dip.rejectionReason) { <p class="mt-2 text-sm text-destructive">Motif : {{ dip.rejectionReason }}</p> }
                      <button type="button" class="btn btn-soft mt-3" (click)="view(dip.id, dip.contentType)">
                        <app-icon [icon]="Download" [size]="16" />Ouvrir le fichier
                      </button>
                      @if (dip.status === 'PENDING') {
                        <textarea class="field mt-3 h-20 py-2" placeholder="Motif (obligatoire pour un refus)" [(ngModel)]="reason"></textarea>
                        <div class="mt-3 flex gap-2">
                          <button type="button" class="btn btn-hero" [disabled]="busy()" (click)="review(dip.id, 'VERIFIED')">
                            <app-icon [icon]="Check" [size]="16" />Valider
                          </button>
                          <button type="button" class="btn btn-soft" [disabled]="busy()" (click)="review(dip.id, 'REJECTED')">
                            <app-icon [icon]="X" [size]="16" />Refuser
                          </button>
                        </div>
                      }
                    </li>
                  } @empty {
                    <li class="text-sm text-muted-foreground">Aucun diplôme déposé.</li>
                  }
                </ul>

                <div class="mt-6 border-t border-border pt-4">
                  @if (suspended()) {
                    <button type="button" class="btn btn-soft" [disabled]="busy()" (click)="setStatus('ACTIVE')">Réactiver le compte</button>
                  } @else {
                    <button type="button" class="btn btn-soft" [disabled]="busy()" (click)="setStatus('SUSPENDED')">Suspendre le compte</button>
                  }
                </div>
              </div>
            } @else {
              <p class="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Sélectionnez un médecin pour voir ses diplômes.</p>
            }

            @if (error()) { <p role="alert" class="mt-4 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ error() }}</p> }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AdminPage {
  private readonly api = inject(AdminService);

  protected readonly Check = LucideCheck;
  protected readonly X = LucideX;
  protected readonly Download = LucideDownload;
  protected readonly tabs: { value: Verification; label: string }[] = [
    { value: 'PENDING', label: 'En attente' },
    { value: 'VERIFIED', label: 'Vérifiés' },
    { value: 'REJECTED', label: 'Refusés' },
  ];

  protected readonly tab = signal<Verification>('PENDING');
  protected readonly doctors = signal<AdminDoctorSummary[]>([]);
  protected readonly selected = signal<AdminDoctorDetail | null>(null);
  protected readonly loading = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);
  protected reason = '';
  private currentStatus = '';

  constructor() {
    this.load('PENDING');
  }

  protected suspended() {
    return this.currentStatus === 'SUSPENDED';
  }

  protected load(t: Verification) {
    this.tab.set(t);
    this.selected.set(null);
    this.error.set(null);
    this.loading.set(true);
    this.api.list(t).subscribe({
      next: (p) => { this.doctors.set(p.content); this.loading.set(false); },
      error: () => { this.loading.set(false); this.error.set('Impossible de charger la liste.'); },
    });
  }

  protected open(d: AdminDoctorSummary) {
    this.error.set(null);
    this.reason = '';
    this.currentStatus = d.professionalStatus;
    this.api.get(d.id).subscribe({
      next: (det) => this.selected.set(det),
      error: () => this.error.set('Impossible de charger le médecin.'),
    });
  }

  protected view(id: string, type: string) {
    this.api.file(id).subscribe({
      next: (blob) => window.open(URL.createObjectURL(new Blob([blob], { type })), '_blank'),
      error: () => this.error.set('Impossible d\'ouvrir le fichier.'),
    });
  }

  protected review(diplomaId: string, decision: 'VERIFIED' | 'REJECTED') {
    if (decision === 'REJECTED' && !this.reason.trim()) {
      this.error.set('Indiquez un motif pour refuser le diplôme.');
      return;
    }
    this.run(this.api.review(diplomaId, decision, this.reason.trim() || undefined));
  }

  protected setStatus(status: 'ACTIVE' | 'SUSPENDED') {
    const id = this.selected()?.profile.id;
    if (!id) return;
    this.currentStatus = status;
    this.run(this.api.setStatus(id, status, this.reason.trim() || undefined));
  }

  private run(call: ReturnType<AdminService['review']>) {
    this.busy.set(true);
    this.error.set(null);
    call.subscribe({
      next: (det) => {
        this.busy.set(false);
        this.reason = '';
        this.selected.set(det);
        this.load(this.tab());
        this.selected.set(det);
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.detail ?? 'Action refusée par le serveur.');
      },
    });
  }
}