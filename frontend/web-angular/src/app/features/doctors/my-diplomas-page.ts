import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDownload, LucideTrash2, LucideUpload } from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { DoctorSpaceService, MyDiploma, VERIFICATION_BADGE, VERIFICATION_LABEL } from './doctor-space.service';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png'];

@Component({
  selector: 'app-my-diplomas-page',
  imports: [ReactiveFormsModule, DatePipe, Icon],
  template: `
    <section class="bg-gradient-soft min-h-full">
      <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 class="text-3xl font-bold tracking-tight text-deep">Mes diplômes</h1>
        <p class="mt-1 text-muted-foreground">Un administrateur vérifie vos documents avant la publication de votre fiche.</p>

        @if (error()) { <p role="alert" class="mt-5 rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive">{{ error() }}</p> }

        <ul class="mt-6 space-y-4">
          @for (d of list(); track d.id) {
            <li class="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-deep">{{ d.title }}</p>
                  <p class="text-sm text-muted-foreground">
                    {{ d.institution || 'Établissement non précisé' }}@if (d.yearObtained) { · {{ d.yearObtained }} }
                  </p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ d.originalFilename }} · {{ (d.sizeBytes / 1024).toFixed(0) }} Ko · déposé le {{ d.uploadedAt | date: 'dd/MM/yyyy' }}</p>
                </div>
                <span class="rounded-full px-3 py-1 text-xs font-semibold" [class]="badge[d.status]">{{ label[d.status] }}</span>
              </div>
              @if (d.rejectionReason) {
                <p class="mt-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Motif du refus : {{ d.rejectionReason }}</p>
              }
              <div class="mt-4 flex gap-2">
                <button type="button" class="btn btn-soft" (click)="view(d)"><app-icon [icon]="Download" [size]="16" />Ouvrir</button>
                @if (d.status !== 'VERIFIED') {
                  <button type="button" class="btn btn-soft" (click)="remove(d)"><app-icon [icon]="Trash" [size]="16" />Supprimer</button>
                }
              </div>
            </li>
          } @empty {
            <li class="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-muted-foreground">Aucun diplôme déposé.</li>
          }
        </ul>

        <form [formGroup]="form" (ngSubmit)="submit()" class="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft" novalidate>
          <h2 class="text-lg font-semibold text-deep">Déposer un document</h2>
          <div class="mt-4 grid gap-5 sm:grid-cols-2">
            <div class="sm:col-span-2">
              <label for="title" class="mb-1.5 block text-sm font-medium text-deep">Intitulé</label>
              <input id="title" class="field h-11" placeholder="Doctorat en médecine" formControlName="title" />
              @if (form.controls.title.touched && form.controls.title.invalid) { <p class="mt-1 text-xs font-medium text-destructive">Intitulé requis.</p> }
            </div>
            <div>
              <label for="type" class="mb-1.5 block text-sm font-medium text-deep">Type</label>
              <select id="type" class="field h-11" formControlName="type">
                <option value="DIPLOMA">Diplôme</option>
                <option value="LICENSE">Autorisation d'exercer</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>
            <div>
              <label for="yearObtained" class="mb-1.5 block text-sm font-medium text-deep">Année d'obtention</label>
              <input id="yearObtained" type="number" min="1950" max="2100" class="field h-11" formControlName="yearObtained" />
            </div>
            <div class="sm:col-span-2">
              <label for="institution" class="mb-1.5 block text-sm font-medium text-deep">Établissement</label>
              <input id="institution" class="field h-11" formControlName="institution" />
            </div>
          </div>

          <label for="file" class="btn btn-soft mt-5 cursor-pointer"><app-icon [icon]="Upload" [size]="16" />{{ file() ? 'Changer le fichier' : 'Choisir un fichier' }}</label>
          <input id="file" type="file" accept=".pdf,.jpg,.jpeg,.png" class="sr-only" (change)="onFile($event)" />
          <span class="ml-3 text-sm text-deep">{{ file()?.name }}</span>
          <p class="mt-1 text-xs text-muted-foreground">PDF, JPG ou PNG, 5 Mo maximum.</p>
          @if (fileError()) { <p class="mt-1 text-xs font-medium text-destructive">{{ fileError() }}</p> }

          <div><button type="submit" class="btn btn-hero mt-5" [disabled]="busy()">{{ busy() ? 'Envoi…' : 'Envoyer le document' }}</button></div>
        </form>
      </div>
    </section>
  `,
})
export class MyDiplomasPage {
  private readonly api = inject(DoctorSpaceService);

  protected readonly Download = LucideDownload;
  protected readonly Trash = LucideTrash2;
  protected readonly Upload = LucideUpload;
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