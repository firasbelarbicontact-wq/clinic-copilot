import { Routes } from '@angular/router';
import { LandingPage } from './features/landing/landing-page';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  { path: '', component: LandingPage, title: 'Clinic Copilot · De vos symptômes, vers les bons soins' },
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
    {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login-page').then((m) => m.LoginPage),
    title: 'Connexion · Clinic Copilot',
  },
  {
    path: 'inscription',
    loadComponent: () => import('./features/auth/register-page').then((m) => m.RegisterPage),
    title: 'Créer un compte · Clinic Copilot',
  },
  {
  path: 'mot-de-passe-oublie',
  loadComponent: () => import('./features/auth/forgot-password-page').then((m) => m.ForgotPasswordPage),
  },
    {
    path: 'admin',
    canActivate: [roleGuard('ADMIN')],
    loadComponent: () => import('./features/admin/admin-space').then((m) => m.AdminSpace),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/admin/admin-page').then((m) => m.AdminPage),
        title: 'Vérification des médecins · Clinic Copilot',
      },
    ],
  },
    
    {
    path: 'espace-medecin',
    canActivate: [roleGuard('DOCTOR')],
    loadComponent: () => import('./features/doctors/doctor-space').then((m) => m.DoctorSpace),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/doctors/doctor-home-page').then((m) => m.DoctorHomePage),
        title: 'Espace Médecin · Clinic Copilot',
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/doctors/my-profile-page').then((m) => m.MyProfilePage),
        title: 'Mon profil · Clinic Copilot',
      },
      {
        path: 'diplomes',
        loadComponent: () => import('./features/doctors/my-diplomas-page').then((m) => m.MyDiplomasPage),
        title: 'Mes diplômes · Clinic Copilot',
      },
     { 
        path: 'agenda',
        loadComponent: () => import('./features/doctors/doctor-agenda-page').then((m) => m.DoctorAgendaPage),
        title: 'Agenda · Clinic Copilot',
      },
            {
        path: 'patients',
        loadComponent: () => import('./features/doctors/doctor-patients-page').then((m) => m.DoctorPatientsPage),
        title: 'Mes patients · Clinic Copilot',
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/doctors/doctor-messages-page').then((m) => m.DoctorMessagesPage),
        title: 'Messagerie · Clinic Copilot',
      },
      {
        path: 'avis',
        loadComponent: () => import('./features/doctors/doctor-reviews-page').then((m) => m.DoctorReviewsPage),
        title: 'Avis reçus · Clinic Copilot',
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications-page').then((m) => m.NotificationsPage),
        title: 'Notifications · Clinic Copilot',
      },
    ],
  },
];