import { Component } from '@angular/core';
import { LucideFileCheck, LucideLayoutDashboard, LucideUserRound } from '@lucide/angular';
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';

@Component({
  selector: 'app-doctor-space',
  imports: [DashboardLayout],
  template: `<app-dashboard-layout label="Espace Médecin" [links]="links" />`,
})
export class DoctorSpace {
  protected readonly links: NavItem[] = [
    { label: 'Accueil', to: '/espace-medecin', icon: LucideLayoutDashboard, exact: true },
    { label: 'Mon profil', to: '/espace-medecin/profil', icon: LucideUserRound },
    { label: 'Diplômes', to: '/espace-medecin/diplomes', icon: LucideFileCheck },
  ];
}