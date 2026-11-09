import { Component, inject } from '@angular/core';
import { LucideBell, LucideCalendarDays, LucideFileText, LucideStar } from '@lucide/angular';
import { shortDate, timeLabel } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { AppNotification } from '../../core/mock/mock.models';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';

const KINDS: Record<AppNotification['kind'], { icon: unknown; cls: string }> = {
  RDV: { icon: LucideCalendarDays, cls: 'bg-info/15 text-info' },
  AVIS: { icon: LucideStar, cls: 'bg-warning/20 text-accent-foreground' },
  DOSSIER: { icon: LucideFileText, cls: 'bg-primary/15 text-primary' },
  SYSTEME: { icon: LucideBell, cls: 'bg-muted text-muted-foreground' },
};

@Component({
  selector: 'app-notifications-page',
  imports: [Icon, PageHeader],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-3xl space-y-6">
        <app-page-header title="Notifications" [subtitle]="store.unreadCount() + ' non lue(s)'">
          <button type="button" class="btn btn-soft" [disabled]="!store.unreadCount()" (click)="store.markAllRead()">Tout marquer comme lu</button>
        </app-page-header>

        <ul class="space-y-3">
          @for (n of store.notifications(); track n.id) {
            <li>
              <button type="button" (click)="store.markRead(n.id)"
                class="flex w-full items-start gap-4 rounded-2xl border bg-card p-4 text-left shadow-soft transition-colors duration-200 hover:bg-soft/60"
                [class]="n.read ? 'border-border' : 'border-primary/40'">
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" [class]="kind(n.kind).cls"><app-icon [icon]="kind(n.kind).icon" [size]="20" /></span>
                <div class="min-w-0 flex-1">
                  <p class="font-semibold text-deep">{{ n.title }}</p>
                  <p class="text-sm text-muted-foreground">{{ n.body }}</p>
                  <p class="mt-1 text-xs text-muted-foreground">{{ date(n.at) }} · {{ time(n.at) }}</p>
                </div>
                @if (!n.read) {
                  <span class="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Non lue"></span>
                }
              </button>
            </li>
          }
        </ul>
      </div>
    </div>
  `,
})
export class NotificationsPage {
  protected readonly store = inject(MockStore);
  protected readonly date = shortDate;
  protected readonly time = timeLabel;
  protected kind(k: AppNotification['kind']) {
    return KINDS[k];
  }
}