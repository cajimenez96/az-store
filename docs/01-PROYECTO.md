# 01 — Proyecto: Objetivo, Alcance y Reglas de Negocio

## Objetivo Principal

Diseñar y desplegar un **Marketplace E-commerce Híbrido (Online y Físico)** que soporte:
- Catálogo de productos altamente dinámico y estructurado con variaciones de talles, categorías, subcategorías y marcas.
- Carrito de compras persistente con fusión automática entre navegación anónima y usuario registrado.
- Pasarela de pago híbrida: Mercado Pago Checkout Pro (online) y Transferencia Bancaria Manual con carga de comprobantes.
- Módulo de Punto de Venta (POS) en local físico integrado para vendedores y administradores, permitiendo compras ágiles presenciales en un solo paso.
- Panel administrativo de control ERP para reposición de stock, métricas de venta en tiempo real y moderación de órdenes.

---

## Canales de Venta y Métodos de Pago

### 1. Tienda Online (Público)

#### Mercado Pago Checkout Pro
- El cliente realiza la compra y es redirigido al Checkout Pro de Mercado Pago.
- La aprobación se procesa de forma asíncrona mediante **webhooks de Mercado Pago (IPN / Webhooks)**.
- El stock de las variantes seleccionadas **no se reserva** hasta recibir la notificación oficial de Mercado Pago con estado `approved`, momento en el cual la orden pasa a `isPaid: true` y se descuenta el stock en la base de datos.
- **Esquema de comisiones:** No requiere split automático al cobrar en la tienda; las comisiones se calculan a posteriori de forma administrativa.

#### Transferencia Bancaria Manual
- Al seleccionar este método de pago, el checkout muestra la información de la cuenta bancaria del local (CBU, Alias, CUIT, Titular).
- El cliente finaliza el pedido, lo que **congela inmediatamente el stock de la variante** (se crea la orden con `isPaid: false` y un tiempo de expiración de 24 horas en el campo `expiresAt`).
- El cliente sube la captura de pantalla o foto del comprobante directamente desde la vista del detalle del pedido.
- El administrador o vendedor valida la transferencia visualmente en el panel y la marca como aprobada (pasando a `isPaid: true` de forma permanente) o rechazada (devolviendo el stock reservado).

### 2. Tienda Física (POS Local)

#### Punto de Venta (POS) para Vendedores
- El vendedor/cajero accede a una interfaz optimizada de pantalla única en `/admin/pos`.
- **Rapidez y Cero Fricción:** No se solicitan datos de envío de manera obligatoria (la entrega es inmediata).
- **Fusión de Clientes:** Permite buscar clientes registrados (por DNI, Nombre, Email o Teléfono) o dar de alta un cliente nuevo mediante un modal rápido. Por defecto, si el cliente no quiere registrarse, la venta se asocia a un comodín genérico ("Consumidor Final").
- **Métodos de Pago Físicos:**
  - *Efectivo*
  - *Transferencia Bancaria en Local*
  - *Código QR*
  - *Mercado Pago (Terminal Física)*
- **Lógica de Stock:** Al registrar la venta, la orden se crea directamente marcada como Pagada (`isPaid: true`), Entregada (`isDelivered: true`) y con estado de envío `"Entregado"`, restando el stock físico de las variantes atómicamente en la misma transacción de la base de datos.

---

## Reglas de Inventario y Estados de Venta

| Situación | Canal | Acción del Sistema | Estado de la Orden |
|---|---|---|---|
| Compra por Transferencia | Online | Descuenta stock inmediatamente. Orden expira en 24hs. | `isPaid: false`, `isDelivered: false`, envío: `"Pendiente"` |
| Transferencia Aprobada | Online | Preserva el descuento de stock de manera permanente. | `isPaid: true`, `isDelivered: false`, envío: `"Pendiente"` |
| Transferencia Rechazada | Online | Cancela la orden y reintegra el stock a las variantes mediante transacción. | `isPaid: false`, `isDelivered: false`, envío: `"Cancelado"` |
| Orden Expirada (Cron) | Online | Un script automatizado cancela el pedido y restaura el stock. | `isPaid: false`, `isDelivered: false`, envío: `"Cancelado"` |
| Compra por Mercado Pago | Online | El stock se reserva **únicamente** tras recibir el webhook aprobado. | `isPaid: true`, `isDelivered: false`, envío: `"Pendiente"` |
| Registro de Venta POS | Local | Descuenta stock al instante y marca el pedido como finalizado y entregado. | `isPaid: true`, `isDelivered: true`, envío: `"Entregado"` |

---

## Alcance del MVP

### ✅ Incluido en la versión actual
* **Catálogo Normalizado:** Productos con marca, categoría, subcategoría y variantes (talles) con control de stock independiente.
* **Carrito Persistente:** Fusión inteligente de carritos anónimos con los del usuario tras el login.
* **Checkout Online Híbrido:** Pasarela Mercado Pago y Transferencia Bancaria con cargador de archivos (Uploadthing).
* **Módulo de Punto de Venta (POS):** Pantalla única rápida para vendedores con buscador predictivo de productos, filtro por categorías, buscador de clientes por DNI/contacto y alta de clientes nuevos.
* **Panel de Control ERP:** Visualización de métricas de facturación (Recharts), listado de pedidos, control de usuarios y campana de stock crítico (variantes con stock <= 2).
* **Emails Transaccionales:** Notificaciones de compras generadas mediante Resend y plantillas en React Email.

### ❌ Excluido del MVP (Fases Futuras)
* Split automático de pagos en Mercado Pago (cobro multi-vendedor integrado).
* Automatización de envíos con cotizadores de correo en tiempo real.
* Aplicación móvil nativa.

---

## Decisiones de Stack y Herramientas

* **Next.js 15 (App Router / Turbopack):** Para unificar storefront, API y panel de control en un único proyecto ágil de desplegar.
* **Prisma ORM & PostgreSQL (Neon):** Estricto tipado de base de datos y transacciones seguras para evitar colisiones de stock físico.
* **NextAuth v5 (Beta 25):** Autenticación local segura libre de dependencias y límites de planes SaaS de terceros.
* **Uploadthing:** Servicio serverless integrado para almacenar imágenes de catálogo y comprobantes de transferencias.
* **Resend & React Email:** Para el diseño y despacho rápido de correos transaccionales.
