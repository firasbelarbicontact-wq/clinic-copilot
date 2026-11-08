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
    title: 'Mot de passe oublié · Clinic Copilot',
  },

  // ───────────── ESPACE PATIENT ─────────────
  {
    path: 'espace-patient',
    canActivate: [roleGuard('PATIENT')],
    loadComponent: () => import('./features/patient/patient-space').then((m) => m.PatientSpace),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/patient/patient-home-page').then((m) => m.PatientHomePage),
        title: 'Espace Patient · Clinic Copilot',
      },
      {
        path: 'rendez-vous',
        loadComponent: () => import('./features/patient/appointments-page').then((m) => m.AppointmentsPage),
        title: 'Mes rendez-vous · Clinic Copilot',
      },
      {
        path: 'medecins',
        loadComponent: () => import('./features/patient/doctors-page').then((m) => m.DoctorsPage),
        title: 'Découvrir les médecins · Clinic Copilot',
      },
      {
        path: 'medecins/:id',
        loadComponent: () => import('./features/patient/doctor-detail-page').then((m) => m.DoctorDetailPage),
        title: 'Fiche médecin · Clinic Copilot',
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/patient/patient-profile-page').then((m) => m.PatientProfilePage),
        title: 'Mon profil · Clinic Copilot',
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/patient/patient-messages-page').then((m) => m.PatientMessagesPage),
        title: 'Messagerie · Clinic Copilot',
      },
      {
        path: 'assistant',
        loadComponent: () => import('./features/patient/assistant-page').then((m) => m.AssistantPage),
        title: 'Assistant IA · Clinic Copilot',
      },
      {
        path: 'rappels',
        loadComponent: () => import('./features/patient/reminders-page').then((m) => m.RemindersPage),
        title: 'Rappels · Clinic Copilot',
      },
      {
        path: 'parametres',
        loadComponent: () => import('./features/patient/settings-page').then((m) => m.SettingsPage),
        title: 'Paramètres · Clinic Copilot',
      },
    ],
  },

  // ───────────── ESPACE ADMIN ─────────────
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

  // ───────────── ESPACE MÉDECIN ─────────────
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