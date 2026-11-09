import { Component, ElementRef, effect, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideActivity, LucideBot, LucideBrain, LucideCircleCheck, LucideCircleHelp, LucideLock, LucidePhone, LucideRotateCcw, LucideSend,
  LucideShieldAlert, LucideStethoscope, LucideThermometer, LucideTriangleAlert, LucideWind,
} from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { Modal } from './overlays';
import { Toasts } from './toasts';

type Level = 'low' | 'mid' | 'high';

interface Bubble {
  id: number;
  from: 'me' | 'bot';
  text: string;
  level?: Level;
  specialty?: string;
  tips?: string[];
}

interface Rule { keys: string[]; text: string; level: Level; specialty?: string; tips: string[] }

const RULES: Rule[] = [
  { keys: ['poitrine', 'thorac', 'respire pas', 'étouff', 'etouff', 'malaise', 'paralys', 'évanou', 'evanou'], level: 'high',
    text: 'Ces symptômes peuvent être graves et ne doivent pas attendre. Contactez les secours immédiatement.',
    tips: ['Appelez le 190 (SAMU) ou le 198 (Protection civile)', 'Ne conduisez pas vous-même', 'Restez assis et calme en attendant les secours'] },
  { keys: ['fièvre', 'fievre', 'température', 'temperature', 'frisson'], level: 'mid', specialty: 'Médecin généraliste',
    text: 'Une fièvre persistante mérite un avis médical, surtout au-delà de 48 heures ou si elle s\'accompagne d\'autres signes.',
    tips: ['Hydratez-vous régulièrement', 'Reposez-vous et surveillez votre température', 'Consultez vite si raideur de nuque ou éruption'] },
  { keys: ['toux', 'gorge', 'rhume', 'nez', 'sinus'], level: 'low', specialty: 'ORL',
    text: 'Il s\'agit probablement d\'une infection virale courante. Surveillez l\'évolution sur quelques jours.',
    tips: ['Buvez chaud et humidifiez l\'air', 'Surveillez la fièvre et la gêne respiratoire', 'Consultez si cela dure plus de 5 jours'] },
  { keys: ['tête', 'tete', 'migraine', 'vertige'], level: 'mid', specialty: 'Médecin généraliste',
    text: 'Les maux de tête sont souvent liés à la fatigue, au stress ou à la déshydratation, mais certains signes doivent alerter.',
    tips: ['Reposez-vous au calme et hydratez-vous', 'Notez la fréquence et l\'intensité', 'Consultez en urgence si le mal est brutal ou inhabituel'] },
  { keys: ['dos', 'articul', 'muscle', 'lombaire'], level: 'low', specialty: 'Médecin généraliste',
    text: 'Des douleurs musculo-squelettiques bénignes s\'améliorent souvent avec le repos relatif et la chaleur.',
    tips: ['Évitez les efforts de port de charge', 'Appliquez de la chaleur locale', 'Un avis médical est conseillé au-delà d\'une semaine'] },
  { keys: ['peau', 'bouton', 'démangeaison', 'demangeaison', 'eczéma', 'eczema', 'rougeur'], level: 'low', specialty: 'Dermatologue',
    text: 'Pour des problèmes de peau persistants, un dermatologue pourra poser un diagnostic précis.',
    tips: ['Évitez de gratter la zone', 'N\'appliquez pas de produit sans avis', 'Prenez une photo pour suivre l\'évolution'] },
  { keys: ['ventre', 'estomac', 'nausée', 'nausee', 'vomi', 'diarrhée', 'diarrhee'], level: 'mid', specialty: 'Médecin généraliste',
    text: 'Des troubles digestifs sont fréquents. L\'hydratation est la priorité, surtout en cas de vomissements ou de diarrhée.',
    tips: ['Buvez par petites gorgées', 'Mangez léger, évitez les graisses', 'Consultez si présence de sang ou douleur intense'] },
];

const DEFAULT_REPLY: Omit<Rule, 'keys'> = {
  level: 'low',
  text: 'Merci pour ces précisions. Pour mieux vous orienter, indiquez depuis quand cela dure et l\'intensité de 1 à 10.',
  tips: ['Précisez les autres signes associés', 'Mentionnez vos traitements en cours', 'En cas de doute, consultez un médecin'],
};

