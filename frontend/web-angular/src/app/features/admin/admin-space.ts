import { Component } from '@angular/core';
import { LucideHistory, LucideLayoutDashboard, LucideMessageCircle, LucideStethoscope, LucideUsers } from '@lucide/angular';
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';

@Component({
  selector: 'app-admin-space',
  imports: [DashboardLayout],
  template: `<app-dashboard-layout label="Espace Administrateur" [links]="links" />`,
})
export class AdminSpace {
  protected readonly links: NavItem[] = [
    { label: 'Accueil', to: '/admin', icon: LucideLayoutDashboard, exact: true },
    { label: 'Médecins', to: '/admin/medecins', icon: LucideStethoscope, section: 'Gestion' },
    { label: 'Avis', to: '/admin/avis', icon: LucideMessageCircle },
    { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: LucideUsers },
    { label: "Journal d'audit", to: '/admin/audit', icon: LucideHistory, section: 'Supervision' },
  ];
}