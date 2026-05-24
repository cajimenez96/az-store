# 02 — Arquitectura y Stack Técnico

## Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Next.js (App Router) | ^16.2.6 | Full-stack: storefront + panel admin + API |
| Lenguaje | TypeScript | ^5 | Tipado estricto end-to-end |
| Estilos | Tailwind CSS | ^3.4.1 | Diseño responsive y sistema de diseño |
| Componentes UI | Shadcn UI + Radix UI | — | Interfaz accesible y componentes modulares |
| ORM | Prisma | 6.5.0 | Acceso y mapeo relacional de base de datos |
| Base de datos | PostgreSQL (Neon) | — | Base de datos relacional serverless |
| Autenticación | NextAuth v5 | ^5.0.0-beta.25 | Gestión de sesiones local (cliente y vendedor) |
| Imágenes | Uploadthing | ^7.4.0 | Carga y alojamiento de fotos y comprobantes |
| Emails | Resend | ^4.0.1 | Despacho de correos transaccionales |
| Pagos | Mercado Pago SDK | ^3.0.0 | Checkout Pro Online + Webhooks de pago |
| Validación | Zod | ^3.23.8 | Validaciones y contratos en formularios y base de datos |
| Gráficos | Recharts | ^2.14.1 | Gráficos visuales del dashboard administrativo |

---

## Estructura del Directorio

```
az-store/
├── app/
│   ├── (auth)/              # Autenticación (Sign-in / Sign-up)
│   ├── (root)/              # E-commerce storefront público
│   │   ├── cart/            # Carrito de compras web
│   │   ├── order/[id]/      # Detalle y pago de orden (subir comprobante)
│   │   ├── payment-method/  # Selección de método de pago
│   │   ├── place-order/     # Creación de orden online
│   │   ├── product/[slug]/  # Detalle de producto con talles
│   │   ├── search/          # Buscador y filtros de catálogo
│   │   └── shipping-address/ # Dirección de envío
│   ├── admin/               # Panel administrativo protegidos
│   │   ├── brands/          # ABM de Marcas
│   │   ├── categories/      # ABM de Categorías y Subcategorías
│   │   ├── inventory/       # Control visual del Stock físico
│   │   ├── orders/          # Gestión y moderación de pedidos
│   │   ├── overview/        # Dashboard de métricas
│   │   ├── pos/             # 🏪 Punto de Venta (POS) en local físico
│   │   ├── products/        # ABM de Productos y Variantes
│   │   └── users/           # Asignación de Roles (admin, seller, user)
│   ├── api/
│   │   ├── auth/            # Rutas internas de NextAuth
│   │   ├── cron/            # Scripts automatizados (liberación de stock)
│   │   ├── uploadthing/     # Endpoints de subida de imágenes
│   │   └── webhooks/
│   │       └── mercadopago/ # IPN Webhook de Mercado Pago
│   ├── user/                # Historial de pedidos del cliente
│   └── unauthorized/        # Acceso denegado (403 Custom)
├── components/              # Componentes visuales UI
├── db/
│   ├── prisma.ts            # Cliente Prisma singleton
│   ├── sample-data.ts       # Datos de prueba para el seed
│   └── seed.ts              # Script de siembra de base de datos
├── docs/                    # 📁 Documentación técnica del proyecto
├── email/                   # Plantillas de email en React Email
├── lib/
│   ├── actions/             # Server Actions (Módulo principal backend)
│   │   ├── cart.actions.ts   # Métodos de carrito
│   │   ├── order.actions.ts  # Creación de órdenes, pagos y lógica POS
│   │   ├── product.actions.ts # Consultas del catálogo
│   │   └── user.actions.ts    # Registro de usuarios y clientes del POS
│   ├── constants/           # Constantes y configuraciones globales
│   ├── mercadopago.ts       # Configuración e instanciación de Mercado Pago
│   └── validators.ts        # Validaciones de esquemas con Zod
├── prisma/
│   ├── schema.prisma        # Modelo de datos relacionales
│   └── migrations/          # Historial de migraciones SQL
├── tests/                   # Pruebas unitarias de Jest
└── types/                   # Tipos TypeScript compartidos
```

---

## Flujos Principales de Transacción

