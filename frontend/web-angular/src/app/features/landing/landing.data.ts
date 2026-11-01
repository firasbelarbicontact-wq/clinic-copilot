import {
  LucideBell, LucideBellRing, LucideBrain, LucideCalendarCheck, LucideCalendarClock, LucideClipboardList,
  LucideCpu, LucideHeartPulse, LucideKeyRound, LucideLeaf, LucideLock, LucideMessageSquareLock,
  LucideMessagesSquare, LucideShieldCheck, LucideSiren, LucideStethoscope, LucideTriangleAlert,
  LucideUserCheck, LucideUserSearch,
} from '@lucide/angular';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconData = any;
export interface IconItem { icon: IconData; title: string; text: string; }
export type UrgencyLevel = 'urgence' | 'urgent' | 'courant' | 'conseil';

export const navLinks = [
  { label: 'Fonctionnalités', fragment: 'fonctionnalites' },
  { label: 'Comment ça marche', fragment: 'comment-ca-marche' },
  { label: 'Espaces', fragment: 'espaces' },
  { label: 'Sécurité', fragment: 'securite' },
];

export const features: IconItem[] = [
  { icon: LucideBrain, title: 'Symptômes & IA', text: "Décrivez ce que vous ressentez, l'IA vous guide pas à pas." },
  { icon: LucideStethoscope, title: 'Médecins & spécialités', text: 'Le bon praticien selon votre besoin et votre localisation.' },
  { icon: LucideCalendarCheck, title: 'Rendez-vous faciles', text: 'Réservez un créneau disponible en quelques secondes.' },
  { icon: LucideMessageSquareLock, title: 'Chat sécurisé', text: 'Échangez avec votre médecin en toute confidentialité.' },
  { icon: LucideBellRing, title: 'Rappels & notifications', text: 'Ne manquez plus aucun rendez-vous ni traitement.' },
];

export const steps: IconItem[] = [
  { icon: LucideClipboardList, title: 'Décrivez vos symptômes', text: 'Répondez à quelques questions simples, à votre rythme.' },
  { icon: LucideShieldCheck, title: 'Recevez une orientation prudente', text: "L'IA évalue le niveau d'urgence avec prudence." },
  { icon: LucideUserSearch, title: 'Trouvez le bon médecin', text: 'Spécialité, disponibilités et proximité réunies.' },
  { icon: LucideCalendarClock, title: 'Réservez un créneau', text: "Choisissez l'horaire qui vous convient." },
  { icon: LucideMessagesSquare, title: 'Échangez avec le médecin', text: 'Le résumé IA est partagé avec votre accord.' },
  { icon: LucideBell, title: 'Recevez vos rappels', text: 'Notifications avant chaque rendez-vous.' },
];

export const urgencyLevels: (IconItem & { level: UrgencyLevel })[] = [
  { level: 'urgence', icon: LucideSiren, title: 'Urgence', text: "Appelez immédiatement les urgences (190, SAMU). Aucune réservation n'est proposée." },
  { level: 'urgent', icon: LucideTriangleAlert, title: 'Urgent', text: 'Consultation recommandée dans les 24 heures avec un créneau prioritaire.' },
  { level: 'courant', icon: LucideHeartPulse, title: 'Courant', text: 'Prenez rendez-vous avec un médecin dans les prochains jours.' },
  { level: 'conseil', icon: LucideLeaf, title: 'Conseil général', text: "Conseils de prévention et d'auto-soin, à surveiller." },
];

export const security: IconItem[] = [
  { icon: LucideUserCheck, title: 'Consentement du patient', text: "Rien n'est partagé avec un médecin sans votre accord explicite." },
  { icon: LucideKeyRound, title: 'Accès par rôle', text: 'Patients, médecins et administrateurs ne voient que ce qui les concerne.' },
  { icon: LucideCpu, title: 'IA exécutée localement', text: "L'analyse des symptômes est traitée sans envoi à des services tiers." },
  { icon: LucideLock, title: 'Données chiffrées', text: 'Chiffrement en transit et au repos pour toutes vos informations.' },
];

export const patientAppointments = [
  { doctor: 'Dr. Karim Haddad', specialty: 'Médecine générale', date: 'Demain, 10:00' },
  { doctor: 'Dr. Léa Martin', specialty: 'Dermatologie', date: 'Jeu. 24 oct., 14:30' },
];

export const doctorAgenda = [
  { time: '09:00', patient: 'Sarah B.', level: 'courant' as UrgencyLevel },
  { time: '10:00', patient: 'Yassine M.', level: 'urgent' as UrgencyLevel },
  { time: '11:30', patient: 'Claire D.', level: 'conseil' as UrgencyLevel },
];

export const doctorsList = [
  { name: 'Dr. Karim Haddad', specialty: 'Généraliste', rating: '4,9' },
  { name: 'Dr. Léa Martin', specialty: 'Dermatologue', rating: '4,8' },
  { name: 'Dr. Omar Ben Ali', specialty: 'Cardiologue', rating: '4,9' },
  { name: 'Dr. Inès Roy', specialty: 'Pédiatre', rating: '4,7' },
];