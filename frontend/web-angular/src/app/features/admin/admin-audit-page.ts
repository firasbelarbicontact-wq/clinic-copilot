import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideDownload, LucideHistory, LucideSearch } from '@lucide/angular';
import { dayHeading, timeLabel } from '../../core/mock/format';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';
import { AdminService, AuditEntry } from './admin.service';

type KindTab = 'ALL' | AuditEntry['kind'];

const KINDS: Record<AuditEntry['kind'], { label: string; dot: string; chip: string }> = {
  AUTH: { label: 'Connexion', dot: 'bg-info', chip: 'bg-info/15 text-info' },
  DOCTOR: { label: 'Médecin', dot: 'bg-primary', chip: 'bg-primary/12 text-primary' },
  REVIEW: { label: 'Avis', dot: 'bg-amber-400', chip: 'bg-warning/20 text-accent-foreground' },
  USER: { label: 'Compte', dot: 'bg-violet-500', chip: 'bg-violet-500/15 text-violet-600' },
};

@Component({
  selector: 'app-admin-audit-page',
  imports: [FormsModule, Icon, PageHeader],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-4xl space-y-6">
        <app-page-header eyebrow="Supervision" title="Journal d'audit" subtitle="Qui a fait quoi, et quand." [icon]="History">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-warning/20 px-3 py-1 text-xs font-semibold text-accent-foreground">Données en direct</span>
            <button type="button" class="btn btn-soft" (click)="exportCsv()"><app-icon [icon]="Download" [size]="16" />Exporter en CSV</button>
          </div>
        </app-page-header>

        <div class="flex flex-wrap items-center gap-3">
          <div class="flex flex-wrap gap-2" role="tablist">
            @for (t of tabs; track t.id) {
              <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
                class="rounded-full px-3.5 py-1.5 text-sm font-semibold transition"
                [class]="tab() === t.id ? 'bg-primary text-primary-foreground shadow-soft' : 'border border-border bg-card text-muted-foreground hover:border-primary/40'">{{ t.label }}</button>
            }
          </div>
          <div class="relative min-w-[220px] flex-1">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
            <input type="search" class="field h-10 pl-9" placeholder="Rechercher une action, une personne…" aria-label="Rechercher dans le journal"
              [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
        </div>

        @for (g of groups(); track g.label) {
          <section>
            <h2 class="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{{ g.label }}</h2>
            <ol class="relative space-y-3 border-l-2 border-border pl-6">
              @for (e of g.items; track e.id) {
                <li class="relative rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <span class="absolute -left-[31px] top-5 h-3 w-3 rounded-full ring-4 ring-background" [class]="kinds[e.kind].dot" aria-hidden="true"></span>
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold text-deep">{{ e.action }}</p>
                    <span class="text-xs text-muted-foreground">{{ time(e.at) }}</span>
                  </div>
                  <p class="mt-1 text-sm text-muted-foreground">{{ e.target }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span class="rounded-full px-2.5 py-1 font-semibold" [class]="kinds[e.kind].chip">{{ kinds[e.kind].label }}</span>
                    <span class="text-muted-foreground">par {{ e.actor }}</span>
                  </div>
                </li>
              }
            </ol>
          </section>
        } @empty {
          <div class="rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <p class="font-semibold text-deep">Aucune donnée disponible</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminAuditPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly auditData = signal<AuditEntry[]>([]);

  ngOnInit() {
    this.adminService.audit().subscribe((data) => this.auditData.set(data));
  }

  protected readonly Download = LucideDownload;
  protected readonly History = LucideHistory;
  protected readonly Search = LucideSearch;
  protected readonly kinds = KINDS;
  protected readonly time = timeLabel;

  protected readonly tabs: { id: KindTab; label: string }[] = [
    { id: 'ALL', label: 'Tout' },
    { id: 'DOCTOR', label: 'Médecin' },
    { id: 'REVIEW', label: 'Avis' },
    { id: 'USER', label: 'Compte' },
    { id: 'AUTH', label: 'Connexion' },
  ];
  protected readonly tab = signal<KindTab>('ALL');
  protected readonly query = signal('');

  protected readonly rows = computed(() => {
    const q = this.query().trim().toLowerCase();
    const tab = this.tab();
    return this.auditData()
      .filter((e) => tab === 'ALL' || e.kind === tab)
      .filter((e) => !q || `${e.action} ${e.target} ${e.actor}`.toLowerCase().includes(q))
      .sort((a, b) => b.at.localeCompare(a.at));
  });

  protected readonly groups = computed(() => {
    const out: { label: string; items: AuditEntry[] }[] = [];
    for (const e of this.rows()) {
      const label = dayHeading(e.at);
      const last = out[out.length - 1];
      if (last && last.label === label) last.items.push(e);
      else out.push({ label, items: [e] });
    }
    return out;
  });

  protected exportCsv() {
    const header = ['Date', 'Acteur', 'Type', 'Action', 'Cible'];
    const lines = this.rows().map((e) => [e.at, e.actor, KINDS[e.kind].label, e.action, e.target]);
    const csv = [header, ...lines]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal-audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