### 🛍️ Flujo 1: Compra Online con Mercado Pago
1. El cliente agrega productos al carrito, ingresa dirección de envío y selecciona **Mercado Pago**.
2. Al confirmar, se crea la orden en base de datos (`isPaid: false`) y se llama a `createMercadoPagoOrder` para generar la preferencia de pago en la API de Mercado Pago.
3. El cliente es redirigido al Checkout Pro de Mercado Pago.
4. Tras pagar, Mercado Pago envía un webhook IPN a `/api/webhooks/mercadopago`.
5. El webhook valida el pago contra la API de Mercado Pago. Si el estado es `approved`:
   - Se marca la orden como pagada (`isPaid: true`).
   - Se descuenta el stock de las variantes del producto.
   - Se despacha el email de confirmación (Resend).

### 🏦 Flujo 2: Compra Online con Transferencia Bancaria
1. El cliente confirma la orden seleccionando **Transferencia Bancaria**.
2. **Reserva Inmediata:** La orden se crea (`isPaid: false`) y el stock de las variantes se decrementa inmediatamente en base de datos. Se fija una expiración de 24 horas (`expiresAt`).
3. El cliente visualiza los datos del CBU en la pantalla de la orden y sube la captura de pantalla de su comprobante (Uploadthing).
4. El administrador ve la orden en el dashboard `/admin/orders`.
   - **Si aprueba:** La orden pasa a `isPaid: true` (se mantiene el stock descontado permanentemente) y se envía el mail de confirmación.
   - **Si rechaza (o si expira el plazo de 24hs y corre el Cron Job):** La orden se marca como cancelada y se reintegra el stock reservado de forma atómica a las variantes.

### 🏪 Flujo 3: Venta Física Presencial (POS)
1. El vendedor inicia sesión como `seller` y accede a `/admin/pos`.
2. Busca productos y selecciona talles con stock disponible en una única vista.
3. Si el cliente lo desea, busca sus datos en la base de datos por DNI, Nombre o Email. Si no existe, lo crea al instante a través de un modal. Si prefiere el anonimato, se asocia automáticamente a "Consumidor Final".
4. Selecciona el método de pago local (Efectivo, Transferencia local, QR, Mercado Pago Terminal) y confirma la transacción.
5. El sistema ejecuta una transacción atómica que crea la orden marcada como pagada (`isPaid: true`) y entregada (`isDelivered: true`, estado `"Entregado"`), descuenta el stock de inmediato de la base de datos y despliega el modal para imprimir el comprobante térmico.

---

## Deuda Técnica: Plan de Desacoplamiento del Backend

Actualmente, el proyecto está estructurado como un **Monolito Next.js** donde el frontend (componentes React) se comunica directamente con la base de datos mediante **Server Actions**. Esto genera un alto acoplamiento y presenta limitaciones a futuro:

### Limitaciones del Enfoque Actual
1. **Acoplamiento de Next.js:** Los Server Actions dependen del runtime de Next.js (cookies, cabeceras, rutas) y no pueden ser consumidos por clientes externos.
2. **Aplicación Móvil (Expo/React Native):** Si deseamos lanzar una app móvil nativa en el futuro, no podremos reusar las acciones de servidor de Next.js directamente. La app móvil necesitará consumir endpoints HTTP estándar.
3. **Escalabilidad del Backend:** No se pueden escalar los procesos de procesamiento de datos por separado del servidor de renderizado frontend.

### Propuesta de Migración (Separación Back/Front)
Para dar soporte a la aplicación móvil Expo y asegurar la escalabilidad del sistema, planificamos la separación del backend en un microservicio dedicado:

#### Arquitectura de Destino (Desacoplada)
```
[ Web Storefront (Next.js) ] ──┐
                              ├───> [ API Gateway / Balanceador ] ───> [ Backend API (NestJS / Node) ] ───> [ PostgreSQL ]
[ App Móvil Nativa (Expo) ] ──┘
```

#### Pasos para la Separación del Monorepo
1. **Migración a Monorepo Nx o Turborepo:** Estructurar el proyecto en sub-aplicaciones:
   - `apps/storefront`: Next.js frontend puro (consumiendo API).
   - `apps/admin-dashboard`: Panel administrativo web.
   - `apps/mobile`: Proyecto React Native / Expo.
   - `apps/api`: Backend standalone.
2. **Creación del Backend Dedicado (Recomendación: NestJS):**
   - Migrar el Prisma client y los archivos de lógica de `lib/actions/*` a controladores y servicios de **NestJS** (Node.js).
   - Exponer endpoints REST o una API GraphQL documentada con Swagger.
   - Migrar la autenticación a JSON Web Tokens (JWT) o un servidor de OAuth2 (NextAuth se puede configurar como cliente de este backend).
3. **Migración del Frontend:** Reemplazar las llamadas directas de Server Actions por llamadas `fetch` tipadas con `openapi-typescript` o `react-query` apuntando al nuevo backend NestJS.
