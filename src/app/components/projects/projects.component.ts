import { Component, HostListener, computed, signal } from '@angular/core';
import { RevealDirective } from '../../directives/reveal.directive';

/** Una captura del proyecto, con el pie que se muestra bajo la miniatura. */
export interface Captura {
  archivo: string;
  titulo: string;
  /** true para las tomas verticales (móvil), que se muestran más estrechas. */
  vertical?: boolean;
}

export interface Proyecto {
  id: string;
  nombre: string;
  /** Una o dos líneas para la tarjeta. */
  resumen: string;
  descripcion: string;
  stack: string[];
  logros: string[];
  /** Imagen de la tarjeta: no siempre es la primera captura, porque algunas
   *  (el diagrama, las verticales) se recortan mal en la miniatura. */
  portada: string;
  capturas: Captura[];
  /** Ruta relativa al index del portafolio; se resuelve contra el <base href>. */
  demo?: string;
}

const BASE = 'assets/projects/';

@Component({
  selector: 'app-projects',
  imports: [RevealDirective],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.css',
})
export class ProjectsComponent {
  /** Proyecto abierto en la galería; null cuando está cerrada. */
  readonly abierto = signal<Proyecto | null>(null);
  readonly indice = signal(0);

  /**
   * La captura visible, envuelta en una lista de un elemento. La plantilla la
   * recorre con @for para que al cambiar de captura Angular recree el <img>:
   * un nodo nuevo siempre dispara la animación de fundido, mientras que
   * reutilizar el mismo nodo y cambiarle el src no la dispara.
   */
  readonly capturaActual = computed<Captura[]>(() => {
    const proyecto = this.abierto();
    return proyecto ? [proyecto.capturas[this.indice()]] : [];
  });

