import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideArrowRight, LucideBot, LucideShieldAlert, LucideSmartphone } from '@lucide/angular';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { Footer } from '../../shared/layout/footer';
import { Header } from '../../shared/layout/header';
import { Icon } from '../../shared/ui/icon';
import { FeatureCard, RoleCard, SectionTitle, StepCard, UrgencyCard } from './cards';
import { features, security, steps, urgencyLevels } from './landing.data';
import {
  AdminMini, DashboardPreview, DoctorMini, LaptopMockup, PatientMini, PhoneChat, PhoneDoctors,
  PhoneLogin, PhoneMockup, PhonePatientHome,
} from './mockups';

@Component({
  selector: 'app-landing-page',
  imports: [
    RouterLink, RevealDirective, Header, Footer, Icon, SectionTitle, FeatureCard, StepCard, UrgencyCard, RoleCard,
    LaptopMockup, PhoneMockup, DashboardPreview, PhonePatientHome, PhoneLogin, PhoneChat, PhoneDoctors,
    PatientMini, DoctorMini, AdminMini,
  ],
  templateUrl: './landing-page.html',
})
export class LandingPage {
  protected readonly features = features;
  protected readonly steps = steps;
  protected readonly urgencyLevels = urgencyLevels;
  protected readonly security = security;
  protected readonly Bot = LucideBot;
  protected readonly ArrowRight = LucideArrowRight;
  protected readonly ShieldAlert = LucideShieldAlert;
  protected readonly Smartphone = LucideSmartphone;
}