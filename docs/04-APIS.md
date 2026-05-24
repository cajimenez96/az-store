# 04 — Contratos de API y Server Actions

## Patrón de Arquitectura y Server Actions

Este proyecto está diseñado sobre **Server Actions** de Next.js como el mecanismo principal para leer y escribir datos desde el frontend, evitando la sobrecarga de estructurar endpoints REST/GraphQL clásicos para la interfaz web.

Los **Route Handlers** clásicos (rutas API HTTP) se reservan exclusivamente para integraciones y webhooks externos, llamadas asíncronas desatendidas (como tareas Cron) y la configuración de subida de archivos pesados.

---

## Server Actions Implementados

### 1. Módulo de Ordenes (`lib/actions/order.actions.ts`)

* **`createOrder()`**
  * **Uso:** Storefront público. Toma los productos del carrito activo del usuario en la base de datos y genera una orden de pago.
  * **Lógica:** Si el método de pago es Transferencia Bancaria, decrementa inmediatamente el stock y setea `expiresAt` en 24 horas. Si es Mercado Pago, no toca el stock (espera al webhook).
* **`createPosOrder(data)`** 🆕
  * **Uso:** Panel POS. Registra una venta física presencial.
  * **Firma:**
    ```typescript
    export async function createPosOrder(data: {
      items: CartItem[];
      paymentMethod: string;
      customerId?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      customerDni?: string;
      customerAddress?: string;
    })
    ```
  * **Lógica:** Se ejecuta bajo transacción (`prisma.$transaction`). Resuelve el cliente (busca por ID/Email/DNI, crea un usuario nuevo en base de datos si se ingresaron datos y no existía, o asocia a "Consumidor Final"). Registra la orden directamente como Pagada (`isPaid: true`), Entregada (`isDelivered: true`) y descuenta de inmediato el stock físico de las variantes en la base de datos.
* **`createMercadoPagoOrder(orderId)`**
  * **Uso:** Genera la preferencia de pago en Mercado Pago para redirigir al Checkout Pro. Guarda el id de la preferencia en la orden.
* **`approveBankTransfer(orderId)`**
  * **Uso:** El administrador aprueba una transferencia bancaria tras revisar el comprobante visual. Pasa la orden a pagada.
* **`rejectBankTransfer(orderId)`**
  * **Uso:** El administrador cancela una transferencia inválida. Reintegra atómicamente el stock reservado a la variante.

---

### 2. Módulo de Usuarios y Clientes (`lib/actions/user.actions.ts`)

* **`searchPosCustomers(query)`** 🆕
  * **Uso:** Autocomplete predictivo en la barra de búsqueda del cliente del POS.
  * **Firma:** `export async function searchPosCustomers(query: string)`
  * **Lógica:** Retorna un listado de hasta 10 usuarios que coincidan parcialmente en su `name`, `email`, `dni` o `phone`.
* **`createPosCustomer(data)`** 🆕
  * **Uso:** Registrar un nuevo cliente físico desde el POS sin salir de la pantalla.
  * **Firma:**
    ```typescript
    export async function createPosCustomer(data: {
      name: string;
      email: string;
      phone?: string;
      dni?: string;
      streetAddress?: string;
      city?: string;
      province?: string;
      postalCode?: string;
    })
    ```
  * **Lógica:** Inserta el usuario con el rol `user`, guardando opcionalmente el domicilio formateado dentro del objeto de dirección JSON. Valida la no colisión de email y DNI.

---

## Route Handlers Activos (API Endpoints)

### 1. Webhook de Mercado Pago
* **Ruta:** `POST /api/webhooks/mercadopago`
* **Uso:** Recibe notificaciones IPN asíncronas de Mercado Pago.
* **Lógica:** Si el pago es `approved`, busca la orden usando la referencia externa (`external_reference`), actualiza la orden a pagada, descuenta el stock de las variantes del inventario y dispara la plantilla de correo de confirmación de compra mediante Resend.

### 2. Tarea Cron de Liberación de Stock
* **Ruta:** `GET /api/cron/release-expired-orders`
* **Uso:** Llamado por Vercel Cron o cron-job.org de forma periódica.
* **Seguridad:** Requiere cabecera `Authorization: Bearer <CRON_SECRET>`.
* **Lógica:** Cancela pedidos online por transferencia no pagados que superaron las 24 horas (`expiresAt < ahora`) y reintegra el stock reservado.

---

## Deuda Técnica: Acoplamiento de Server Actions

El uso de Server Actions de Next.js representa una **deuda técnica importante** si se contempla expandir el negocio en el mediano plazo:

### El Problema
Los Server Actions no son endpoints HTTP REST independientes. Son funciones RPC enlazadas de manera propietaria por Next.js que dependen estrechamente de su runtime de cookies, headers y middleware.
* Un cliente externo, como una **aplicación móvil nativa en Expo (React Native)** o integraciones de software ERP de terceros, **no puede consumir** estas funciones.

### Solución y Mitigación
Al migrar el backend hacia un servicio dedicado (por ejemplo, en **NestJS**):
1. **Desacoplar la Lógica:** Extraer los servicios de base de datos (`prisma.*`) de los archivos `.actions.ts` hacia módulos independientes.
2. **REST APIs:** Crear controladores HTTP REST tradicionales (`POST /api/orders`, `GET /api/customers/search`) protegidos con JWT.
3. **Migración Progresiva:** El frontend de Next.js pasará de invocar Server Actions a hacer peticiones `fetch()` estándar al nuevo backend NestJS, permitiendo que la aplicación web y la aplicación móvil Expo consuman exactamente las mismas APIs.