const LEVELS: Record<Level, { label: string; cls: string; bar: string }> = {
  low: { label: 'Niveau faible', cls: 'bg-success/15 text-success', bar: 'bg-success' },
  mid: { label: 'Niveau modéré', cls: 'bg-warning/25 text-accent-foreground', bar: 'bg-warning' },
  high: { label: 'Urgence possible', cls: 'bg-destructive/15 text-destructive', bar: 'bg-destructive' },
};

@Component({
  selector: 'app-assistant-page',
  imports: [RouterLink, Icon, Modal],
  styles: `
    @keyframes float-a { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(18px, -10px); } }
    @keyframes float-b { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(-22px, 8px); } }
    @keyframes msg-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
    @keyframes dot { 0%, 80%, 100% { transform: scale(0.55); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }
    @keyframes ring { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.9); opacity: 0; } }
    .float-a { animation: float-a 9s ease-in-out infinite; }
    .float-b { animation: float-b 11s ease-in-out infinite; }
    .msg-in { animation: msg-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both; }
    .dot { animation: dot 1.2s ease-in-out infinite; }
    .ring { animation: ring 1.6s ease-out infinite; }
    @media (prefers-reduced-motion: reduce) { .float-a, .float-b, .msg-in, .dot, .ring { animation: none; } }
  `,
  template: `
    <div class="flex h-[calc(100dvh-6.5rem)] min-h-[520px] flex-col gap-3 px-4 py-4 md:px-6">

      <!-- Barre compacte -->
      <section class="relative shrink-0 overflow-hidden rounded-2xl bg-deep px-4 py-3 text-deep-foreground shadow-soft">
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div class="float-a absolute -left-8 -top-10 h-28 w-28 rounded-full bg-primary/40 blur-3xl"></div>
          <div class="float-b absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-tertiary/35 blur-3xl"></div>
        </div>
        <div class="relative flex flex-wrap items-center gap-3">
          <span class="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white">
            <span class="ring absolute inset-0 rounded-xl bg-primary/50"></span>
            <app-icon [icon]="Bot" [size]="20" />
          </span>
          <div class="min-w-0 flex-1">
            <h1 class="text-base font-bold leading-tight sm:text-lg">Assistant santé</h1>
            <p class="truncate text-xs text-deep-foreground/70">Orientation prudente, sans diagnostic.</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" class="btn rounded-full bg-destructive text-sm text-white hover:opacity-90" (click)="urgenceOpen.set(true)">
              <app-icon [icon]="Shield" [size]="15" />Urgences
            </button>
            <button type="button" class="btn rounded-full bg-white/10 text-sm text-deep-foreground backdrop-blur hover:bg-white/20" (click)="howOpen.set(true)">
              <app-icon [icon]="Help" [size]="15" />Comment ça marche
            </button>
            <button type="button" class="btn rounded-full bg-white/10 text-sm text-deep-foreground backdrop-blur hover:bg-white/20" (click)="privacy()">
              <app-icon [icon]="Lock" [size]="15" />Confidentialité
            </button>
          </div>
        </div>
      </section>

      <!-- Chat : remplit l'écran, seuls les messages défilent -->
      <section class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft" aria-label="Conversation avec l'assistant">
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div class="flex items-center gap-3">
            <span class="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-primary text-white">
              @if (typing()) { <span class="ring absolute inset-0 rounded-full bg-primary/50"></span> }
              <app-icon [icon]="Bot" [size]="17" />
            </span>
            <div>
              <p class="text-sm font-semibold text-deep">Assistant Clinic Copilot</p>
              <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span class="h-1.5 w-1.5 rounded-full" [class]="typing() ? 'bg-warning' : 'bg-success'"></span>{{ typing() ? 'Analyse en cours' : 'Disponible' }}
              </p>
            </div>
          </div>
          <button type="button" class="btn btn-ghost text-sm" (click)="restart()"><app-icon [icon]="Restart" [size]="15" />Nouvelle conversation</button>
        </header>

        <div #scroller class="bg-mesh min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-8">
          @for (m of messages(); track m.id) {
            @if (m.from === 'me') {
              <div class="msg-in flex justify-end">
                <p class="max-w-[70%] rounded-2xl rounded-br-md bg-gradient-primary px-4 py-2.5 text-[15px] leading-snug text-white shadow-soft">{{ m.text }}</p>
              </div>
            } @else {
              <div class="msg-in flex items-end gap-3">
                <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-white"><app-icon [icon]="Bot" [size]="15" /></span>
                <div class="glass max-w-[75%] space-y-3 rounded-2xl rounded-bl-md border border-border px-4 py-3 shadow-soft">
                  @if (m.level) {
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" [class]="levels[m.level].cls">
                      <app-icon [icon]="levelIcon(m.level)" [size]="13" />{{ levels[m.level].label }}
                    </span>
                  }
                  <p class="text-[15px] leading-snug text-deep">{{ m.text }}</p>

                  @if (m.tips?.length) {
                    <ul class="space-y-1.5">
                      @for (t of m.tips; track t) {
                        <li class="flex items-start gap-2 text-sm leading-snug text-muted-foreground">
                          <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" [class]="m.level ? levels[m.level].bar : 'bg-primary'"></span>{{ t }}
                        </li>
                      }
                    </ul>
                  }

                  @if (m.level === 'high') {
                    <a href="tel:190" class="btn rounded-full bg-destructive text-sm text-white hover:opacity-90"><app-icon [icon]="Phone" [size]="15" />Appeler le 190</a>
                  } @else if (m.specialty) {
                    <div class="flex flex-wrap items-center gap-3 rounded-xl bg-soft px-3 py-2.5">
                      <span class="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary"><app-icon [icon]="Steth" [size]="18" /></span>
                      <div class="min-w-0 flex-1">
                        <p class="text-[11px] text-muted-foreground">Professionnel conseillé</p>
                        <p class="text-sm font-semibold text-deep">{{ m.specialty }}</p>
                      </div>
                      <a routerLink="/espace-patient/medecins" class="btn btn-hero text-sm">Trouver un médecin</a>
                    </div>
                  }
                </div>
              </div>
            }
          }

          @if (typing()) {
            <div class="msg-in flex items-end gap-3">
              <span class="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-white"><app-icon [icon]="Bot" [size]="15" /></span>
              <div class="glass inline-flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border px-4 py-3.5" aria-label="L'assistant analyse votre message">
                <span class="dot h-2 w-2 rounded-full bg-primary"></span>
                <span class="dot h-2 w-2 rounded-full bg-primary" style="animation-delay: 0.18s"></span>
                <span class="dot h-2 w-2 rounded-full bg-primary" style="animation-delay: 0.36s"></span>
              </div>
            </div>
          }

          @if (messages().length === 1 && !typing()) {
            <div class="msg-in pt-2">
              <p class="mb-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Suggestions</p>
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                @for (s of suggestions; track s.label) {
                  <button type="button" (click)="ask(s.label)"
                    class="card-lift group flex items-center gap-3 rounded-xl border border-border bg-card/80 p-3 text-left backdrop-blur transition-colors hover:border-primary/40">
                    <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-soft text-primary transition-colors group-hover:bg-gradient-primary group-hover:text-white"><app-icon [icon]="s.icon" [size]="18" /></span>
                    <span class="text-sm font-medium leading-tight text-deep">{{ s.label }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <form class="flex shrink-0 items-center gap-2 border-t border-border bg-card px-4 py-3 sm:px-8" (submit)="$event.preventDefault(); ask(draft())">
          <input class="field h-11 flex-1 rounded-full px-5" placeholder="Décrivez vos symptômes…" aria-label="Vos symptômes"
            [value]="draft()" (input)="draft.set($any($event.target).value)" />
          <button type="submit" class="btn btn-hero btn-icon h-11 w-11 rounded-full" [disabled]="!draft().trim() || typing()" aria-label="Envoyer">
            <app-icon [icon]="Send" [size]="18" />
          </button>
        </form>
      </section>
    </div>

    <app-modal [open]="urgenceOpen()" title="En cas d'urgence" description="Cet assistant ne remplace pas un médecin. Si votre vie est en danger, appelez sans attendre." (closed)="urgenceOpen.set(false)">
      <div class="grid gap-4 sm:grid-cols-2">
        <a href="tel:190" class="rounded-2xl bg-destructive/10 p-6 text-center transition-colors hover:bg-destructive/15">
          <p class="text-4xl font-bold text-destructive">190</p><p class="mt-1 text-sm text-muted-foreground">SAMU</p>
        </a>
        <a href="tel:198" class="rounded-2xl bg-warning/20 p-6 text-center transition-colors hover:bg-warning/30">
          <p class="text-4xl font-bold text-accent-foreground">198</p><p class="mt-1 text-sm text-muted-foreground">Protection civile</p>
        </a>
      </div>
      <div modalFooter class="contents"><button type="button" class="btn btn-soft" (click)="urgenceOpen.set(false)">Fermer</button></div>
    </app-modal>

    <app-modal [open]="howOpen()" title="Comment ça marche" description="Trois étapes simples pour être orienté." (closed)="howOpen.set(false)">
      <ol class="space-y-5">
        @for (s of steps; track s.title; let i = $index) {
          <li class="flex gap-4">
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-primary font-bold text-white">{{ i + 1 }}</span>
            <div>
              <p class="font-semibold text-deep">{{ s.title }}</p>
              <p class="text-sm text-muted-foreground">{{ s.text }}</p>
            </div>
          </li>
        }
      </ol>
      <div modalFooter class="contents"><button type="button" class="btn btn-hero" (click)="howOpen.set(false)">Compris</button></div>
    </app-modal>
  `,
})
export class AssistantPage {
  private readonly toasts = inject(Toasts);

