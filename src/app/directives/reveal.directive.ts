import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

/**
 * Aparición suave cuando el elemento entra en pantalla.
 *
 * Se aplica una sola vez y solo desplaza unos píxeles: la idea es que la página
 * respire, no que llame la atención. La clase que oculta el elemento la añade
 * esta directiva por JS, así que si el JavaScript no llega a correr el
 * contenido se ve igual — nunca se esconde nada desde el HTML.
 *
 * Con `prefers-reduced-motion: reduce` no se anima nada.
 *
 * Uso:  <div appReveal>            → sin retardo
 *       <div [appReveal]="120">    → 120 ms de retardo, para escalonar hermanos
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit, OnDestroy {
  /**
   * Retardo en milisegundos, para escalonar varios elementos hermanos.
   * Acepta también la cadena vacía que Angular pasa cuando el atributo se usa
   * suelto (`<div appReveal>`), que es la forma cómoda cuando no hay retardo.
   */
  readonly retardo = input<number | string>(0, { alias: 'appReveal' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private observador?: IntersectionObserver;

  ngOnInit(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const el = this.host.nativeElement;
    // El atributo suelto (`appReveal` sin valor) llega como cadena vacía.
    const ms = Number(this.retardo()) || 0;
    if (ms > 0) el.style.transitionDelay = `${ms}ms`;

    el.classList.add('revelar');

    this.observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          el.classList.add('revelar-visible');
          this.observador?.disconnect();
        }
      },
      // El margen inferior retrasa el disparo hasta que el elemento está algo
      // metido en pantalla; si no, salta en cuanto asoma un píxel.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.04 },
    );
    this.observador.observe(el);
  }

  ngOnDestroy(): void {
    this.observador?.disconnect();
  }
}
