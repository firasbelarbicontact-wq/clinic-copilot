import { Component } from '@angular/core';
import {
  LucideActivity, LucideBell, LucideBot, LucideCalendarDays, LucideChartColumn, LucideHouse,
  LucideLayoutDashboard, LucideMessageCircle, LucideSearch, LucideSend, LucideSettings,
  LucideShield, LucideStar, LucideStethoscope, LucideUser, LucideUsers,
} from '@lucide/angular';
import { Icon } from '../../shared/ui/icon';
import { UrgencyBadge } from './cards';
import { doctorAgenda, doctorsList, patientAppointments } from './landing.data';

@Component({
  selector: 'app-phone-mockup',
  host: { class: 'relative block w-[220px] shrink-0 rounded-[2.2rem] bg-deep p-2 shadow-soft' },
  template: `
    <div class="relative h-[440px] overflow-hidden rounded-[1.8rem] bg-background">
      <div class="flex items-center justify-between px-5 pt-2.5 text-[10px] font-semibold text-deep">
        <span>9:41</span><span class="h-4 w-16 rounded-full bg-deep"></span><span>100%</span>
      </div>
      <div class="h-full px-3 pt-2 text-deep"><ng-content /></div>
    </div>
  `,
})
export class PhoneMockup {}

@Component({
  selector: 'app-laptop-mockup',
  host: { class: 'block w-full' },
  template: `
    <div class="rounded-t-2xl border-[10px] border-b-0 border-deep bg-deep">
      <div class="aspect-[16/10] overflow-hidden rounded-md bg-background"><ng-content /></div>
    </div>
    <div class="mx-auto h-3 w-[108%] -translate-x-[3.7%] rounded-b-2xl bg-deep-muted"></div>
  `,
})
export class LaptopMockup {}

