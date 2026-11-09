import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideSearch, LucideUsers } from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { avatarGradient } from '../../core/mock/palette';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { AdminDemoStore, DemoRole, DemoUser } from './admin-demo.store';

type RoleTab = 'ALL' | DemoRole;

@Component({
  selector: 'app-admin-users-page',
  imports: [FormsModule, Icon, PageHeader],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-5xl space-y-6">
        <app-page-header eyebrow="Gestion" title="Utilisateurs" subtitle="Tous les comptes de la plateforme, par rôle et par statut." [icon]="Users">
          <span class="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-accent-foreground">Données de démonstration</span>
        </app-page-header>

        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          @for (k of kpis(); track k.label) {
            <div class="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ k.label }}</p>
              <p class="mt-1 text-3xl font-extrabold text-deep">{{ k.value }}</p>
            </div>
          }
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-2" role="tablist">
            @for (t of roleTabs; track t.id) {
              <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
                class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
                [class]="tab() === t.id ? 'bg-primary text-primary-foreground shadow-soft' : 'border border-border bg-card text-muted-foreground hover:border-primary/40'">{{ t.label }}</button>
            }
          </div>
          <div class="relative min-w-[220px] flex-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
            <input type="search" class="field h-10 pl-9" placeholder="Rechercher un nom ou un e-mail…" aria-label="Rechercher un utilisateur"
              [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
        </div>

        <ul class="space-y-3">
          @for (u of rows(); track u.id) {
            <li class="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift" [class.opacity-75]="!u.active">
              <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(u.name)">{{ ini(u.name) }}</span>
              <div class="min-w-0 flex-1 basis-48">
                <p class="truncate font-semibold text-deep">{{ u.name }}</p>
                <p class="truncate text-sm text-muted-foreground">{{ u.email }}</p>
              </div>
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="roleMeta[u.role].cls">{{ roleMeta[u.role].label }}</span>
              <div class="hidden text-sm text-muted-foreground md:block">
                <p>Dernière connexion</p>
                <p class="font-medium text-deep">{{ lastLogin(u) }}</p>
              </div>
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [class]="u.active ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'">{{ u.active ? 'Actif' : 'Désactivé' }}</span>
              <button type="button" class="btn" [class]="u.active ? 'btn-ghost text-destructive' : 'btn-soft'"
                [disabled]="u.role === 'ADMIN'" [attr.title]="u.role === 'ADMIN' ? 'Un administrateur ne peut pas être désactivé ici' : null" (click)="toggle(u)">
                {{ u.active ? 'Désactiver' : 'Réactiver' }}
              </button>
            </li>
          } @empty {
            <li class="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
              <p class="font-semibold text-deep">Aucun utilisateur trouvé</p>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class AdminUsersPage {
  protected readonly store = inject(AdminDemoStore);

  protected readonly Search = LucideSearch;
  protected readonly Users = LucideUsers;
  protected readonly ini = initials;
  protected readonly grad = avatarGradient;

  protected readonly roleTabs: { id: RoleTab; label: string }[] = [
    { id: 'ALL', label: 'Tous' },
    { id: 'PATIENT', label: 'Patients' },
    { id: 'DOCTOR', label: 'Médecins' },
    { id: 'ADMIN', label: 'Admins' },
  ];
  protected readonly roleMeta: Record<DemoRole, { label: string; cls: string }> = {
    PATIENT: { label: 'Patient', cls: 'bg-info/15 text-info' },
    DOCTOR: { label: 'Médecin', cls: 'bg-primary/12 text-primary' },
    ADMIN: { label: 'Admin', cls: 'bg-deep text-deep-foreground' },
  };

  protected readonly tab = signal<RoleTab>('ALL');
  protected readonly query = signal('');

  protected readonly kpis = computed(() => {
    const u = this.store.users();
    return [
      { label: 'Comptes', value: u.length },
      { label: 'Patients', value: u.filter((x) => x.role === 'PATIENT').length },
      { label: 'Médecins', value: u.filter((x) => x.role === 'DOCTOR').length },
      { label: 'Désactivés', value: u.filter((x) => !x.active).length },
    ];
  });

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = this.tab();
    return this.store
      .users()
      .filter((u) => tab === 'ALL' || u.role === tab)
      .filter((u) => !q || `${u.name} ${u.email}`.toLowerCase().includes(q));
  });

  protected lastLogin(u: DemoUser): string {
    return u.lastLogin ? `${dayHeading(u.lastLogin)} · ${timeLabel(u.lastLogin)}` : 'Jamais connecté';
  }

  protected toggle(u: DemoUser) {
    const verb = u.active ? 'désactiver' : 'réactiver';
    if (window.confirm(`Voulez-vous ${verb} le compte de ${u.name} ?`)) this.store.toggleUser(u.id);
  }
}
