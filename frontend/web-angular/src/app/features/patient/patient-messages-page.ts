import { Component, computed, effect, ElementRef, inject, signal, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucideMessageCircle, LucideSend } from '@lucide/angular';
import { map } from 'rxjs';
import { Icon } from '../../shared/ui/icon';
import { DoctorAvatar } from './doctor-bits';
import { DOCTORS } from './patient.models';
import { pad } from './appointment-utils';

interface Msg { id: number; from: 'me' | 'doc'; text: string; at: string }
const hhmm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

@Component({
  selector: 'app-patient-messages-page',
  imports: [RouterLink, Icon, DoctorAvatar],
  template: `
    <div class="px-4 py-6 md:px-8 md:py-8">
      <div class="mx-auto max-w-6xl space-y-4">
        <div>
          <h1 class="text-2xl font-bold text-deep sm:text-3xl">Messagerie</h1>
          <p class="mt-1 text-muted-foreground">Échangez en toute sécurité avec vos médecins.</p>
        </div>

        <div class="grid h-[70vh] min-h-[480px] overflow-hidden rounded-3xl border border-border bg-card shadow-soft md:grid-cols-[320px_minmax(0,1fr)]">
          <aside class="flex flex-col border-border md:border-r" [class.hidden]="activeId() && isMobile" [class.md:flex]="true">
            <p class="border-b border-border px-4 py-3 text-sm font-semibold text-deep">Conversations</p>
            <ul class="flex-1 overflow-y-auto">
              @for (c of conversations(); track c.doctor.id) {
                <li>
                  <button type="button" (click)="activeId.set(c.doctor.id)"
                    class="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-soft/60"
                    [class]="activeId() === c.doctor.id ? 'bg-soft' : ''">
                    <app-doctor-avatar [doctor]="c.doctor" [showOnline]="true" />
                    <span class="min-w-0 flex-1">
                      <span class="flex items-baseline justify-between gap-2"><span class="truncate font-semibold text-deep">{{ c.doctor.name }}</span><span class="text-xs text-muted-foreground">{{ c.last?.at }}</span></span>
                      <span class="block truncate text-sm text-muted-foreground">{{ c.last?.text ?? 'Nouvelle conversation' }}</span>
                    </span>
                  </button>
                </li>
              }
            </ul>
          </aside>

          <section class="flex min-h-0 flex-col" [class.hidden]="!activeId()" [class.md:flex]="true">
            @if (active(); as d) {
              <header class="flex items-center gap-3 border-b border-border px-4 py-3">
                <button type="button" class="btn btn-ghost btn-icon md:hidden" (click)="activeId.set(null)" aria-label="Retour"><app-icon [icon]="Back" [size]="18" /></button>
                <app-doctor-avatar [doctor]="d" [showOnline]="true" />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-deep">{{ d.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ d.specialty }} · {{ d.online ? 'En ligne' : 'Hors ligne' }}</p>
                </div>
                <a class="btn btn-soft hidden sm:inline-flex" [routerLink]="['/espace-patient/medecins', d.id]">Voir le profil</a>
              </header>
              <div #scroller class="flex-1 space-y-3 overflow-y-auto bg-soft/30 px-4 py-4">
                @if (thread().length === 0) {
                  <p class="mx-auto max-w-xs rounded-xl bg-card p-4 text-center text-sm text-muted-foreground">Écrivez votre premier message à {{ d.name }}. Pour une urgence, appelez le 190.</p>
                }
                @for (m of thread(); track m.id) {
                  <div class="flex" [class.justify-end]="m.from === 'me'">
                    <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-soft"
                      [class]="m.from === 'me' ? 'rounded-br-md bg-gradient-primary text-white' : 'rounded-bl-md border border-border bg-card text-deep'">
                      <p>{{ m.text }}</p>
                      <p class="mt-1 text-right text-[11px] opacity-70">{{ m.at }}</p>
                    </div>
                  </div>
                }
                @if (typing()) { <p class="text-xs text-muted-foreground">{{ d.name }} est en train d'écrire…</p> }
              </div>
              <form class="flex gap-2 border-t border-border p-3" (submit)="$event.preventDefault(); send()">
                <input class="field flex-1 rounded-full" placeholder="Écrire un message…" aria-label="Message" [value]="draft()" (input)="draft.set($any($event.target).value)" />
                <button type="submit" class="btn btn-hero btn-icon" [disabled]="!draft().trim()" aria-label="Envoyer"><app-icon [icon]="Send" [size]="18" /></button>
              </form>
            } @else {
              <div class="grid flex-1 place-items-center p-8 text-center">
                <div>
                  <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-soft text-primary"><app-icon [icon]="Chat" [size]="28" /></span>
                  <p class="mt-4 font-semibold text-deep">Sélectionnez une conversation</p>
                  <p class="mt-1 text-sm text-muted-foreground">Ou ouvrez la fiche d'un médecin pour lui écrire.</p>
                </div>
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
})
export class PatientMessagesPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly Back = LucideArrowLeft;
  protected readonly Send = LucideSend;
  protected readonly Chat = LucideMessageCircle;
  protected readonly isMobile = false;
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private n = 10;

  protected readonly threads = signal<Record<string, Msg[]>>({
    'd-benali': [
      { id: 1, from: 'doc', text: 'Bonjour, comment vous sentez-vous depuis la dernière consultation ?', at: '09:12' },
      { id: 2, from: 'me', text: 'Bonjour Docteur, beaucoup mieux, merci.', at: '09:30' },
      { id: 3, from: 'doc', text: 'Parfait. N\'hésitez pas à me réécrire si la fièvre revient.', at: '09:41' },
    ],
    'd-mansouri': [{ id: 4, from: 'doc', text: 'Pensez à apporter vos derniers résultats de spirométrie.', at: 'Hier' }],
  });
  protected readonly activeId = signal<string | null>(null);
  protected readonly draft = signal('');
  protected readonly typing = signal(false);

  private readonly param = toSignal(this.route.queryParamMap.pipe(map((p) => p.get('medecin'))), { initialValue: null });

  constructor() {
    effect(() => {
      const id = this.param();
      if (id && DOCTORS.some((d) => d.id === id)) {
        this.threads.update((t) => (t[id] ? t : { ...t, [id]: [] }));
        this.activeId.set(id);
      }
    });
    effect(() => {
      this.thread();
      this.typing();
      setTimeout(() => { const el = this.scroller()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; });
    });
  }

  protected readonly conversations = computed(() =>
    Object.entries(this.threads())
      .map(([id, msgs]) => ({ doctor: DOCTORS.find((d) => d.id === id)!, last: (msgs[msgs.length - 1] as Msg | undefined) }))
      .filter((c) => !!c.doctor),
  );
  protected readonly active = computed(() => DOCTORS.find((d) => d.id === this.activeId()) ?? null);
  protected readonly thread = computed(() => this.threads()[this.activeId() ?? ''] ?? []);

  private push(id: string, from: Msg['from'], text: string): void {
    this.threads.update((t) => ({ ...t, [id]: [...(t[id] ?? []), { id: ++this.n, from, text, at: hhmm() }] }));
  }

  protected send(): void {
    const id = this.activeId();
    const text = this.draft().trim();
    if (!id || !text) return;
    this.push(id, 'me', text);
    this.draft.set('');
    this.typing.set(true);
    setTimeout(() => {
      this.typing.set(false);
      this.push(id, 'doc', 'Merci pour votre message. Je vous réponds dans les plus brefs délais.');
    }, 1600);
  }
}