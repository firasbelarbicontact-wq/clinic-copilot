import { Routes } from '@angular/router';
import { LandingPage } from './features/landing/landing-page';

export const routes: Routes = [
  { path: '', component: LandingPage, title: 'Clinic Copilot · De vos symptômes, vers les bons soins' },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
    title: 'Créer un compte · Clinic Copilot',
  },
  {
    path: 'medecins',
    loadComponent: () => import('./features/doctors/directory-page').then((m) => m.DirectoryPage),
    title: 'Annuaire des médecins · Clinic Copilot',
  },
  {
    path: 'medecins/:id',
    loadComponent: () => import('./features/doctors/doctor-profile-page').then((m) => m.DoctorProfilePage),
    title: 'Fiche médecin · Clinic Copilot',
  },
];