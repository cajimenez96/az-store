# 06 — Variables de Entorno

Este documento detalla todas las variables de entorno necesarias para ejecutar la aplicación en entornos Local (Desarrollo), QA (Vercel Test) y Producción.

---

## Archivo `.env` de Referencia

Copia este contenido en tu archivo `.env` local en la raíz del proyecto:

```env
# ─────────────────────────────────────────────
# CONFIGURACIÓN GENERAL DE LA APP
# ─────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="AZ Store"
NEXT_PUBLIC_APP_DESCRIPTION="Tienda Online e Integración de Punto de Venta"
# URL base para links y webhooks (Local: http://localhost:3000)
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# BASE DE DATOS (PostgreSQL)
# ─────────────────────────────────────────────
# En producción y QA se recomienda base de datos Neon Serverless.
# Reemplazar con tus credenciales de Postgres correspondientes.
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/az_store?schema=public"

# ─────────────────────────────────────────────
# AUTENTICACIÓN (NextAuth v5)
# ─────────────────────────────────────────────
# Generar un secret seguro usando: openssl rand -base64 32
AUTH_SECRET="tu_auth_secret_generado"
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# UPLOADTHING (Almacenamiento de imágenes de productos y comprobantes)
# ─────────────────────────────────────────────
# Obtener las llaves registrándote en https://uploadthing.com
UPLOADTHING_TOKEN="60950..."
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APPID="tu_app_id"

# ─────────────────────────────────────────────
# RESEND (Envío de correos transaccionales)
# ─────────────────────────────────────────────
# Obtener API Key en https://resend.com
RESEND_API_KEY="re_..."
# Email del remitente (onboarding@resend.dev en pruebas, o tu email verificado en dominio)
SENDER_EMAIL="onboarding@resend.dev"

# ─────────────────────────────────────────────
# MERCADO PAGO (Integración de Cobro Online)
# ─────────────────────────────────────────────
# Obtener credenciales en el Panel de Desarrolladores de Mercado Pago.
# NOTA: En local/QA usar siempre credenciales de TEST (sandbox).
MERCADOPAGO_ACCESS_TOKEN="APP_USR-7595717228120348-052319-3e449131707ec6c65317a43d7d7b3f75-3224234357"
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-07cd9bcb-bcc2-40c8-9367-96441c11fb1a"

# ─────────────────────────────────────────────
# CRON (Liberación automática de stock de transferencias vencidas)
# ─────────────────────────────────────────────
# Clave para autenticar peticiones cron. Generar con: openssl rand -base64 32
CRON_SECRET="tu_cron_secret_generado"

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
```

---

## Obtención de Credenciales

### 1. PostgreSQL (Neon)
1. Crea una cuenta en [neon.tech](https://neon.tech).
2. Crea un proyecto y selecciona la región más cercana a tu deploy de Vercel.
3. Copia el string de conexión `DATABASE_URL`. Asegúrate de habilitar `sslmode=require` si estás en producción.

### 2. Mercado Pago
1. Entra a tu cuenta en [Mercado Pago Desarrolladores](https://www.mercadopago.com.ar/developers).
2. Dirígete a **Tus integraciones** -> Selecciona tu aplicación -> **Credenciales**.
3. Copia las llaves de **Credenciales de prueba** para tus entornos de Desarrollo y QA.
4. **Importante:** La URL de retorno (`NEXT_PUBLIC_SERVER_URL`) y redirección de Mercado Pago requiere un túnel seguro `https` en desarrollo local (por ejemplo, usando **Ngrok**), de lo contrario la API de Mercado Pago podría dar error de validación de URL en el checkout.

### 3. Uploadthing
1. Registra tu cuenta en [uploadthing.com](https://uploadthing.com).
2. Crea una aplicación.
3. Copia las variables `UPLOADTHING_SECRET` y `UPLOADTHING_APPID` desde el apartado **API Keys**.
