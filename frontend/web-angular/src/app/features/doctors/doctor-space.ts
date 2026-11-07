import { Component } from '@angular/core';
import {
  LucideCalendarDays, LucideGraduationCap, LucideLayoutDashboard, LucideMessageCircle, LucideStar, LucideUserRound, LucideUsers,
} from '@lucide/angular';
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';

@Component({
  selector: 'app-doctor-space',
  imports: [DashboardLayout],
  template: `<app-dashboard-layout label="Espace Médecin" [links]="links" profileLink="/espace-medecin/profil" notificationsLink="/espace-medecin/notifications" />`,
})
export class DoctorSpace {
    protected readonly links: NavItem[] = [
    { label: 'Accueil', to: '/espace-medecin', icon: LucideLayoutDashboard, exact: true, section: 'Activité' },
    { label: 'Agenda', to: '/espace-medecin/agenda', icon: LucideCalendarDays, section: 'Activité' },
    { label: 'Patients', to: '/espace-medecin/patients', icon: LucideUsers, section: 'Activité' },
    { label: 'Messages', to: '/espace-medecin/messages', icon: LucideMessageCircle, section: 'Activité' },
    { label: 'Mon profil', to: '/espace-medecin/profil', icon: LucideUserRound, section: 'Mon cabinet' },
    { label: 'Avis reçus', to: '/espace-medecin/avis', icon: LucideStar, section: 'Mon cabinet' },
    { label: 'Diplômes', to: '/espace-medecin/diplomes', icon: LucideGraduationCap, section: 'Mon cabinet' },
  ];
}