  readonly proyectos: Proyecto[] = [
    {
      id: 'yquesalehoy',
      nombre: 'YQueSaleHoy',
      resumen:
        'App móvil y panel de administración para descubrir eventos en Perú. La cartelera se alimenta sola desde tres ticketeras y pasa por una cola de revisión humana.',
      descripcion:
        'Producto completo: ingesta automática de eventos desde las principales ticketeras del país, análisis de flyers con IA, revisión humana antes de publicar y una app móvil para el usuario final. Desplegado en un VPS con Docker y Caddy.',
      stack: ['Flutter', '.NET 9', 'Angular 19', 'SQL Server', 'Python', 'Playwright', 'OpenAI', 'Docker'],
      logros: [
        'Tres scrapers en producción, con scoring de confianza y cola de revisión humana antes de publicar.',
        'Ticketmaster con OCR (Tesseract) sobre el flyer: ~110 eventos por ciclo; Joinnus ~20 y Teleticket ~22.',
        'App Flutter con 9 rutas y 46 archivos Dart, notificaciones push (FCM) y Google Sign-In.',
        'Cerca de 180 eventos publicados y desplegado con Docker + Caddy en un VPS.',
      ],
      portada: BASE + 'yquesalehoy-01-detalle-evento.jpg',
      capturas: [
        { archivo: BASE + 'yquesalehoy-01-detalle-evento.jpg', titulo: 'Detalle del evento', vertical: true },
        { archivo: BASE + 'yquesalehoy-02-favoritos.jpg', titulo: 'Favoritos', vertical: true },
        { archivo: BASE + 'yquesalehoy-03-intereses.jpg', titulo: 'Intereses', vertical: true },
        { archivo: BASE + 'yquesalehoy-04-perfil.jpg', titulo: 'Perfil', vertical: true },
      ],
    },
    {
      id: 'sis-transporte',
      nombre: 'Sistema de Encomiendas',
      resumen:
        'Sistema logístico-financiero para una empresa de transporte: ventas, inventario, almacenes y emisión electrónica integrada con SUNAT.',
      descripcion:
        'Sistema de gestión completo sobre Clean Architecture, con autenticación propia y con Google, control de stock por almacén y un flujo de venta que termina emitiendo el comprobante ante SUNAT. La demo pública reproduce el frontend con datos ficticios.',
      stack: ['.NET 8', 'Angular 14', 'SQL Server', 'EF Core', 'Material', 'Tailwind', 'JWT', 'Google OAuth'],
      logros: [
        'Integración venta → SUNAT con patrón Outbox: worker con claim atómico y reintentos con backoff.',
        'Integridad de venta con actualización condicional de stock e idempotencia por IdempotencyKey.',
        'Boleta 03 cerrada de punta a punta: venta, firma, envío y CDR aceptado.',
        '72 tablas, 11 migraciones y 61 pruebas automatizadas.',
      ],
      portada: BASE + 'sis-transporte-04-proceso-ventas.jpg',
      capturas: [
        { archivo: BASE + 'sis-transporte-01-login.jpg', titulo: 'Ingreso' },
        { archivo: BASE + 'sis-transporte-02-clientes.jpg', titulo: 'Clientes' },
        { archivo: BASE + 'sis-transporte-03-productos.jpg', titulo: 'Productos' },
        { archivo: BASE + 'sis-transporte-04-proceso-ventas.jpg', titulo: 'Proceso de ventas' },
        { archivo: BASE + 'sis-transporte-05-categorias.jpg', titulo: 'Categorías' },
        { archivo: BASE + 'sis-transporte-06-proveedores.jpg', titulo: 'Proveedores' },
        { archivo: BASE + 'sis-transporte-07-almacenes.jpg', titulo: 'Almacenes' },
      ],
      // Relativo: se resuelve contra el <base href>, así funciona igual en
      // local (localhost:4200/demo/) y en GitHub Pages (/PortafolioMCC/demo/).
      demo: 'demo/',
    },
    {
      id: 'motorsunat',
      nombre: 'MotorSunat',
      resumen:
        'Motor de comprobantes de pago electrónicos: construye el XML UBL 2.1, lo valida, lo firma y lo envía a SUNAT. Expone 23 endpoints REST.',
      descripcion:
        'Motor de facturación electrónica sobre Clean Architecture, sin interfaz gráfica: toda la operación pasa por su API REST y Swagger. Cubre la construcción y firma del XML, la validación previa contra los esquemas oficiales y el envío a SUNAT con lectura del CDR.',
      stack: ['.NET 8', 'Clean Architecture', 'UBL 2.1', 'XMLDSig', 'SQL Server', 'EF Core', 'Dapper', 'xUnit'],
      logros: [
        'Comprobantes 01, 03, 07 y 08 aceptados por SUNAT Beta con CDR en 0.',
        'Nueve controles antes de firmar: esquemas XSD oficiales, reglas semánticas SUNAT y reglas de nota contra la base de datos.',
        'Firma XMLDSig RSA-SHA256 con verificación local obligatoria: un XML que no se valida a sí mismo no se entrega.',
        'Guía de Remisión Remitente 09 sobre DespatchAdvice, por gateway REST con OAuth 2.0.',
        'Correlativo atómico probado bajo concurrencia (N = 20) y 129 pruebas en verde.',
      ],
      portada: BASE + 'motorsunat-01-swagger-endpoints.jpg',
      capturas: [
        { archivo: BASE + 'motorsunat-02-arquitectura.svg', titulo: 'Arquitectura y flujo de emisión' },
        { archivo: BASE + 'motorsunat-01-swagger-endpoints.jpg', titulo: 'API REST en Swagger' },
      ],
    },
  ];

  /** La galería se cierra con Escape y se navega con las flechas. */
  @HostListener('document:keydown', ['$event'])
  atajo(evento: KeyboardEvent): void {
    if (!this.abierto()) return;
    if (evento.key === 'Escape') this.cerrar();
    if (evento.key === 'ArrowRight') this.ir(1);
    if (evento.key === 'ArrowLeft') this.ir(-1);
  }

  abrir(proyecto: Proyecto): void {
    this.indice.set(0);
    this.abierto.set(proyecto);
    // Sin esto la página de detrás sigue desplazándose bajo la galería.
    document.body.style.overflow = 'hidden';
  }

  cerrar(): void {
    this.abierto.set(null);
    document.body.style.overflow = '';
  }

  ir(delta: number): void {
    const proyecto = this.abierto();
    if (!proyecto) return;
    const total = proyecto.capturas.length;
    this.indice.update((i) => (i + delta + total) % total);
  }

  irA(i: number): void {
    this.indice.set(i);
  }
}