  protected readonly Bot = LucideBot;
  protected readonly Send = LucideSend;
  protected readonly Shield = LucideShieldAlert;
  protected readonly Restart = LucideRotateCcw;
  protected readonly Phone = LucidePhone;
  protected readonly Steth = LucideStethoscope;
  protected readonly Help = LucideCircleHelp;
  protected readonly Lock = LucideLock;
  protected readonly levels = LEVELS;

  protected readonly suggestions = [
    { label: 'Fièvre depuis 2 jours', icon: LucideThermometer },
    { label: 'Mal de tête persistant', icon: LucideBrain },
    { label: 'Toux et mal de gorge', icon: LucideWind },
    { label: 'Douleur au dos', icon: LucideActivity },
  ];
  protected readonly steps = [
    { title: 'Décrivez', text: 'Expliquez vos symptômes avec vos mots.' },
    { title: 'Recevez une orientation', text: 'Un niveau de vigilance et des conseils prudents.' },
    { title: 'Consultez', text: 'Trouvez le bon spécialiste et réservez.' },
  ];

  protected readonly urgenceOpen = signal(false);
  protected readonly howOpen = signal(false);

  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private n = 1;
  protected readonly messages = signal<Bubble[]>([this.greeting()]);
  protected readonly draft = signal('');
  protected readonly typing = signal(false);

