import { Component } from '@angular/core';
<<<<<<< HEAD
import { LucideShieldCheck } from '@lucide/angular';
=======
import { LucideHistory, LucideLayoutDashboard, LucideMessageCircle, LucideStethoscope, LucideUsers } from '@lucide/angular';
>>>>>>> origin/main
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';

@Component({
  selector: 'app-admin-space',
  imports: [DashboardLayout],
  template: `<app-dashboard-layout label="Espace Administrateur" [links]="links" />`,
})
export class AdminSpace {
  protected readonly links: NavItem[] = [
<<<<<<< HEAD
    { label: 'Vérification', to: '/admin', icon: LucideShieldCheck, exact: true },
=======
    { label: 'Accueil', to: '/admin', icon: LucideLayoutDashboard, exact: true },
    { label: 'Médecins', to: '/admin/medecins', icon: LucideStethoscope, section: 'Gestion' },
    { label: 'Avis', to: '/admin/avis', icon: LucideMessageCircle },
    { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: LucideUsers },
    { label: "Journal d'audit", to: '/admin/audit', icon: LucideHistory, section: 'Supervision' },
>>>>>>> origin/main
  ];
}