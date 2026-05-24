# AZ E-commerce — Documentación del Proyecto

Carpeta de documentación técnica centralizada del proyecto `az-store`. Aquí se detallan las decisiones arquitectónicas, contratos de servicios, esquemas de bases de datos normalizados y guías de pruebas funcionales y automatizadas.

---

## Archivos de Documentación

| Archivo | Contenido |
|---|---|
| [01-PROYECTO.md](./01-PROYECTO.md) | Objetivo, alcance, reglas de negocio e inventario (Online y Físico) |
| [02-ARQUITECTURA.md](./02-ARQUITECTURA.md) | Stack técnico, flujos de transacciones y propuesta de separación de backend (deuda técnica) |
| [03-BASE-DE-DATOS.md](./03-BASE-DE-DATOS.md) | Esquema de Prisma normalizado en 3NF (Marcas, Categorías, Variantes, Talles y DNI) |
| [04-APIS.md](./04-APIS.md) | Contratos de API: Server Actions y Route Handlers (incluye POS y Clientes) |
| [05-ROADMAP.md](./05-ROADMAP.md) | Checklist de tareas completadas por fases e hitos futuros (App Móvil Expo) |
| [06-ENV.md](./06-ENV.md) | Variables de entorno completas para entornos Local, QA y Producción |
| [TESTING.md](./TESTING.md) | Guía de Verificación Funcional (QA) por roles, casos de borde y plan de tests automatizados |
| [DESIGN.md](./DESIGN.md) | Sistema de diseño de interfaces: tipografías, colores y componentes de UI |

---

## Estado del Proyecto

```
Fase 1: Setup e Infraestructura     ██████████████  100%
Fase 2: Integración MercadoPago     ██████████████  100%
Fase 3: Interfaz Storefront         ██████████████  100%
Fase 4: Punto de Venta (POS)        ██████████████  100%
Fase 5: App Móvil (Expo)            ░░░░░░░░░░░░░░    0% (Planificado)
```

## Cómo Arrancar el Proyecto

```bash
# 1. Instalar dependencias
bun install # o npm install

# 2. Configurar variables de entorno
cp .example-env .env
# Completar las credenciales requeridas en el .env (ver docs/06-ENV.md)

# 3. Aplicar migraciones pendientes
bunx prisma migrate deploy

# 4. Sembrar base de datos con información de prueba
bun db:seed # o bun run db/seed.ts (según scripts del package.json)

# 5. Ejecutar servidor de desarrollo
bun run dev
```