  constructor() {
    effect(() => {
      this.messages();
      this.typing();
      setTimeout(() => {
        const el = this.scroller()?.nativeElement;
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    });
  }

  private greeting(): Bubble {
    return { id: 1, from: 'bot', text: 'Bonjour, je suis votre assistant santé. Décrivez-moi ce que vous ressentez et je vous orienterai vers le bon professionnel.' };
  }

  protected levelIcon(l: Level) {
    return l === 'low' ? LucideCircleCheck : l === 'mid' ? LucideTriangleAlert : LucideShieldAlert;
  }

  protected privacy(): void {
    this.toasts.success('Vos échanges restent privés', 'Ils sont conservés sur cet appareil et ne sont pas partagés avec vos médecins.');
  }

  protected restart(): void {
    this.n = 1;
    this.typing.set(false);
    this.messages.set([this.greeting()]);
  }

  protected ask(text: string): void {
    const t = text.trim();
    if (!t || this.typing()) return;
    this.messages.update((l) => [...l, { id: ++this.n, from: 'me', text: t }]);
    this.draft.set('');
    this.typing.set(true);
    setTimeout(() => {
      const low = t.toLowerCase();
      const r = RULES.find((x) => x.keys.some((k) => low.includes(k))) ?? DEFAULT_REPLY;
      this.typing.set(false);
      this.messages.update((l) => [...l, { id: ++this.n, from: 'bot', text: r.text, level: r.level, specialty: r.specialty, tips: r.tips }]);
    }, 1300);
  }
}