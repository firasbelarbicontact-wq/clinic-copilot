import { Component } from '@angular/core';
import { LucideShieldCheck } from '@lucide/angular';
import { DashboardLayout, NavItem } from '../../shared/layout/dashboard-layout';

@Component({
  selector: 'app-admin-space',
  imports: [DashboardLayout],
  template: `<app-dashboard-layout label="Espace Administrateur" [links]="links" />`,
})
export class AdminSpace {
  protected readonly links: NavItem[] = [
    { label: 'Vérification', to: '/admin', icon: LucideShieldCheck, exact: true },
  ];
}