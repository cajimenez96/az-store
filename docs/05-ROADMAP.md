# 05 — Roadmap: Tareas, Estado y Futuro del Proyecto

## Estado de Avance General

```
Fase 1: Setup e Infraestructura     ██████████████  100%
Fase 2: Integración Mercado Pago    ██████████████  100%
Fase 3: Interfaz Storefront         ██████████████  100%
Fase 4: Punto de Venta (POS) Local  ██████████████  100%
Fase 5: App Móvil (Expo)            ░░░░░░░░░░░░░░    0%
Fase 6: Desacoplamiento de API      ░░░░░░░░░░░░░░    0%
```

---

## Fases Completadas

### ✅ Fase 1: Setup e Infraestructura
* **1.1** Migración de la estructura base a `az-store`.
* **1.2** Remoción completa de pasarelas obsoletas (Stripe y PayPal) a nivel de dependencias e interfaz.
* **1.3** Normalización de base de datos a 3NF agregando marcas (`Brand`), categorías (`Category`), subcategorías (`SubCategory`), talles (`Size`) y variante-stock pivot (`ProductVariant`).
* **1.4** Migración y actualización segura de base de datos local y seeding con datos de prueba estructurados.

### ✅ Fase 2: Integración Mercado Pago (Backend)
* **2.1** Instalación del SDK de Mercado Pago.
* **2.2** Configuración del webhook IPN seguro en `/api/webhooks/mercadopago` con validación de estados y procesamiento diferido de stock.
* **2.3** Adición de la acción `createMercadoPagoOrder` para inicializar el Checkout Pro de forma dinámica basándose en la URL de entorno.

### ✅ Fase 3: Interfaz Storefront (Frontend)
* **3.1** Remoción de botones de pago obsoletos y adaptación del selector de medios de pago en el checkout online.
* **3.2** Panel ERP administrativo funcional con alertas visuales de stock crítico para variantes (stock <= 2) y métricas de facturación consolidada.
* **3.3** Flujo completo de carga de comprobantes mediante Uploadthing para compras online con transferencia bancaria y aprobación/rechazo administrativo.

### ✅ Fase 4: Punto de Venta (POS) Local y Operación de Caja
* **4.1** Implementación de la acción transaccional `createPosOrder` para ventas en tienda física sin requerir direcciones de envío y con descuento atómico de stock.
* **4.2** Interfaz interactiva de Punto de Venta en `/admin/pos` exclusiva para `admin` y `seller` con buscador de productos y filtro por categorías.
* **4.3** Buscador de clientes predictivo en base de datos filtrando por DNI, Nombre, Email o Teléfono.
* **4.4** Modal rápido para dar de alta clientes nuevos desde el panel de caja física.

---

## Fases Futuras y Deuda Técnica (Roadmap Tecnológico)

### 🚀 Fase 5: Aplicación Móvil Nativa (Expo)
* **Objetivo:** Desarrollar una aplicación móvil nativa para que los clientes puedan comprar cómodamente desde iOS/Android.
* **Pasos:**
  - Inicializar proyecto React Native con Expo Router.
  - Diseñar el storefront optimizado para pantallas móviles (pantalla de inicio, detalle de producto, carrito y perfil).
  - Conectar los flujos de pago de Mercado Pago SDK para móviles (App Checkout).

### 🚀 Fase 6: Desacoplamiento del Backend a NestJS
* **Objetivo:** Resolver la deuda técnica de los Server Actions, separando el backend en una API independiente consumible tanto por la web como por la app móvil en Expo.
* **Pasos:**
  - Crear una aplicación NestJS (`apps/api`) y migrar el cliente Prisma y la lógica de negocio.
  - Implementar autenticación basada en JWT (JSON Web Tokens).
  - Reemplazar las Server Actions de la web Next.js por peticiones fetch tipadas al backend NestJS.
  - Conectar la app móvil Expo a los mismos endpoints del backend NestJS.

### 🚀 Fase 7: Integración con Facturación Electrónica (AFIP)
* **Objetivo:** Emitir automáticamente facturas electrónicas de tipo A y B para las ventas locales y online.
* **Pasos:**
  - Integrar SDK de facturación AFIP (o API intermediaria como Facturante).
  - Validar datos de cliente (DNI/CUIT obligatorio) al emitir facturas en el POS y compras aprobadas online.
  - Almacenar e imprimir el código QR de AFIP en el ticket de venta.
