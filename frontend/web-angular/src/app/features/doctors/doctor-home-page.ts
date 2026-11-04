import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-doctor-home-page',
  imports: [RouterLink],
  template: `
    <section class="bg-gradient-soft">
      <div class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 class="text-3xl font-bold tracking-tight text-deep">Bonjour, <span class="text-gradient">docteur</span></h1>
        <p class="mt-2 text-muted-foreground">Connecté en tant que {{ auth.session()?.email }}.</p>

        <div class="mt-8 grid gap-5 sm:grid-cols-2">
          <article class="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 class="text-lg font-semibold text-deep">Visibilité dans l'annuaire</h2>
            <p class="mt-2 text-sm text-muted-foreground">
              Votre fiche apparaît dans l'annuaire public dès que votre diplôme a été vérifié par un administrateur.
            </p>
            <a routerLink="/medecins" class="btn btn-soft mt-4">Voir l'annuaire</a>
          </article>
          <article class="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 class="text-lg font-semibold text-deep">Agenda et rendez-vous</h2>
            <p class="mt-2 text-sm text-muted-foreground">Vos disponibilités et vos rendez-vous arriveront ici prochainement.</p>
          </article>
        </div>
      </div>
    </section>
  `,
})
export class DoctorHomePage {
  protected readonly auth = inject(AuthService);
}