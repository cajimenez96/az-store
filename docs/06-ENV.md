# 06 — Variables de Entorno

> ADVERTENCIA: Este archivo es solo referencia de estructura. No commitear valores reales.
> Agregar `docs/` a `.gitignore` inmediatamente. Rotar cualquier credencial que haya sido expuesta en el repositorio.

---

## Archivo `.env` de Referencia

Copia esta estructura en tu archivo `.env` local en la raíz del proyecto. Completa los valores con tus credenciales reales. **Nunca subas el archivo `.env` al repositorio.**

```env
# ─────────────────────────────────────────────
# CONFIGURACIÓN GENERAL DE LA APP
# ─────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="AZ Store"
NEXT_PUBLIC_APP_DESCRIPTION="Tienda Online e Integración de Punto de Venta"
# URL base para links y webhooks
# Local: http://localhost:3000
# Producción: https://tu-dominio.com
# IMPORTANTE: MP requiere HTTPS en producción. En local usa ngrok o similar.
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# BASE DE DATOS (PostgreSQL)
# ─────────────────────────────────────────────
# Producción/QA: usar Neon Serverless. El adaptador Neon se activa automáticamente
# cuando la URL contiene 'neon.tech'. En desarrollo local usar PostgreSQL estándar.
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/az_store?schema=public"

# ─────────────────────────────────────────────
# AUTENTICACIÓN (NextAuth v5)
# ─────────────────────────────────────────────
# Generar con: openssl rand -base64 32
AUTH_SECRET="reemplazar-con-valor-generado"
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# UPLOADTHING (Almacenamiento de imágenes y comprobantes)
# ─────────────────────────────────────────────
# Obtener en: https://uploadthing.com
UPLOADTHING_TOKEN="reemplazar-con-token-de-uploadthing"
UPLOADTHING_SECRET="sk_live_reemplazar"
UPLOADTHING_APPID="reemplazar-con-app-id"

# ─────────────────────────────────────────────
# RESEND (Envío de correos transaccionales)
# ─────────────────────────────────────────────
# Obtener en: https://resend.com
RESEND_API_KEY="re_reemplazar"
# Email del remitente: usar onboarding@resend.dev en pruebas,
# o tu email verificado en el dominio en producción.
SENDER_EMAIL="onboarding@resend.dev"

# ─────────────────────────────────────────────
# MERCADO PAGO (Integración de Cobro Online)
# ─────────────────────────────────────────────
# Obtener en: https://www.mercadopago.com.ar/developers
# Tus integraciones → Seleccionar aplicación → Credenciales
# IMPORTANTE: En local/QA usar SIEMPRE credenciales de prueba (sandbox).
# En producción usar credenciales de producción.
MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxx-xxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

# Secreto para verificación de firma HMAC en webhooks de MP [FALTA IMPLEMENTAR en MVP 2]
# Obtener en: Panel MP → Tu aplicación → Webhooks → Secreto de firma
MERCADOPAGO_WEBHOOK_SECRET="reemplazar-con-secreto-de-firma-mp"

# ─────────────────────────────────────────────
# CRON (Liberación automática de stock vencido)
# ─────────────────────────────────────────────
# OBLIGATORIO: Si no está definido, el endpoint queda públicamente accesible.
# Generar con: openssl rand -base64 32
# Configurar también en Vercel Cron o cron-job.org como header:
#   Authorization: Bearer <valor-de-esta-variable>
CRON_SECRET="reemplazar-con-valor-generado"

# ─────────────────────────────────────────────
# RATE LIMITING (Upstash Redis)
# ─────────────────────────────────────────────
# Protección contra brute force en login
# Obtener en: https://console.upstash.com
# Crear base de datos Redis, luego copiar REST API credentials
UPSTASH_REDIS_REST_URL="https://xxxxxxx-xxxxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="reemplazar-con-token-de-upstash"

# ─────────────────────────────────────────────
# API INTERNA (Seguridad de endpoints internos)
# ─────────────────────────────────────────────
# Token secreto para autorizar requests internos (ej: /api/send-email)
# Generar con: openssl rand -base64 32
INTERNAL_API_SECRET="reemplazar-con-valor-generado"

# ─────────────────────────────────────────────
# MEDIOS DE PAGO HABILITADOS
# ─────────────────────────────────────────────
# Métodos online + métodos físicos para Punto de Venta (POS)
PAYMENT_METHODS="MercadoPago, TransferenciaBancaria, PuntoDeVenta_Efectivo, PuntoDeVenta_Transferencia, PuntoDeVenta_QR, PuntoDeVenta_MercadoPago"
DEFAULT_PAYMENT_METHOD="MercadoPago"

# ─────────────────────────────────────────────
# PARÁMETROS GENERALES
# ─────────────────────────────────────────────
PAGE_SIZE=12
LATEST_PRODUCTS_LIMIT=4
ORDER_EXPIRATION_HOURS=24

# Tiempo de expiración para órdenes de MP sin pago (en minutos) [PENDIENTE MVP 2]
# Una vez implementado el cron para MP, esta variable controla cuándo se limpian.
MP_EXPIRATION_MINUTES=30
```