@Component({
  selector: 'app-dashboard-preview',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="flex h-full text-[11px] text-deep">
      <aside class="flex w-12 flex-col items-center gap-3 bg-deep py-3 sm:w-36 sm:items-stretch sm:px-3">
        <div class="flex items-center gap-1.5 text-deep-foreground">
          <img src="images/logo.png" alt="" class="h-6 w-6 rounded bg-card p-0.5" /><span class="hidden font-bold sm:inline">Clinic Copilot</span>
        </div>
        @for (item of side; track item.label; let i = $index) {
          <div class="flex items-center gap-2 rounded-md p-1.5" [class]="i === 0 ? 'bg-primary text-primary-foreground' : 'text-deep-foreground/70'">
            <app-icon [icon]="item.icon" [size]="14" /><span class="hidden sm:inline">{{ item.label }}</span>
          </div>
        }
      </aside>
      <div class="flex-1 space-y-2.5 overflow-hidden p-3 sm:p-4">
        <div>
          <p class="text-sm font-bold sm:text-base">Bonjour, Sarah</p>
          <p class="text-muted-foreground">Comment vous sentez-vous aujourd'hui ?</p>
        </div>
        <div class="flex items-center gap-2 rounded-xl bg-gradient-primary p-2.5 text-primary-foreground">
          <app-icon [icon]="Bot" [size]="20" />
          <div class="min-w-0 flex-1"><p class="font-semibold">Assistant IA</p><p class="truncate opacity-85">Décrivez vos symptômes pour être orienté</p></div>
          <span class="rounded-full bg-card px-2 py-0.5 font-semibold text-primary">Démarrer</span>
        </div>
        <div class="grid grid-cols-2 gap-2.5">
          <div class="rounded-xl border border-border bg-card p-2.5">
            <p class="mb-1.5 font-semibold">Prochains rendez-vous</p>
            @for (a of appointments; track a.doctor) {
              <div class="mb-1.5 flex items-center gap-1.5">
                <span class="text-primary"><app-icon [icon]="CalendarDays" [size]="12" /></span>
                <div class="min-w-0"><p class="truncate font-medium">{{ a.doctor }}</p><p class="truncate text-muted-foreground">{{ a.date }}</p></div>
              </div>
            }
          </div>
          <div class="space-y-2.5">
            <div class="rounded-xl border border-border bg-card p-2.5"><p class="font-semibold">Messages</p><p class="text-muted-foreground"><span class="font-semibold text-primary">2</span> nouveaux messages</p></div>
            <div class="rounded-xl border border-border bg-card p-2.5"><p class="font-semibold">Rappels</p><p class="text-muted-foreground">Vitamine D, 20:00</p></div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardPreview {
  protected readonly Bot = LucideBot;
  protected readonly CalendarDays = LucideCalendarDays;
  protected readonly appointments = patientAppointments;
  protected readonly side = [
    { label: 'Accueil', icon: LucideLayoutDashboard },
    { label: 'Assistant IA', icon: LucideBot },
    { label: 'Rendez-vous', icon: LucideCalendarDays },
    { label: 'Messages', icon: LucideMessageCircle },
    { label: 'Rappels', icon: LucideBell },
    { label: 'Paramètres', icon: LucideSettings },
  ];
}

@Component({
  selector: 'app-phone-nav',
  imports: [Icon],
  host: { class: 'absolute inset-x-0 bottom-0 block' },
  template: `
    <div class="flex justify-around border-t border-border bg-card py-2.5 text-muted-foreground">
      <span class="text-primary"><app-icon [icon]="House" [size]="16" /></span>
      <app-icon [icon]="CalendarDays" [size]="16" /><app-icon [icon]="MessageCircle" [size]="16" /><app-icon [icon]="User" [size]="16" />
    </div>
  `,
})
export class PhoneNav {
  protected readonly House = LucideHouse;
  protected readonly CalendarDays = LucideCalendarDays;
  protected readonly MessageCircle = LucideMessageCircle;
  protected readonly User = LucideUser;
}

@Component({
  selector: 'app-phone-patient-home',
  imports: [Icon, PhoneNav],
  template: `
    <div class="space-y-2.5 text-[10px]">
      <p class="text-sm font-bold">Bonjour, Sarah</p>
      <div class="rounded-xl bg-gradient-primary p-2.5 text-primary-foreground">
        <app-icon [icon]="Bot" [size]="16" /><p class="font-semibold">Assistant IA</p><p class="opacity-85">Comment puis-je vous aider ?</p>
      </div>
      <p class="font-semibold">Prochains rendez-vous</p>
      @for (a of appointments; track a.doctor) {
        <div class="rounded-lg border border-border bg-card p-2"><p class="font-semibold">{{ a.doctor }}</p><p class="text-muted-foreground">{{ a.specialty }} · {{ a.date }}</p></div>
      }
      <div class="grid grid-cols-2 gap-2">
        <div class="rounded-lg bg-soft p-2"><span class="text-primary"><app-icon [icon]="MessageCircle" [size]="14" /></span><p class="mt-1 font-semibold">Messages</p></div>
        <div class="rounded-lg bg-soft p-2"><span class="text-primary"><app-icon [icon]="Bell" [size]="14" /></span><p class="mt-1 font-semibold">Rappels</p></div>
      </div>
      <app-phone-nav />
    </div>
  `,
})
export class PhonePatientHome {
  protected readonly Bot = LucideBot;
  protected readonly MessageCircle = LucideMessageCircle;
  protected readonly Bell = LucideBell;
  protected readonly appointments = patientAppointments;
}

@Component({
  selector: 'app-phone-login',
  template: `
    <div class="flex flex-col items-center pt-8 text-[10px]">
      <img src="images/logo.png" alt="" class="h-16 w-16 object-contain" />
      <p class="mt-2 text-sm font-bold">Clinic Copilot</p>
      <p class="text-muted-foreground">Votre santé, guidée intelligemment</p>
      <div class="mt-6 w-full space-y-2">
        <div class="rounded-lg border border-border bg-card p-2.5 text-muted-foreground">sarah&#64;email.fr</div>
        <div class="rounded-lg border border-border bg-card p-2.5 text-muted-foreground">••••••••</div>
        <div class="rounded-full bg-gradient-primary p-2.5 text-center font-semibold text-primary-foreground">Se connecter</div>
        <p class="pt-2 text-center text-muted-foreground">Pas de compte ? <span class="font-semibold text-primary">S'inscrire</span></p>
      </div>
    </div>
  `,
})
export class PhoneLogin {}

@Component({
  selector: 'app-phone-chat',
  imports: [Icon, UrgencyBadge],
  template: `
    <div class="flex h-[400px] flex-col text-[10px]">
      <div class="mb-2 flex items-center justify-center gap-1.5 font-semibold"><span class="text-primary"><app-icon [icon]="Bot" [size]="16" /></span> Assistant IA</div>
      <div class="flex-1 space-y-2">
        <div class="max-w-[85%] rounded-xl rounded-tl-sm bg-soft p-2">Bonjour ! Quels symptômes ressentez-vous ?</div>
        <div class="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary p-2 text-primary-foreground">J'ai de la fièvre depuis 3 jours.</div>
        <div class="max-w-[85%] rounded-xl rounded-tl-sm bg-soft p-2">Avez-vous des difficultés à respirer ?</div>
        <div class="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-primary p-2 text-primary-foreground">Non, juste de la fatigue.</div>
        <div class="rounded-xl border border-warning/50 bg-warning/10 p-2">
          <p class="font-semibold">Résultat de l'orientation</p>
          <app-urgency-badge level="urgent" class="mt-1" />
          <p class="mt-1 text-muted-foreground">Consultez sous 24 h.</p>
        </div>
      </div>
      <div class="mb-3 flex items-center gap-1.5 rounded-full border border-border bg-card p-1.5 pl-3 text-muted-foreground">
        Écrire un message
        <span class="ml-auto rounded-full bg-primary p-1 text-primary-foreground"><app-icon [icon]="Send" [size]="12" /></span>
      </div>
    </div>
  `,
})
export class PhoneChat {
  protected readonly Bot = LucideBot;
  protected readonly Send = LucideSend;
}

@Component({
  selector: 'app-phone-doctors',
  imports: [Icon, PhoneNav],
  template: `
    <div class="space-y-2 text-[10px]">
      <p class="text-sm font-bold">Médecins</p>
      <div class="flex items-center gap-1.5 rounded-lg border border-border bg-card p-2 text-muted-foreground"><app-icon [icon]="Search" [size]="14" /> Spécialité, nom…</div>
      @for (d of doctors; track d.name) {
        <div class="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-soft text-primary"><app-icon [icon]="Stethoscope" [size]="14" /></span>
          <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ d.name }}</p><p class="text-muted-foreground">{{ d.specialty }}</p></div>
          <span class="flex items-center gap-0.5 font-semibold"><span class="text-accent"><app-icon [icon]="Star" [size]="12" /></span>{{ d.rating }}</span>
        </div>
      }
      <app-phone-nav />
    </div>
  `,
})
export class PhoneDoctors {
  protected readonly Search = LucideSearch;
  protected readonly Stethoscope = LucideStethoscope;
  protected readonly Star = LucideStar;
  protected readonly doctors = doctorsList;
}

@Component({
  selector: 'app-patient-mini',
  imports: [Icon],
  template: `
    <div class="space-y-2 rounded-xl bg-card p-3 text-xs shadow-soft">
      <p class="font-bold text-deep">Bonjour, Sarah</p>
      <div class="flex items-center gap-2 rounded-lg bg-gradient-primary p-2 text-primary-foreground"><app-icon [icon]="Bot" [size]="16" /> Décrire mes symptômes</div>
      <div class="rounded-lg border border-border p-2"><p class="font-semibold text-deep">Dr. Karim Haddad</p><p class="text-muted-foreground">Demain, 10:00</p></div>
    </div>
  `,
})
export class PatientMini {
  protected readonly Bot = LucideBot;
}

@Component({
  selector: 'app-doctor-mini',
  imports: [UrgencyBadge],
  template: `
    <div class="space-y-2 rounded-xl bg-card p-3 text-xs shadow-soft">
      <div class="grid grid-cols-3 gap-1.5 text-center">
        @for (s of stats; track s.label) {
          <div class="rounded-lg bg-soft p-1.5"><p class="text-base font-bold text-primary">{{ s.value }}</p><p class="text-muted-foreground">{{ s.label }}</p></div>
        }
      </div>
      @for (a of agenda; track a.time) {
        <div class="flex items-center gap-2 rounded-lg border border-border p-1.5">
          <span class="font-semibold text-deep">{{ a.time }}</span>
          <span class="min-w-0 flex-1 truncate text-muted-foreground">{{ a.patient }}</span>
          <app-urgency-badge [level]="a.level" />
        </div>
      }
    </div>
  `,
})
export class DoctorMini {
  protected readonly agenda = doctorAgenda;
  protected readonly stats = [{ label: 'RDV', value: '14' }, { label: 'Urgents', value: '2' }, { label: 'Occup.', value: '86%' }];
}

@Component({
  selector: 'app-admin-mini',
  imports: [Icon],
  template: `
    <div class="space-y-2 rounded-xl bg-card p-3 text-xs shadow-soft">
      <div class="grid grid-cols-3 gap-1.5 text-center">
        @for (s of stats; track s.value) {
          <div class="rounded-lg bg-soft p-1.5">
            <span class="text-primary"><app-icon [icon]="s.icon" [size]="14" /></span>
            <p class="font-bold text-deep">{{ s.value }}</p>
          </div>
        }
      </div>
      <div class="rounded-lg border border-border p-2">
        <p class="mb-1.5 flex items-center gap-1 font-semibold text-deep"><span class="text-primary"><app-icon [icon]="ChartColumn" [size]="14" /></span>Activité</p>
        <div class="flex h-12 items-end gap-1">
          @for (h of bars; track $index) { <div class="flex-1 rounded-t bg-gradient-primary" [style.height.%]="h"></div> }
        </div>
      </div>
      <p class="flex items-center gap-1 text-muted-foreground"><span class="text-success"><app-icon [icon]="Activity" [size]="14" /></span>Tous les services opérationnels</p>
    </div>
  `,
})
export class AdminMini {
  protected readonly ChartColumn = LucideChartColumn;
  protected readonly Activity = LucideActivity;
  protected readonly bars = [40, 65, 50, 80, 60, 90, 75];
  protected readonly stats = [
    { icon: LucideUsers, value: '1 240' },
    { icon: LucideStethoscope, value: '48' },
    { icon: LucideShield, value: '100%' },
  ];
}