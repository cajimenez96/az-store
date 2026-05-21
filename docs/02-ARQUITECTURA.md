# 02 — Arquitectura y Stack Técnico

## Stack Tecnológico

| Capa | Tecnología | Versión | Rol |
|---|---|---|---|
| Framework | Next.js (App Router) | ^15.2.2 | Full-stack: storefront + admin + API |
| Lenguaje | TypeScript | ^5 | Tipado estricto end-to-end |
| Estilos | Tailwind CSS v3 | ^3.4.1 | Diseño responsive |
| Componentes UI | Shadcn UI + Radix UI | — | Sistema de diseño accesible |
| ORM | Prisma | 6.5.0 | Acceso a base de datos type-safe |
| Base de datos | PostgreSQL | — | Almacenamiento relacional |
| Driver DB (Prod) | @neondatabase/serverless + @prisma/adapter-neon | — | PostgreSQL serverless para Vercel |
| Autenticación | NextAuth v5 | ^5.0.0-beta.25 | Sesiones de usuario (admin + cliente) |
| Imágenes | Uploadthing | ^7.4.0 | Subida de fotos de productos y comprobantes |
| Emails | Resend | ^4.0.1 | Confirmación de compra |
| Pagos | MercadoPago SDK (por implementar) | latest | Checkout Pro + Webhooks IPN |
| Validación | Zod | ^3.23.8 | Schemas de validación |
| Formularios | React Hook Form | ^7.53.2 | Formularios con validación |
| Gráficos | Recharts | ^2.14.1 | Dashboard de ventas |
| Testing | Jest + ts-jest | ^29.7.0 | Tests unitarios |
| Linter | ESLint | ^8 | Calidad de código |
| Formatter | Prettier | — | Formato consistente |

---

## Estructura del Proyecto

```
az-store/
├── app/
│   ├── (auth)/              # Rutas de login y registro
│   ├── (root)/              # Storefront público
│   │   ├── cart/            # Carrito de compras
│   │   ├── order/[id]/      # Detalle de orden
│   │   ├── payment-method/  # Selección de método de pago
│   │   ├── place-order/     # Confirmación de orden
│   │   ├── product/[slug]/  # Detalle de producto
│   │   ├── search/          # Búsqueda y filtros
│   │   └── shipping-address/ # Dirección de envío
│   ├── admin/               # Panel administrativo (protegido)
│   │   ├── orders/          # Gestión de órdenes
│   │   ├── overview/        # Dashboard con métricas
│   │   ├── products/        # ABM de productos
│   │   └── users/           # Gestión de usuarios
│   ├── api/
│   │   ├── auth/            # NextAuth handlers
│   │   ├── uploadthing/     # Endpoint de subida de archivos
│   │   └── webhooks/
│   │       └── mercadopago/ # 🆕 IPN Webhook (por crear)
│   ├── user/                # Perfil y órdenes del usuario
│   └── unauthorized/        # Página de acceso denegado
├── components/              # Componentes UI reutilizables
├── db/
│   ├── prisma.ts            # Cliente Prisma singleton
│   ├── sample-data.ts       # Datos de prueba para seed
│   └── seed.ts              # Script de seed de la BD
├── docs/                    # 📁 Esta carpeta — documentación
├── email/                   # Templates de email (React Email)
├── hooks/                   # Custom hooks de React
├── lib/
│   ├── actions/             # Server Actions
│   │   ├── cart.actions.ts
│   │   ├── order.actions.ts # 🔧 Modificar: MercadoPago + Transferencia
│   │   ├── product.actions.ts
│   │   ├── review.actions.ts
│   │   └── user.actions.ts
│   ├── constants/
│   │   └── index.ts         # ✅ Actualizado: PAYMENT_METHODS = MercadoPago + TransferenciaBancaria
│   ├── mercadopago.ts       # 🆕 Por crear: SDK singleton
│   ├── uploadthing.ts       # UploadButton y UploadDropzone
│   ├── utils.ts             # Funciones utilitarias
│   └── validators.ts        # Schemas Zod
├── prisma/
│   ├── schema.prisma        # 🔧 Modificar: agregar receiptUrl y expiresAt a Order
│   └── migrations/          # Migraciones versionadas
├── public/                  # Assets estáticos
├── tests/                   # Tests unitarios (Jest)
├── types/                   # Tipos TypeScript globales
├── auth.ts                  # Configuración NextAuth
├── auth.config.ts           # Providers de autenticación
├── middleware.ts            # Protección de rutas admin
└── package.json
```

---

## Flujos Principales

### Flujo Mercado Pago
```
Cliente → Carrito → Dirección → "MercadoPago" → Confirmar Orden
                                                     ↓
                               [createOrder()] → Orden creada (isPaid: false)
                                                     ↓
                               [createMercadoPagoOrder()] → Preferencia MP
                                                     ↓
                               Redirección → Checkout Pro MP
                                                     ↓
                               MP → POST /api/webhooks/mercadopago (IPN)
                                                     ↓
                               Validar pago con API de MP
                                                     ↓
                               updateOrderToPaid() → isPaid: true, stock decrementado
                                                     ↓
                               Email de confirmación (Resend)
```

### Flujo Transferencia Bancaria
```
Cliente → Carrito → Dirección → "TransferenciaBancaria" → Confirmar Orden
                                                                ↓
                                        [createOrder()] → Stock decrementado inmediatamente
                                                          Orden: isPaid: false, expiresAt: +24hs
                                                                ↓
                                        Pantalla de Orden → Muestra CBU/Alias
                                                          → Uploader Uploadthing
                                                                ↓
                                        Cliente sube comprobante → receiptUrl guardado
                                                                ↓
                              Admin Dashboard → Ve comprobante → Decide:
                                       ↙                              ↘
                              [approveBankTransfer()]        [rejectBankTransfer()]
                              isPaid: true                   Orden cancelada
                              Stock permanente               Stock restaurado (+qty)
```

---

## Decisiones Arquitectónicas

| # | Decisión | Elegida | Descartada | Razón |
|---|---|---|---|---|
| 1 | Estructura | Monolito (1 repo) | 2 repos separados | Menos fricción en MVP, 1 deploy |
| 2 | Auth | NextAuth v5 | Clerk | Open source, sin costo de SaaS |
| 3 | DB driver | @neondatabase/serverless | pg directo | Necesario para Vercel Edge/Serverless |
| 4 | Pagos | MercadoPago | Stripe/PayPal | Dominante en Argentina y LATAM |
| 5 | Imágenes | Uploadthing | Cloudinary | Ya integrado en prostore, 0 trabajo |
| 6 | Comisiones | Post-pago mensual | Split MP OAuth | Evita OAuth por vendedor |
