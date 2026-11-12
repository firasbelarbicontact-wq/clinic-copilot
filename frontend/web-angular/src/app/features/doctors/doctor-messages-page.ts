import { Component, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideCheckCheck, LucideMessageCircle, LucidePhone, LucideSearch, LucideSend, LucideUserRound } from '@lucide/angular';
import { dayHeading, initials, timeLabel } from '../../core/mock/format';
import { MockStore } from '../../core/mock/mock-store';
import { ChatMessage, Conversation } from '../../core/mock/mock.models';
import { avatarGradient } from '../../core/mock/palette';
import { Icon } from '../../shared/ui/icon';
import { PageHeader } from '../../shared/ui/page-header';

type Item = { key: string; day?: string; msg?: ChatMessage };
type Tab = 'all' | 'unread';

const lastOf = (c: Conversation) => c.messages[c.messages.length - 1];

@Component({
  selector: 'app-doctor-messages-page',
  imports: [FormsModule, RouterLink, Icon, PageHeader],
  template: `
    <div class="bg-gradient-soft px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-6">
        <app-page-header title="Messagerie" [subtitle]="subtitle()" />

        <div class="grid h-[72vh] min-h-[520px] overflow-hidden rounded-3xl border border-border bg-card shadow-soft md:grid-cols-[340px_minmax(0,1fr)]">
          <!-- Liste des conversations -->
          <aside class="min-h-0 flex-col border-border md:flex md:border-r" [class]="current() ? 'hidden' : 'flex'">
            <div class="space-y-3 border-b border-border p-4">
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><app-icon [icon]="Search" [size]="16" /></span>
                <input type="search" class="field h-10 pl-9" placeholder="Rechercher un patient…" aria-label="Rechercher une conversation"
                  [ngModel]="query()" (ngModelChange)="query.set($event)" />
              </div>
              <div class="flex gap-2" role="tablist">
                @for (t of tabs; track t.id) {
                  <button type="button" role="tab" [attr.aria-selected]="tab() === t.id" (click)="tab.set(t.id)"
                    class="rounded-full px-3 py-1 text-xs font-semibold transition"
                    [class]="tab() === t.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-soft'">
                    {{ t.label }}@if (t.id === 'unread' && unreadCount()) { ({{ unreadCount() }}) }
                  </button>
                }
              </div>
            </div>

            <ul class="min-h-0 flex-1 overflow-y-auto">
              @for (c of list(); track c.id) {
                <li>
                  <button type="button" (click)="select(c.id)"
                    class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 hover:bg-soft/60"
                    [class]="selectedId() === c.id ? 'bg-soft' : ''">
                    <span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(c.contactName)">{{ ini(c.contactName) }}</span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-baseline justify-between gap-2">
                        <p class="truncate text-deep" [class]="isUnread(c) ? 'font-bold' : 'font-semibold'">{{ c.contactName }}</p>
                        <span class="shrink-0 text-xs text-muted-foreground">{{ time(last(c).at) }}</span>
                      </div>
                      <p class="truncate text-sm" [class]="isUnread(c) ? 'font-medium text-deep' : 'text-muted-foreground'">
                        {{ last(c).from === 'me' ? 'Vous : ' : '' }}{{ last(c).text }}
                      </p>
                    </div>
                    @if (isUnread(c)) {
                      <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-label="Non lue"></span>
                    }
                  </button>
                </li>
              } @empty {
                <li class="p-8 text-center text-sm text-muted-foreground">Aucune conversation.</li>
              }
            </ul>
          </aside>

          <!-- Conversation -->
          <section class="min-h-0 flex-col md:flex" [class]="current() ? 'flex' : 'hidden'">
            @if (current(); as c) {
              <header class="flex items-center gap-3 border-b border-border px-4 py-3">
                <button type="button" class="btn btn-ghost md:hidden" (click)="selectedId.set(null)" aria-label="Retour aux conversations"><app-icon [icon]="Back" [size]="18" /></button>
                <span class="grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white" [class]="grad(c.contactName)">{{ ini(c.contactName) }}</span>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-deep">{{ c.contactName }}</p>
                  <p class="truncate text-xs text-muted-foreground">Patient{{ phone() ? ' · ' + phone() : '' }}</p>
                </div>
                @if (phone(); as p) {
                  <a [href]="'tel:' + p.replace(' ', '')" class="btn btn-soft" aria-label="Appeler le patient"><app-icon [icon]="Phone" [size]="16" /><span class="hidden sm:inline">Appeler</span></a>
                }
                <a routerLink="/espace-medecin/patients" class="btn btn-ghost" aria-label="Voir mes patients"><app-icon [icon]="Profile" [size]="16" /><span class="hidden sm:inline">Dossier</span></a>
              </header>

              <div #scroller class="flex-1 space-y-3 overflow-y-auto bg-background/60 px-4 py-4">
                @for (it of items(); track it.key) {
                  @if (it.msg; as m) {
                    <div class="flex" [class]="m.from === 'me' ? 'justify-end' : 'justify-start'">
                      <div class="max-w-[78%] rounded-2xl px-4 py-2.5 text-sm shadow-soft"
                        [class]="m.from === 'me' ? 'rounded-br-md bg-gradient-primary text-primary-foreground' : 'rounded-bl-md border border-border bg-card text-deep'">
                        <p class="whitespace-pre-wrap leading-relaxed">{{ m.text }}</p>
                        <p class="mt-1 flex items-center justify-end gap-1 text-[11px] opacity-70">
                          {{ time(m.at) }}
                          @if (m.from === 'me') { <app-icon [icon]="Checks" [size]="12" /> }
                        </p>
                      </div>
                    </div>
                  } @else {
                    <div class="flex justify-center">
                      <span class="rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">{{ it.day }}</span>
                    </div>
                  }
                }
                @if (typingHere()) {
                  <div class="flex justify-start">
                    <div class="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-soft" role="status" aria-label="Le patient écrit">
                      <span class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60"></span>
                      <span class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:150ms]"></span>
                      <span class="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:300ms]"></span>
                    </div>
                  </div>
                }
              </div>

              <div class="border-t border-border bg-card p-3">
                <div class="mb-2 flex gap-2 overflow-x-auto pb-1">
                  @for (q of quick; track q.label) {
                    <button type="button" class="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-deep transition hover:border-primary/50 hover:bg-soft"
                      (click)="draft.set(q.text)">{{ q.label }}</button>
                  }
                </div>
                <form class="flex items-end gap-2" (submit)="send($event)">
                  <textarea rows="1" class="field h-auto max-h-32 min-h-10 resize-none py-2" name="draft" autocomplete="off"
                    placeholder="Écrire un message… (Entrée pour envoyer)" aria-label="Votre message"
                    [ngModel]="draft()" (ngModelChange)="draft.set($event)" (keydown.enter)="onEnter($any($event))"></textarea>
                  <button type="submit" class="btn btn-hero h-10" [disabled]="!draft().trim()"><app-icon [icon]="Send" [size]="16" />Envoyer</button>
                </form>
              </div>
            } @else {
              <div class="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <span class="mx-auto grid h-16 w-16 place-items-center rounded-full bg-soft text-primary"><app-icon [icon]="Chat" [size]="28" /></span>
                  <p class="mt-4 font-semibold text-deep">Sélectionnez une conversation</p>
                  <p class="mt-1 text-sm text-muted-foreground">Vos échanges avec vos patients apparaissent ici.</p>
                </div>
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
})
export class DoctorMessagesPage {
  protected readonly store = inject(MockStore);

  protected readonly Search = LucideSearch;
  protected readonly Send = LucideSend;
  protected readonly Back = LucideArrowLeft;
  protected readonly Checks = LucideCheckCheck;
  protected readonly Phone = LucidePhone;
  protected readonly Profile = LucideUserRound;
  protected readonly Chat = LucideMessageCircle;

  protected readonly ini = initials;
  protected readonly time = timeLabel;
  protected readonly grad = avatarGradient;
  protected readonly last = lastOf;

  protected readonly tabs: { id: Tab; label: string }[] = [
    { id: 'all', label: 'Toutes' },
    { id: 'unread', label: 'Non lues' },
  ];
  protected readonly quick = [
    { label: 'Rappel de rendez-vous', text: 'Je vous rappelle votre prochain rendez-vous. Merci de confirmer votre présence.' },
    { label: 'Résultats disponibles', text: 'Vos résultats sont disponibles. Nous en parlerons lors de notre prochaine consultation.' },
    { label: 'Apporter les documents', text: 'Pensez à apporter vos derniers résultats et votre carnet de santé.' },
    { label: 'Symptômes persistants', text: "Si les symptômes persistent, n'hésitez pas à me recontacter." },
  ];

  protected readonly query = signal('');
  protected readonly tab = signal<Tab>('all');
  protected readonly selectedId = signal<string | null>('dc1');
  protected readonly draft = signal('');
  private readonly typingId = signal<string | null>(null);
  private readonly seen = signal<ReadonlySet<string>>(new Set(['dc1']));
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');

  protected isUnread(c: Conversation): boolean {
    const m = lastOf(c);
    return !!m && m.from === 'them' && !this.seen().has(c.id) && c.id !== this.selectedId();
  }

  protected readonly unreadCount = computed(() => this.store.doctorConversations().filter((c) => this.isUnread(c)).length);
  protected readonly subtitle = computed(
    () => `${this.store.doctorConversations().length} conversation(s) · ${this.unreadCount()} non lue(s)`,
  );

  protected readonly list = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.store
      .doctorConversations()
      .filter((c) => !q || c.contactName.toLowerCase().includes(q) || lastOf(c)?.text.toLowerCase().includes(q))
      .filter((c) => this.tab() === 'all' || this.isUnread(c))
      .sort((a, b) => (lastOf(b)?.at ?? '').localeCompare(lastOf(a)?.at ?? ''));
  });

  protected readonly current = computed(() => this.store.doctorConversations().find((c) => c.id === this.selectedId()) ?? null);
  protected readonly typingHere = computed(() => !!this.current() && this.typingId() === this.current()!.id);
  protected readonly phone = computed(() => {
    const c = this.current();
    return c ? (this.store.doctorPatients().find((p) => p.name === c.contactName)?.phone ?? null) : null;
  });

  protected readonly items = computed<Item[]>(() => {
    const c = this.current();
    if (!c) return [];
    const out: Item[] = [];
    let day = '';
    for (const m of c.messages) {
      const d = new Date(m.at).toDateString();
      if (d !== day) {
        day = d;
        out.push({ key: 'day-' + d, day: dayHeading(m.at) });
      }
      out.push({ key: m.id, msg: m });
    }
    return out;
  });

  constructor() {
    effect(() => {
      this.items();
      this.typingHere();
      setTimeout(() => {
        const el = this.scroller()?.nativeElement;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  }

  protected select(id: string) {
    this.selectedId.set(id);
    this.seen.update((s) => new Set(s).add(id));
  }

  protected onEnter(e: KeyboardEvent) {
    if (e.shiftKey) return;
    e.preventDefault();
    this.sendNow();
  }

  protected send(event: Event) {
    event.preventDefault();
    this.sendNow();
  }

  private sendNow() {
    const c = this.current();
    const text = this.draft().trim();
    if (!c || !text) return;
    this.store.sendDoctorMessage(c.id, text);
    this.draft.set('');
    this.typingId.set(c.id);
    // Réponse simulée du patient
    setTimeout(() => {
      this.store.sendDoctorMessage(c.id, 'Merci docteur, bien reçu.', 'them');
      this.typingId.set(null);
      if (this.selectedId() !== c.id) {
        this.seen.update((s) => {
          const n = new Set(s);
          n.delete(c.id);
          return n;
        });
      }
    }, 1500);
  }
}