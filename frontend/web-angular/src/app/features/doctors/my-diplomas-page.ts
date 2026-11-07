import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideAward, LucideCalendar, LucideCheck, LucideClipboardList,
  LucideDownload, LucideExternalLink, LucideFileText, LucideGraduationCap,
  LucideShieldCheck, LucideTrash2, LucideUpload, LucideX,
} from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { DoctorSpaceService, MyDiploma, Verification, VERIFICATION_BADGE, VERIFICATION_LABEL } from './doctor-space.service';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

const TYPE_LABEL: Record<string, string> = {
  DIPLOMA: 'Diplôme',
  LICENSE: "Autorisation d'exercer",
  OTHER: 'Autre document',
};

const TYPE_ICON_MAP: Record<string, string> = {
  DIPLOMA: 'graduation-cap',
  LICENSE: 'shield-check',
  OTHER: 'file-text',
};

const STATUS_ICON: Record<Verification, 'check' | 'x' | 'clipboard-list'> = {
  VERIFIED: 'check',
  REJECTED: 'x',
  PENDING: 'clipboard-list',
};

@Component({
  selector: 'app-my-diplomas-page',
  imports: [ReactiveFormsModule, DatePipe, Icon, PageHeader],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-4xl space-y-6">

        <!-- En-tête -->
        <app-page-header
          title="Mes diplômes & documents"
          subtitle="Un administrateur vérifie vos documents avant la publication de votre fiche dans l'annuaire."
          eyebrow="Espace médecin"
          [icon]="IconGrad"
        />

        @if (error()) {
          <div role="alert" class="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm font-medium text-destructive">
            <app-icon [icon]="IconX" [size]="16" class="shrink-0" />
            {{ error() }}
          </div>
        }

        <!-- Statistiques rapides -->
        @if (list().length) {
          <div class="grid grid-cols-3 gap-4">
            <div class="rounded-2xl border border-border bg-card p-4 text-center shadow-soft">
              <p class="text-2xl font-bold text-deep">{{ list().length }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Document{{ list().length > 1 ? 's' : '' }} déposé{{ list().length > 1 ? 's' : '' }}</p>
            </div>
            <div class="rounded-2xl border border-success/30 bg-success/8 p-4 text-center shadow-soft">
              <p class="text-2xl font-bold text-success">{{ countByStatus('VERIFIED') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">Vérifié{{ countByStatus('VERIFIED') > 1 ? 's' : '' }}</p>
            </div>
            <div class="rounded-2xl border border-warning/30 bg-warning/8 p-4 text-center shadow-soft">
              <p class="text-2xl font-bold text-warning">{{ countByStatus('PENDING') }}</p>
              <p class="mt-1 text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        }

        <!-- Liste des diplômes -->
        <div class="rounded-2xl border border-border bg-card shadow-soft">
          <div class="border-b border-border px-6 py-4">
            <div class="flex items-center gap-3">
              <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                <app-icon [icon]="IconAward" [size]="18" class="text-primary" />
              </span>
              <div>
                <h2 class="font-semibold text-deep">Documents déposés</h2>
                <p class="text-xs text-muted-foreground">Diplômes, licences et autorisations</p>
              </div>
            </div>
          </div>

          <div class="divide-y divide-border">
            @for (d of list(); track d.id) {
              <div class="group p-5 transition-colors hover:bg-soft/30">
                <div class="flex flex-wrap items-start gap-4">

                  <!-- Icône type document -->
                  <span class="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-soft/60 shadow-sm"
                    [class]="d.status === 'VERIFIED' ? 'border-success/30 bg-success/8' : d.status === 'REJECTED' ? 'border-destructive/30 bg-destructive/8' : ''">
                    @if (d.type === 'DIPLOMA') { <app-icon [icon]="IconGrad" [size]="20" [class]="d.status === 'VERIFIED' ? 'text-success' : d.status === 'REJECTED' ? 'text-destructive' : 'text-primary'" /> }
                    @if (d.type === 'LICENSE') { <app-icon [icon]="IconShield" [size]="20" [class]="d.status === 'VERIFIED' ? 'text-success' : d.status === 'REJECTED' ? 'text-destructive' : 'text-primary'" /> }
                    @if (d.type === 'OTHER') { <app-icon [icon]="IconFile" [size]="20" [class]="d.status === 'VERIFIED' ? 'text-success' : d.status === 'REJECTED' ? 'text-destructive' : 'text-primary'" /> }
                  </span>

                  <!-- Infos principales -->
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <div class="min-w-0">
                        <p class="truncate font-semibold text-deep">{{ d.title }}</p>
                        <p class="mt-0.5 text-sm text-muted-foreground">
                          <span class="font-medium text-primary/80">{{ typeLabel(d.type) }}</span>
                          @if (d.institution) { <span class="mx-1.5 text-border">·</span>{{ d.institution }} }
                          @if (d.yearObtained) { <span class="mx-1.5 text-border">·</span>{{ d.yearObtained }} }
                        </p>
                      </div>
                      <!-- Badge statut -->
                      <span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" [class]="badge[d.status]">
                        @if (d.status === 'VERIFIED') { <app-icon [icon]="IconCheck" [size]="11" /> }
                        @if (d.status === 'PENDING') { <app-icon [icon]="IconClipboard" [size]="11" /> }
                        @if (d.status === 'REJECTED') { <app-icon [icon]="IconX" [size]="11" /> }
                        {{ label[d.status] }}
                      </span>
                    </div>

                    <!-- Méta fichier -->
                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span class="flex items-center gap-1">
                        <app-icon [icon]="IconFile" [size]="12" />
                        {{ d.originalFilename }}
                      </span>
                      <span>{{ (d.sizeBytes / 1024).toFixed(0) }} Ko</span>
                      <span class="flex items-center gap-1">
                        <app-icon [icon]="IconCal" [size]="12" />
                        Déposé le {{ d.uploadedAt | date: 'dd/MM/yyyy' }}
                      </span>
                      @if (d.reviewedAt) {
                        <span>Examiné le {{ d.reviewedAt | date: 'dd/MM/yyyy' }}</span>
                      }
                    </div>

                    <!-- Motif de refus -->
                    @if (d.rejectionReason) {
                      <div class="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/8 px-4 py-3">
                        <app-icon [icon]="IconX" [size]="14" class="mt-0.5 shrink-0 text-destructive" />
                        <p class="text-sm text-destructive"><span class="font-semibold">Motif du refus :</span> {{ d.rejectionReason }}</p>
                      </div>
                    }

                    <!-- Actions -->
                    <div class="mt-3 flex flex-wrap gap-2">
                      <button type="button" class="btn btn-soft gap-1.5 text-xs" (click)="view(d)">
                        <app-icon [icon]="IconExternal" [size]="13" />Ouvrir
                      </button>
                      @if (d.status !== 'VERIFIED') {
                        <button type="button" class="btn btn-soft gap-1.5 text-xs text-destructive hover:border-destructive/40 hover:bg-destructive/5" (click)="remove(d)">
                          <app-icon [icon]="Trash" [size]="13" />Supprimer
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <span class="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-border bg-soft/40">
                  <app-icon [icon]="IconGrad" [size]="28" class="text-muted-foreground/50" />
                </span>
                <div>
                  <p class="font-semibold text-deep">Aucun document déposé</p>
                  <p class="mt-1 text-sm text-muted-foreground">Utilisez le formulaire ci-dessous pour ajouter votre premier diplôme.</p>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Formulaire dépôt -->
        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="rounded-2xl border border-border bg-card shadow-soft">
            <div class="border-b border-border px-6 py-4">
              <div class="flex items-center gap-3">
                <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <app-icon [icon]="Upload" [size]="18" class="text-primary" />
                </span>
                <div>
                  <h2 class="font-semibold text-deep">Déposer un nouveau document</h2>
                  <p class="text-xs text-muted-foreground">PDF, JPG ou PNG · 5 Mo maximum</p>
                </div>
              </div>
            </div>

            <div class="p-6">
              <div class="grid gap-5 sm:grid-cols-2">
                <!-- Intitulé -->
                <div class="sm:col-span-2">
                  <label for="title" class="mb-1.5 block text-sm font-medium text-deep">
                    Intitulé du document <span class="text-destructive">*</span>
                  </label>
                  <input id="title" class="field h-11" placeholder="ex. Doctorat en médecine générale" formControlName="title" />
                  @if (form.controls.title.touched && form.controls.title.invalid) {
                    <p class="mt-1 text-xs font-medium text-destructive">L'intitulé est requis.</p>
                  }
                </div>

                <!-- Type -->
                <div>
                  <label for="type" class="mb-1.5 block text-sm font-medium text-deep">Type de document</label>
                  <select id="type" class="field h-11" formControlName="type">
                    <option value="DIPLOMA">Diplôme</option>
                    <option value="LICENSE">Autorisation d'exercer</option>
                    <option value="OTHER">Autre</option>
                  </select>
                </div>

                <!-- Année -->
                <div>
                  <label for="yearObtained" class="mb-1.5 block text-sm font-medium text-deep">Année d'obtention</label>
                  <div class="relative">
                    <app-icon [icon]="IconCal" [size]="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input id="yearObtained" type="number" min="1950" max="2100" class="field h-11 pl-9" placeholder="2020" formControlName="yearObtained" />
                  </div>
                </div>

                <!-- Établissement -->
                <div class="sm:col-span-2">
                  <label for="institution" class="mb-1.5 block text-sm font-medium text-deep">Établissement délivrant</label>
                  <input id="institution" class="field h-11" placeholder="ex. Faculté de Médecine de Tunis" formControlName="institution" />
                </div>
              </div>

              <!-- Zone upload fichier -->
              <div class="mt-5">
                <p class="mb-2 text-sm font-medium text-deep">Fichier <span class="text-destructive">*</span></p>
                <div class="flex flex-wrap items-center gap-3">
                  <label for="file" class="btn btn-soft cursor-pointer gap-2">
                    <app-icon [icon]="Upload" [size]="16" />
                    {{ file() ? 'Changer le fichier' : 'Choisir un fichier' }}
                  </label>
                  <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png" class="sr-only" (change)="onFile($event)" />
                  @if (file()) {
                    <div class="flex items-center gap-2 rounded-xl border border-border bg-soft/50 px-3 py-2 text-sm">
                      <app-icon [icon]="IconFile" [size]="14" class="shrink-0 text-primary" />
                      <span class="max-w-[200px] truncate font-medium text-deep">{{ file()!.name }}</span>
                      <span class="text-xs text-muted-foreground">({{ (file()!.size / 1024).toFixed(0) }} Ko)</span>
                    </div>
                  }
                </div>
                <p class="mt-2 text-xs text-muted-foreground">Formats acceptés : PDF, JPG, PNG · Taille maximale : 5 Mo</p>
                @if (fileError()) {
                  <p class="mt-1 text-xs font-medium text-destructive">{{ fileError() }}</p>
                }
              </div>

              <div class="mt-6 flex items-center justify-between border-t border-border pt-5">
                <p class="text-xs text-muted-foreground"><span class="text-destructive">*</span> Champs obligatoires</p>
                <button type="submit" class="btn btn-hero gap-2" [disabled]="busy()">
                  @if (busy()) {
                    <span class="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                    Envoi en cours…
                  } @else {
                    <app-icon [icon]="Upload" [size]="16" />
                    Envoyer le document
                  }
                </button>
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  `,
})
export class MyDiplomasPage {
  private readonly api = inject(DoctorSpaceService);

  protected readonly Download = LucideDownload;
  protected readonly Trash = LucideTrash2;
  protected readonly Upload = LucideUpload;
  protected readonly IconGrad = LucideGraduationCap;
  protected readonly IconAward = LucideAward;
  protected readonly IconShield = LucideShieldCheck;
  protected readonly IconFile = LucideFileText;
  protected readonly IconCal = LucideCalendar;
  protected readonly IconCheck = LucideCheck;
  protected readonly IconX = LucideX;
  protected readonly IconClipboard = LucideClipboardList;
  protected readonly IconExternal = LucideExternalLink;
  protected readonly badge = VERIFICATION_BADGE;
  protected readonly label = VERIFICATION_LABEL;

  protected readonly list = signal<MyDiploma[]>([]);
  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    type: ['DIPLOMA'],
    yearObtained: [''],
    institution: [''],
  });

  constructor() {
    this.reload();
  }

  protected typeLabel(t: string) {
    return TYPE_LABEL[t] ?? t;
  }

  protected countByStatus(s: Verification) {
    return this.list().filter((d) => d.status === s).length;
  }

  private reload() {
    this.api.diplomas().subscribe({
      next: (l) => this.list.set(l),
      error: () => this.error.set('Impossible de charger vos diplômes.'),
    });
  }

  protected onFile(ev: Event) {
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    this.fileError.set(null);
    if (f && !ALLOWED.includes(f.type)) {
      this.fileError.set('Format non accepté (PDF, JPG ou PNG).');
      this.file.set(null);
    } else if (f && f.size > 5 * 1024 * 1024) {
      this.fileError.set('Fichier trop volumineux (5 Mo maximum).');
      this.file.set(null);
    } else {
      this.file.set(f);
    }
  }

  protected submit() {
    if (!this.file()) this.fileError.set('Veuillez choisir un fichier.');
    if (this.form.invalid || !this.file()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const fd = new FormData();
    fd.append('file', this.file()!);
    fd.append('type', v.type);
    fd.append('title', v.title.trim());
    if (v.institution.trim()) fd.append('institution', v.institution.trim());
    if (v.yearObtained.trim()) fd.append('yearObtained', v.yearObtained.trim());

    this.busy.set(true);
    this.error.set(null);
    this.api.upload(fd).subscribe({
      next: () => {
        this.busy.set(false);
        this.form.reset({ title: '', type: 'DIPLOMA', yearObtained: '', institution: '' });
        this.file.set(null);
        this.reload();
      },
      error: (e) => {
        this.busy.set(false);
        this.error.set(e?.error?.detail ?? 'Dépôt refusé par le serveur.');
      },
    });
  }

  protected view(d: MyDiploma) {
    this.api.file(d.id).subscribe({
      next: (b) => window.open(URL.createObjectURL(new Blob([b], { type: d.contentType })), '_blank'),
      error: () => this.error.set("Impossible d'ouvrir le fichier."),
    });
  }

  protected remove(d: MyDiploma) {
    if (!confirm(`Supprimer « ${d.title} » ?`)) return;
    this.api.remove(d.id).subscribe({
      next: () => this.reload(),
      error: (e) => this.error.set(e?.error?.detail ?? 'Suppression refusée.'),
    });
  }
}