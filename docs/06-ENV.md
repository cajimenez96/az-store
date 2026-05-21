# 06 — Variables de Entorno

> Copiá `.example-env` como `.env` y completá cada variable.
> **NUNCA** commitees el `.env` real al repositorio.

---

## Archivo `.env` Completo

```env
# ─────────────────────────────────────────────
# APP
# ─────────────────────────────────────────────
NEXT_PUBLIC_APP_NAME="AZ Marketplace"
NEXT_PUBLIC_APP_DESCRIPTION="Tu marketplace online"
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# BASE DE DATOS — PostgreSQL
# ─────────────────────────────────────────────
# Opciones recomendadas para hosting gratuito:
#   - Neon: https://neon.tech (recomendado para Vercel)
#   - Supabase: https://supabase.com
DATABASE_URL="postgresql://user:password@host:port/dbname"

# ─────────────────────────────────────────────
# NEXTAUTH — Autenticación
# ─────────────────────────────────────────────
# Generar con: openssl rand -base64 32
AUTH_SECRET="REEMPLAZAR_CON_VALOR_GENERADO"

# En producción, cambiar a la URL real del sitio
NEXTAUTH_URL="http://localhost:3000"

# ─────────────────────────────────────────────
# UPLOADTHING — Subida de imágenes
# ─────────────────────────────────────────────
# Registrarse en: https://uploadthing.com
# Panel: https://uploadthing.com/dashboard
UPLOADTHING_TOKEN="..."
UPLOADTHING_SECRET="..."
UPLOADTHING_APPID="..."

# ─────────────────────────────────────────────
# RESEND — Emails transaccionales
# ─────────────────────────────────────────────
# Registrarse en: https://resend.com
# Plan gratuito: 3.000 emails/mes
RESEND_API_KEY="re_..."
SENDER_EMAIL="noreply@tudominio.com"

# ─────────────────────────────────────────────
# MERCADO PAGO — Pagos
# ─────────────────────────────────────────────
# Panel de desarrolladores: https://www.mercadopago.com.ar/developers
# Sección: Tus integraciones → Credenciales
#
# Para desarrollo usar las credenciales de SANDBOX (TEST)
# Para producción usar las credenciales de PRODUCCIÓN
MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="APP_USR-..."

# ─────────────────────────────────────────────
# CRON — Liberación de stock expirado
# ─────────────────────────────────────────────
# Generar con: openssl rand -base64 32
# Configurar en cron-job.org o Vercel Cron
CRON_SECRET="REEMPLAZAR_CON_VALOR_GENERADO"

# ─────────────────────────────────────────────
# PAGOS HABILITADOS
# ─────────────────────────────────────────────
PAYMENT_METHODS="MercadoPago, TransferenciaBancaria"
DEFAULT_PAYMENT_METHOD="MercadoPago"

# ─────────────────────────────────────────────
# PAGINACIÓN (opcional)
# ─────────────────────────────────────────────
PAGE_SIZE=12
LATEST_PRODUCTS_LIMIT=4
```

---

## Cómo Obtener Cada Credencial

### PostgreSQL (Neon — recomendado)
1. Crear cuenta en [neon.tech](https://neon.tech).
2. Crear nuevo proyecto → copia la `DATABASE_URL` desde el dashboard.
3. El formato es: `postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`

### NextAuth Secret
```bash
openssl rand -base64 32
```
Pegar el resultado en `AUTH_SECRET`.

### Uploadthing
1. Crear cuenta en [uploadthing.com](https://uploadthing.com).
2. Crear nueva app en el dashboard.
3. Ir a **API Keys** → copiar `Token`, `Secret` y `App ID`.

### Resend
1. Crear cuenta en [resend.com](https://resend.com).
2. Ir a **API Keys** → crear nueva clave → copiar.
3. En `SENDER_EMAIL`: usar un email verificado con tu dominio (o `onboarding@resend.dev` para pruebas).

### Mercado Pago
1. Entrar al [panel de desarrolladores](https://www.mercadopago.com.ar/developers/panel).
2. Ir a **Tus integraciones** → seleccionar o crear una integración.
3. En la sección **Credenciales**:
   - **TEST** (sandbox): usar para desarrollo local.
   - **Producción**: usar en el deploy final.
4. Copiar `Access Token` → `MERCADOPAGO_ACCESS_TOKEN`
5. Copiar `Public Key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

> ⚠️ **Importante:** Las credenciales de TEST y producción son distintas.
> No mezclarlas. En `npm run dev` siempre usar TEST.

### Cron Secret
```bash
openssl rand -base64 32
```
Pegar el resultado en `CRON_SECRET`.
Usar este mismo valor en el header `Authorization: Bearer <CRON_SECRET>` al configurar
el cron job externo (cron-job.org o Vercel Cron).

---

## Configuración del Cron Job Externo

El endpoint `/api/cron/release-expired-orders` debe ser llamado **una vez por hora** (o cada 24hs como mínimo).

### Opción A: cron-job.org (gratuito)
1. Crear cuenta en [cron-job.org](https://cron-job.org).
2. Crear nuevo cron job:
   - **URL:** `https://tu-dominio.com/api/cron/release-expired-orders`
   - **Método:** GET
   - **Header:** `Authorization: Bearer TU_CRON_SECRET`
   - **Schedule:** `0 * * * *` (cada hora)

### Opción B: Vercel Cron (en producción con Vercel)
En `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/release-expired-orders",
      "schedule": "0 * * * *"
    }
  ]
}
```
El token se pasa automáticamente por Vercel usando `CRON_SECRET`.

---

## Datos Bancarios para Transferencias

Estos datos se mostrarán al cliente en la pantalla de orden cuando elija Transferencia Bancaria.
Agregarlos como constantes en `lib/constants/index.ts`:

```typescript
export const BANK_TRANSFER_INFO = {
  bank: process.env.BANK_NAME || 'Banco XXX',
  accountHolder: process.env.BANK_ACCOUNT_HOLDER || 'Nombre del titular',
  cbu: process.env.BANK_CBU || '0000000000000000000000',
  alias: process.env.BANK_ALIAS || 'ALIAS.DE.TRANSFERENCIA',
  cuit: process.env.BANK_CUIT || '20-00000000-0',
};
```

Y en `.env`:
```env
BANK_NAME="Banco Galicia"
BANK_ACCOUNT_HOLDER="AZ Marketing SRL"
BANK_CBU="0070999620000000000000"
BANK_ALIAS="AZ.MARKETING.MP"
BANK_CUIT="30-00000000-0"
```