---

## Notas Importantes por Variable

### DATABASE_URL
- El adaptador Neon (`@prisma/adapter-neon`) se activa **automáticamente** cuando la URL contiene `neon.tech`. No requiere configuración adicional.
- En desarrollo local con PostgreSQL estándar, usar la URL de conexión normal sin `neon.tech`.

### MERCADOPAGO_ACCESS_TOKEN / NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
- El formato de las credenciales de MP es `APP_USR-{id}-{fecha}-{hash}-{userId}`.
- Las credenciales de **prueba** (sandbox) y **producción** son distintas. Nunca mezclar.
- Para webhooks en desarrollo local, MP requiere una URL HTTPS pública. Usar **ngrok** o similar: `ngrok http 3000`.

### MERCADOPAGO_WEBHOOK_SECRET
- Nueva variable requerida para MVP 2 (verificación de firma HMAC).
- Disponible en el panel de MP una vez configurado el webhook.
- Sin esta variable, la verificación de firma no puede implementarse.

### CRON_SECRET
- **OBLIGATORIO en producción.** Si no está definida, el endpoint `/api/cron/release-expired-orders` es públicamente accesible.
- En MVP 2, el servidor debe hacer fail-fast al iniciar si esta variable no está definida en producción.
- Configurar el mismo valor en el servicio de cron externo (Vercel Cron, cron-job.org) como header `Authorization: Bearer <valor>`.

### MP_EXPIRATION_MINUTES
- Variable pendiente de implementación en MVP 2.
- Controla cuánto tiempo espera el sistema antes de limpiar una orden de MP no pagada.
- Valor recomendado: 30 minutos (tiempo razonable para completar el checkout de MP).

---

## Obtención de Credenciales

### PostgreSQL (Neon)
1. Crear cuenta en [neon.tech](https://neon.tech).
2. Crear proyecto y seleccionar la región más cercana al deploy de Vercel.
3. Copiar el string de conexión `DATABASE_URL`. Habilitar `sslmode=require` en producción.

### Mercado Pago
1. Ingresar a [Mercado Pago Desarrolladores](https://www.mercadopago.com.ar/developers).
2. Ir a Tus integraciones → Seleccionar aplicación → Credenciales.
3. Copiar las llaves de **Credenciales de prueba** para desarrollo y QA.
4. Para producción, usar las llaves de **Credenciales de producción** (requieren cuenta verificada).

### Uploadthing
1. Registrar cuenta en [uploadthing.com](https://uploadthing.com).
2. Crear una aplicación.
3. Copiar `UPLOADTHING_TOKEN`, `UPLOADTHING_SECRET` y `UPLOADTHING_APPID` desde la sección API Keys.

### Resend
1. Crear cuenta en [resend.com](https://resend.com).
2. Copiar la API Key.
3. Para producción, verificar el dominio propio en Resend para poder enviar desde ese dominio.
