# AZ E-commerce — Documentación del Proyecto

Carpeta de documentación técnica centralizada del proyecto `az-store`.
Usala como punto de partida para cada sesión de desarrollo.

---

## Archivos de Documentación

| Archivo | Contenido |
|---|---|
| [01-PROYECTO.md](./01-PROYECTO.md) | Objetivo, alcance, decisiones de negocio y reglas de inventario |
| [02-ARQUITECTURA.md](./02-ARQUITECTURA.md) | Stack técnico, estructura del proyecto y decisiones arquitectónicas |
| [03-BASE-DE-DATOS.md](./03-BASE-DE-DATOS.md) | Schema de Prisma actual + cambios pendientes |
| [04-APIS.md](./04-APIS.md) | Contratos de API: endpoints actuales y los que hay que crear |
| [05-ROADMAP.md](./05-ROADMAP.md) | Checklist de tareas por fases con estado actual |
| [06-ENV.md](./06-ENV.md) | Variables de entorno completas y cómo obtener cada una |

---

## Estado del Proyecto

```
Fase 1: Setup e Infraestructura     ████████████░░  80% (pendiente .env + Prisma migrate)
Fase 2: Integración MercadoPago     ░░░░░░░░░░░░░░   0%
Fase 3: Interfaz Storefront         ░░░░░░░░░░░░░░   0%
Fase 4: Verificación y Testing      ░░░░░░░░░░░░░░   0%
```

## Cómo Arrancar el Proyecto

```bash
# Instalar dependencias (si no lo hiciste)
npm install

# Configurar variables de entorno
cp .example-env .env
# Completar .env con los valores reales (ver docs/06-ENV.md)

# Sincronizar base de datos
npx prisma migrate dev

# Correr en desarrollo
npm run dev
```
