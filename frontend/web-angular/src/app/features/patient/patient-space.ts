import { Component } from '@angular/core';
import {
  LucideBell, LucideBot, LucideCalendarDays, LucideCompass, LucideLayoutDashboard, LucideMessageCircle, LucideSettings, LucideUserRound,
} from '@lucide/angular';
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';
import { ToastsHost } from './toasts';

@Component({
  selector: 'app-patient-space',
  imports: [DashboardLayout, ToastsHost],
  template: `
    <app-dashboard-layout label="Espace Patient" [links]="links" profileLink="/espace-patient/profil" notificationsLink="/espace-patient/rappels" />
    <app-toasts />
  `,
})
export class PatientSpace {
  protected readonly links: NavItem[] = [
    { label: 'Accueil', to: '/espace-patient', icon: LucideLayoutDashboard, exact: true, section: 'Mon suivi' },
    { label: 'Mes rendez-vous', to: '/espace-patient/rendez-vous', icon: LucideCalendarDays, section: 'Mon suivi' },
    { label: 'Messagerie', to: '/espace-patient/messages', icon: LucideMessageCircle, section: 'Mon suivi' },
    { label: 'Assistant IA', to: '/espace-patient/assistant', icon: LucideBot, section: 'Mon suivi' },
    { label: 'Rappels', to: '/espace-patient/rappels', icon: LucideBell, section: 'Mon suivi' },
    { label: 'Découvrir', to: '/espace-patient/medecins', icon: LucideCompass, section: 'Découvrir' },
    { label: 'Mon profil', to: '/espace-patient/profil', icon: LucideUserRound, section: 'Compte' },
    { label: 'Paramètres', to: '/espace-patient/settings'.replace('settings', 'parametres'), icon: LucideSettings, section: 'Compte' },
  ];
}