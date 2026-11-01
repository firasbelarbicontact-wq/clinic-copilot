import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  host: { class: 'reveal', '[style.transition-delay.ms]': 'delay()' },
})
export class RevealDirective {
  /** Délai en ms : <div [appReveal]="150"> ou simplement <div appReveal> */
  readonly delay = input(0, {
    alias: 'appReveal',
    transform: (v: unknown) => { const n = Number(v); return v === '' || Number.isNaN(n) ? 0 : n; },
  });

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const io = new IntersectionObserver(([e]) => {
        if (e?.isIntersecting) { this.el.classList.add('is-visible'); io.disconnect(); }
      }, { threshold: 0.12 });
      io.observe(this.el);
      this.destroyRef.onDestroy(() => io.disconnect());
    });
  }
}