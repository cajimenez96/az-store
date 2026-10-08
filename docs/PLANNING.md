# Planificación de remediación — Revisión de código y seguridad

> **Origen:** revisión estática completa del repositorio realizada el 2026-10-02 con tres revisores independientes (code review de lógica de servidor, code review de UI y auditoría de seguridad OWASP).
> **Alcance:** bugs, vulnerabilidades, malas prácticas, código muerto y deuda de tests.
> **Metodología:** Kanban como flujo diario, con sprints Scrum de objetivo cerrado para agrupar el trabajo (sección 4).

---

## 1. Cómo leer este documento

**Prioridades**

| Nivel | Significado | Criterio |
|-------|-------------|----------|
| **P0 — Crítico** | Explotable hoy, impacto en dinero o datos | Un anónimo o cliente puede alterar precios, cuentas o archivos |
| **P1 — Alto** | Falla grave de seguridad, integridad o funcionalidad | Pérdida de ventas, stock inconsistente o acceso indebido con condiciones |
| **P2 — Medio** | Defecto real con impacto acotado o endurecimiento | Defensa en profundidad, consistencia, rendimiento |
| **P3 — Bajo / Deuda** | Limpieza y mantenibilidad | No cambia comportamiento observable |

**Estimación preliminar** (a refinar con el equipo en planning poker): **S** ≤ medio día · **M** 1–2 días · **L** 3–5 días.

**Evidencia**

- ✔ = verificado manualmente en el código al crear este documento.
- *Reportado* = hallazgo de revisión estática no ejecutada. **Primer paso de cada ticket: reproducirlo** (test que falla) antes de corregir. Si no se reproduce, se cierra con nota.

**Tipos de prueba usados en este proyecto**

- **Unit** (Jest, `__tests__/`): lógica aislada con Prisma mockeado.
- **Integración** (`jest.integration.config.ts`): contra una base de datos de test real.
- **E2E** (Playwright, `tests/e2e/`): flujos de usuario completos.
- **Manual**: verificación guiada, solo cuando no se puede automatizar.

---

## 2. Tablero Kanban

**Columnas:** `Backlog` → `Listo (Ready)` → `En desarrollo` → `En revisión` → `En pruebas` → `Hecho`

| Política | Regla |
|----------|-------|
| **Límite WIP** | Máximo 2 tickets en `En desarrollo` por persona y 3 en `En revisión` en total |
| **Carril expedite** | Solo P0 explotables de forma anónima (AZ-002, AZ-003, AZ-006). Máximo 1 a la vez, se atiende en 24–48 h |
| **Orden de tracción** | Siempre P0 → P1 → P2 → P3. Un P2/P3 no se empieza si hay un P0/P1 en `Listo` |
| **Rama y commits** | Una rama por ticket (`fix/AZ-00X-descripcion`). Commits convencionales, un commit por unidad de trabajo, con tests y docs incluidos |
| **PR** | Referencia el ticket. Si supera ~400 líneas modificadas se divide en PRs encadenados |

---

## 3. Resumen priorizado

| ID | Prioridad | Título | Tipo | Est. | Sprint |
|----|-----------|--------|------|------|--------|
| AZ-001 | P0 | Precio y cantidad deben resolverse en el servidor | Seguridad / Negocio | L | 1 |
| AZ-002 | P0 | Bypass de autenticación en actualización de perfil, dirección y método de pago | Seguridad | S | 1 (expedite) |
| AZ-003 | P0 | Acciones de talles sin autenticación | Seguridad | S | 1 (expedite) |
| AZ-004 | P0 | Reconciliar pagos de MercadoPago y proteger `createMercadoPagoOrder` | Seguridad / Negocio | M | 1 |
| AZ-005 | P0 | Borrado arbitrario de archivos vía `receiptUrl` y subidas sin rol | Seguridad | M | 1 |
| AZ-006 | P0 | Seed de producción con credenciales conocidas | Seguridad | S | 1 (expedite) |
| AZ-007 | P1 | Restaurar `proxy.ts` y el control de acceso por rol | Seguridad | M | 2 |
| AZ-008 | P1 | Validar stock de forma atómica al crear órdenes | Bug / Negocio | M | 2 |
| AZ-009 | P1 | Cron de expiración y aprobación/rechazo de transferencias inconsistentes | Bug / Negocio | M | 2 |
| AZ-010 | P1 | Rate limit de login efectivo y que falle cerrado | Seguridad | M | 2 |
| AZ-011 | P1 | Normalizar emails a minúsculas | Bug | S | 2 |
| AZ-012 | P1 | Cifrar el token de MercadoPago y proteger su lectura | Seguridad | M | 2 |
| AZ-013 | P1 | No exponer hashes de password ni acciones sin guarda | Seguridad | M | 2 |
| AZ-014 | P1 | Eliminar el mock de PayPal | Seguridad | S | 2 |
| AZ-015 | P1 | `updateOrderToPaid` idempotente y webhook con errores tipados | Bug / Negocio | M | 2 |
| AZ-016 | P1 | Emails rotos: links, cabecera secreta, página de recuperación y escape HTML | Bug / Seguridad | M | 3 |
| AZ-017 | P1 | XSS almacenado en JSON-LD de producto | Seguridad | S | 2 |
| AZ-018 | P1 | Open redirect en sign-in y sign-up | Seguridad | S | 2 |
| AZ-019 | P1 | Proteger los tests de integración contra borrado de la base equivocada | Seguridad / Tests | S | 2 |
| AZ-020 | P1 | La búsqueda no tiene paginación | Bug | S | 3 |
| AZ-021 | P1 | Crash de la galería al cambiar de color e imágenes vacías | Bug | S | 3 |
| AZ-022 | P1 | Editar un producto borra su subcategoría | Bug | S | 3 |
| AZ-023 | P1 | Componentes definidos dentro del render y doble submit al ordenar | Bug | M | 3 |
| AZ-024 | P1 | Agregar `error.tsx` y redirigir a sign-in en rutas de usuario | Bug | S | 3 |
| AZ-025 | P2 | Revalidar rol del JWT y endurecer el reseteo de contraseña | Seguridad | M | 4 |
| AZ-026 | P2 | Validación de inputs con zod y errores sin filtrar internos | Seguridad | M | 4 |
| AZ-027 | P2 | Costo de envío, total redondeado y datos de la orden en servidor | Bug / Negocio | M | 4 |
| AZ-028 | P2 | Códigos promocionales atómicos y validador único | Bug / Negocio | M | 4 |
| AZ-029 | P2 | Limitar lo que puede hacer un vendedor | Seguridad | M | 4 |
| AZ-030 | P2 | Integridad referencial: no borrar historial financiero | Datos | M | 4 |
| AZ-031 | P2 | Cabeceras de seguridad, CSP y cookies consistentes | Seguridad | M | 4 |
| AZ-032 | P2 | Crash del callback `session` al actualizar el perfil | Bug | S | 4 |
| AZ-033 | P2 | Trabajo en segundo plano que se pierde en serverless y N+1 de notificaciones | Bug / Rendimiento | M | 5 |
| AZ-034 | P2 | Caché, orden por precio y KPIs del dashboard | Bug | M | 5 |
| AZ-035 | P2 | Reparar tests vacíos y cubrir rutas críticas | Tests | L | 4–5 |
| AZ-036 | P2 | Tooling y dependencias: lint, tipos, auditoría y versiones | Mantenimiento | M | 5 |
| AZ-037 | P2 | ISR configurado pero inefectivo | Rendimiento | M | 5 |
| AZ-038 | P2 | Modo oscuro expuesto pero sin soporte | UX | S | 5 |
| AZ-039 | P2 | Accesibilidad y HTML inválido | UX / A11y | M | 5 |
| AZ-040 | P2 | POS: mutación de estado, stock sin color y modales | Bug | M | 5 |
| AZ-041 | P3 | Eliminar componentes muertos de la UI | Deuda | S | Continuo |
| AZ-042 | P3 | Dependencias sin uso o mal ubicadas | Deuda | S | Continuo |
| AZ-043 | P3 | Archivos que no deberían estar versionados | Deuda | S | Continuo |
| AZ-044 | P3 | Eliminar código muerto en `lib/`, `db/` y CSS | Deuda | M | Continuo |
| AZ-045 | P3 | Consolidar componentes y lógica duplicados | Deuda | L | Continuo |
| AZ-046 | P3 | Unificar el design system (tokens) | Deuda | L | Continuo |
| AZ-047 | P3 | Dividir archivos gigantes y extraer helpers | Deuda | L | Continuo |
| AZ-048 | P3 | Detalles de UX, SEO y assets faltantes | Deuda | M | Continuo |

---

## 4. Propuesta de sprints

> La capacidad del equipo y la duración del sprint no están definidas en este documento. Definirlas en la planning y ajustar el alcance. Regla general: comprometer entre 80 y 85 % de la capacidad.

| Sprint | Objetivo | Tickets |
|--------|----------|---------|
| **1 — Pagos y datos confiables** | Que nadie pueda alterar precios, cuentas ni archivos | AZ-001 a AZ-006 (AZ-002, AZ-003 y AZ-006 por carril expedite) |
| **2 — Acceso y consistencia de stock** | Cerrar accesos indebidos y estabilizar stock/pagos | AZ-007 a AZ-015, AZ-017, AZ-018, AZ-019 |
| **3 — Funcionalidad visible** | Corregir los bugs que ve el cliente y los emails | AZ-016, AZ-020 a AZ-024 |
| **4 — Endurecimiento** | Defensa en profundidad y cobertura de tests | AZ-025 a AZ-032, inicio de AZ-035 |
| **5 — Rendimiento y calidad** | Rendimiento, accesibilidad, tooling | AZ-033, AZ-034, AZ-035, AZ-036 a AZ-040 |
| **Continuo (Kanban)** | Deuda técnica, un ticket por semana como máximo | AZ-041 a AZ-048 |

**Riesgo operativo a revisar de inmediato (no es un ticket de código):** AZ-002 pudo haberse explotado ya. Antes de cerrarlo, revisar en producción si el primer usuario de la tabla `User` (probablemente el admin) tiene nombre, dirección o método de pago modificados sin explicación.

---

## 5. Definition of Ready y Definition of Done

**Definition of Ready** (para pasar a `Listo`)

- [ ] El problema fue **reproducido** o se confirmó leyendo el código (si es *Reportado*)
- [ ] Criterios de aceptación y pruebas revisados por otra persona
- [ ] Dependencias identificadas y desbloqueadas
- [ ] Estimación acordada

**Definition of Done**

- [ ] Test que fallaba primero (RED) y ahora pasa (GREEN)
- [ ] Todos los criterios de aceptación cumplidos y marcados
- [ ] `bun run test` y `bun run test:integration` en verde, sin tests nuevos en `skip`
- [ ] Typecheck y lint sin errores nuevos
- [ ] Sin `console.log` ni código comentado agregado
- [ ] Documentación actualizada si cambia un contrato (`docs/01-ARQUITECTURA.md`, variables de entorno)
- [ ] PR revisado y aprobado, commit convencional referenciando el ticket

---

## 6. Tickets

---

# 🔴 P0 — Crítico

---

### AZ-001 · Precio y cantidad deben resolverse en el servidor

- **Prioridad:** P0 · **Tipo:** Seguridad / Negocio · **Est.:** L · **Sprint:** 1
- **Evidencia:** ✔ [lib/actions/cart.actions.ts:64](../lib/actions/cart.actions.ts#L64) solo hace `cartItemSchema.parse(data)`. El stock se compara únicamente con `maxStock < 1`, no contra `qty`. `createOrder` y `createMercadoPagoOrder` cobran el `priceUsed` guardado. `resolvePriceUsed` ([lib/actions/price.actions.ts:56](../lib/actions/price.actions.ts#L56)) existe pero nadie la llama. El front envía siempre `priceCash` y `paymentMethod: 'CASH'` ([product-action.tsx:179](../components/shared/product/product-action.tsx#L179)), por lo que el recargo de MercadoPago nunca se aplica.

**Historia de usuario**
Como **dueño de la tienda** quiero que el servidor calcule siempre el precio, el nombre y el stock disponible de cada ítem para que **ningún cliente pueda comprar a un precio o cantidad alterados**.

**Descripción**
Cualquier persona puede invocar la server action `addItemToCart` con `priceUsed: '0.01'` y `qty: 500`. El servidor guarda esos valores y, al crear la orden, los toma como verdad. Resultado: ventas a centavos y sobreventa.

**Criterios de aceptación**
- [ ] `addItemToCart` ignora `priceUsed`, `name`, `slug`, `image` y `paymentMethod` enviados por el cliente y los obtiene de la base de datos.
- [ ] `qty` se valida contra el stock de la variante exacta (talle + color) en **todas** las rutas: carrito vacío, ítem nuevo e incremento.
- [ ] `createOrder` vuelve a resolver el precio de cada ítem según el método de pago del usuario (con `resolvePriceUsed`), recalcula subtotal, impuestos y total, y rechaza la orden si el carrito difiere.
- [ ] El recargo de MercadoPago se aplica cuando el método elegido es MercadoPago.
- [ ] `createPosOrder` resuelve precios en el servidor y no acepta `priceUsed` del cliente.
- [ ] `mergeCart` aplica las mismas validaciones al fusionar carritos.
- [ ] El front deja de enviar precios y el cliente solo muestra el que informa el servidor.

**Pruebas necesarias**
- **Unit:** payload con `priceUsed: '0.01'` → se persiste el precio de la base. `qty` mayor al stock → error. Variante inexistente → error claro.
- **Unit:** método de pago MercadoPago → precio con recargo; CASH → precio contado.
- **Integración:** carrito con precio manipulado directamente en la base → `createOrder` recalcula y el total coincide con la lista de precios.
- **Integración:** `createPosOrder` ignora el precio enviado.
- **E2E:** compra completa con CASH y con MercadoPago; el total mostrado y el cobrado coinciden con el precio de catálogo.

**Dependencias:** conviene hacerlo antes de AZ-004 y AZ-008.

---

### AZ-002 · Bypass de autenticación en actualización de perfil, dirección y método de pago

- **Prioridad:** P0 (expedite) · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 1
- **Evidencia:** ✔ [lib/actions/user.actions.ts:109-172](../lib/actions/user.actions.ts#L109-L172). `updateUserAddress`, `updateUserPaymentMethod` y `updateProfile` llaman a `findFirst({ where: { id: session?.user?.id } })` sin comprobar la sesión. Sin sesión, `id` es `undefined`, Prisma descarta el filtro y devuelve **el primer usuario de la tabla**, que luego se actualiza. *Reportado:* `authorize()` en [auth.ts](../auth.ts) tiene el mismo patrón con `email`.

**Historia de usuario**
Como **cliente** quiero que solo yo pueda modificar mis datos para que **nadie sin sesión pueda alterar la cuenta de otro usuario**.

**Descripción**
Un POST anónimo a cualquiera de las tres acciones modifica al primer usuario de la base, normalmente el más antiguo o el administrador. Permite cambiar su dirección de envío y redirigir pedidos.

**Criterios de aceptación**
- [ ] Las tres acciones responden con error de no autorizado cuando no hay `session.user.id`, sin tocar la base.
- [ ] Se usa `findUnique({ where: { id } })` en lugar de `findFirst` con un id posiblemente indefinido.
- [ ] Búsqueda global del patrón `where: { id: session?.user?.id }` y `where: { email }` con valor potencialmente `undefined`: sin ocurrencias restantes.
- [ ] `authorize()` valida el input con `signInFormSchema` y falla si falta el email.
- [ ] Se documentó la revisión de producción descrita en la sección 4 (primer usuario sin modificaciones sospechosas).

**Pruebas necesarias**
- **Unit:** sin sesión, cada acción devuelve error y `prisma.user.update` **no** es llamado.
- **Integración:** dos usuarios en la base; una llamada anónima no modifica ninguno.
- **Unit:** `authorize({ password })` sin email → `null`.
- **Regresión:** usuario autenticado actualiza solo su propio perfil, dirección y método de pago.

---

### AZ-003 · Acciones de talles sin autenticación

- **Prioridad:** P0 (expedite) · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 1
- **Evidencia:** ✔ [lib/actions/size.actions.ts](../lib/actions/size.actions.ts). `createSize` y `deleteSize` no tienen guarda y `createSize` pasa el objeto `data` directo a `prisma.size.create`. *Reportado:* ambas están referenciadas desde componentes cliente (`components/admin/size-form.tsx`, `app/admin/categories/[id]/page.tsx`).

**Historia de usuario**
Como **administrador** quiero que solo yo pueda crear y eliminar talles para que **el catálogo no se altere desde fuera**.

**Criterios de aceptación**
- [ ] `createSize` y `deleteSize` exigen `assertAdmin()`.
- [ ] `createSize` valida con zod `{ name, categoryId }` y solo persiste esos campos (sin escrituras anidadas).
- [ ] Se decide y documenta si `getSizesByCategory` es público o requiere sesión.
- [ ] Un talle usado por una variante no puede borrarse y el error es comprensible.

**Pruebas necesarias**
- **Unit:** sin sesión y con rol `user` → error; con rol `admin` → ok.
- **Unit:** payload con campos extra (`products: { create: ... }`) → rechazado o ignorado.
- **Integración:** borrar un talle en uso devuelve error y el talle sigue existiendo.

---

### AZ-004 · Reconciliar pagos de MercadoPago y proteger `createMercadoPagoOrder`

- **Prioridad:** P0 · **Tipo:** Seguridad / Negocio · **Est.:** M · **Sprint:** 1
- **Evidencia:** *Reportado por dos revisores.* [app/api/webhooks/mercadopago/route.ts:90-112](../app/api/webhooks/mercadopago/route.ts#L90-L112) confía en `external_reference` sin comparar `transaction_amount` ni `currency_id`. [order.actions.ts:1083-1148](../lib/actions/order.actions.ts#L1083-L1148) no valida sesión, dueño ni `isPaid`, y arma la preferencia con `priceUsed × qty` ignorando descuentos, banners e impuestos. Positivo: la firma HMAC y la consulta del pago a la API de MercadoPago ya están bien resueltas.

**Historia de usuario**
Como **dueño de la tienda** quiero que una orden solo se marque pagada si el pago real coincide con el total para que **no se entregue mercadería sin cobrarla completa**.

**Criterios de aceptación**
- [ ] El webhook compara monto (al centavo), moneda, método de pago de la orden y estado (no cancelada, no pagada) antes de `updateOrderToPaid`.
- [ ] Ante discrepancia no marca la orden como pagada, registra el motivo, deja la orden marcada para revisión manual y responde 200 para evitar reintentos infinitos.
- [ ] `createMercadoPagoOrder` exige sesión, que `order.userId === session.user.id`, que no esté pagada ni cancelada y que el método sea MercadoPago.
- [ ] La preferencia suma exactamente `order.totalPrice` (un ítem único o desglose que cuadre).
- [ ] No sobreescribe `paymentResult` de órdenes ya pagadas.

**Pruebas necesarias**
- **Unit (webhook):** monto menor al total → no paga; moneda distinta → no paga; orden de otro método → no paga; orden cancelada → no paga; caso feliz → paga y llama a `updateOrderToPaid`.
- **Unit:** `createMercadoPagoOrder` sin sesión, con orden ajena y con orden pagada → error.
- **Integración:** orden con promo y banner: el total de la preferencia es igual a `order.totalPrice`.
- **Manual (sandbox MercadoPago):** pago aprobado de punta a punta.

**Dependencias:** AZ-001 (precios correctos), AZ-015 (idempotencia).

---

### AZ-005 · Borrado arbitrario de archivos vía `receiptUrl` y subidas sin rol

- **Prioridad:** P0 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 1
- **Evidencia:** *Reportado por dos revisores.* [order.actions.ts:899-927](../lib/actions/order.actions.ts#L899-L927) guarda un `receiptUrl` sin validar host ni dueño y, al reemplazarlo, llama a `deleteUTFiles` con el último segmento de la URL ([lib/uploadthing-helpers.ts:12-17](../lib/uploadthing-helpers.ts#L12-L17)). [app/api/uploadthing/core.ts](../app/api/uploadthing/core.ts) permite `imageUploader` (16 MB × 10) a cualquier usuario con sesión.

**Historia de usuario**
Como **dueño de la tienda** quiero que un cliente solo pueda adjuntar y reemplazar su propio comprobante para que **no pueda borrar imágenes de productos ni consumir mi almacenamiento**.

**Criterios de aceptación**
- [ ] `receiptUrl` solo acepta URLs de `utfs.io` o `*.ufs.sh` del app ID del proyecto.
- [ ] Solo se borran archivos cuya key fue registrada como subida por ese usuario para esa orden.
- [ ] Nunca se borra un archivo referenciado por otra fila (producto, banner, otra orden).
- [ ] No se puede cambiar el comprobante de una orden ya pagada.
- [ ] `imageUploader` requiere rol admin o vendedor. `receiptUploader` exige un `orderId` propio.
- [ ] Tipos MIME permitidos explícitos (sin SVG).

**Pruebas necesarias**
- **Unit:** URL externa → rechazada. URL de la key de una imagen de producto → rechazada y no se llama a `deleteUTFiles`.
- **Unit:** cliente intenta usar `imageUploader` → 403.
- **Integración:** reemplazar comprobante propio borra el anterior; orden pagada → rechazo.
- **Manual:** subir y reemplazar un comprobante desde la pantalla de la orden.

---

### AZ-006 · Seed de producción con credenciales conocidas

- **Prioridad:** P0 (expedite) · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 1
- **Evidencia:** *Reportado por dos revisores.* `package.json` define `db:seed:prod` apuntando a `.env.prod`. [prisma/seed.ts](../prisma/seed.ts) hace `upsert` de `admin@qa.example.com` con contraseña fija, **resetea la contraseña si el usuario ya existe** y la imprime por consola. `db/seed.ts` es un duplicado.

**Historia de usuario**
Como **responsable de seguridad** quiero que ningún script cree administradores con contraseñas públicas en producción para que **nadie entre como admin con credenciales del repositorio**.

**Criterios de aceptación**
- [ ] Se elimina el script `db:seed:prod`.
- [ ] El seed aborta si `NODE_ENV === 'production'` o si la URL de base de datos apunta a producción.
- [ ] Las credenciales vienen de variables de entorno o se generan al azar y no se imprimen.
- [ ] El seed nunca modifica la contraseña de un usuario existente.
- [ ] Se elimina `db/seed.ts` duplicado (o se unifica con `prisma/seed.ts`).
- [ ] Se verificó en producción que `admin@qa.example.com` no existe o fue eliminado/rotado.

**Pruebas necesarias**
- **Unit:** el seed con `NODE_ENV=production` termina con error sin escribir.
- **Unit:** ejecutar el seed dos veces no cambia la contraseña de un usuario existente.
- **Manual:** revisar la tabla `User` de producción.

---

# 🟠 P1 — Alto

---

### AZ-007 · Restaurar `proxy.ts` y el control de acceso por rol

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 2
- **Evidencia:** ✔ No existe `middleware.ts` ni `proxy.ts` en el repositorio. El callback `authorized` de [auth.config.ts:16-54](../auth.config.ts#L16-L54) nunca se ejecuta: ni las rutas protegidas, ni la restricción "vendedor solo POS", ni la creación de la cookie `sessionCartId`. `__tests__/middleware/auth-config.test.ts` prueba código que no corre. `docs/01-ARQUITECTURA.md` describe un middleware inexistente.

**Historia de usuario**
Como **administrador** quiero que el acceso por rol se aplique antes de renderizar para que **un solo guard olvidado en una página no abra el panel**.

**Criterios de aceptación**
- [ ] Existe `proxy.ts` (Next 16) que envuelve `NextAuth(authConfig).auth` con un `matcher` explícito.
- [ ] Anónimos que visitan `/user/**` y `/admin/**` van a `/sign-in` con `callbackUrl` válido.
- [ ] Vendedores solo acceden a las rutas permitidas (decisión de producto documentada).
- [ ] La cookie `sessionCartId` se crea de forma consistente con `cart.actions.ts`.
- [ ] Los guards por página y por acción se mantienen (defensa en profundidad).
- [ ] `docs/01-ARQUITECTURA.md` y el test de `auth.config` reflejan la realidad.

**Pruebas necesarias**
- **Unit:** matriz ruta × rol (anónimo, usuario, vendedor, admin).
- **E2E:** anónimo en `/admin` y `/user/orders` redirige a sign-in; vendedor en `/admin/products` según política.
- **Manual:** build de producción para confirmar que el proxy no rompe assets ni `/api/auth`.

**Dependencias:** decisión de producto sobre qué ve el vendedor (ver AZ-029).

---

### AZ-008 · Validar stock de forma atómica al crear órdenes

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** M · **Sprint:** 2
- **Evidencia:** *Reportado.* [order.actions.ts:238-284](../lib/actions/order.actions.ts#L238-L284): `createOrder` decrementa con `stock: { decrement }` sin la condición `stock >= qty`. [order.actions.ts:1341-1350](../lib/actions/order.actions.ts#L1341-L1350): el POS lee y luego decrementa (race) y no valida ítems sin talle ni color. `updateOrderToPaid` ya tiene el decremento condicional correcto.

**Historia de usuario**
Como **dueño de la tienda** quiero que el stock nunca quede negativo para que **no se vendan unidades que no existen**.

**Criterios de aceptación**
- [ ] Existe un helper compartido `decrementStock(tx, item)` con `UPDATE ... WHERE stock >= qty` y error si afecta 0 filas.
- [ ] `createOrder`, `updateOrderToPaid` y `createPosOrder` lo usan.
- [ ] Si falta una variante, la orden falla en lugar de omitirse en silencio.
- [ ] Ítems sin talle ni color también se validan.
- [ ] Cualquier error revierte toda la transacción.

**Pruebas necesarias**
- **Unit:** stock 1 y qty 2 → falla y no hay cambios.
- **Integración:** dos `createOrder` concurrentes por la última unidad → exactamente una tiene éxito.
- **Integración:** variante inexistente → orden rechazada, sin efectos parciales.

**Dependencias:** AZ-001.

---

### AZ-009 · Cron de expiración y aprobación/rechazo de transferencias inconsistentes

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** M · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* [app/api/cron/release-expired-orders/route.ts:27-68](../app/api/cron/release-expired-orders/route.ts#L27-L68): restaura stock buscando la variante solo por talle (ignora `colorId`) y omite ítems de solo color; cancela órdenes que ya tienen `receiptUrl`. `approveBankTransfer` no valida `CANCELLED`; `rejectBankTransfer` no valida `isPaid` ni `CANCELLED`, y rechazar dos veces suma el stock dos veces.

**Historia de usuario**
Como **dueño de la tienda** quiero que cancelar, rechazar y aprobar transferencias mantenga el stock exacto para que **el inventario refleje la realidad**.

**Criterios de aceptación**
- [ ] Un único helper `findVariant(tx, item)` (talle, color o ambos) lo usan `createOrder`, el cron, `rejectBankTransfer`, `updateOrderToPaid` y `mergeCart`.
- [ ] El cron no cancela órdenes con comprobante pendiente de revisión.
- [ ] `approveBankTransfer` rechaza órdenes canceladas, o vuelve a reservar stock de forma atómica.
- [ ] `rejectBankTransfer` es idempotente: segunda llamada no altera stock; órdenes pagadas no se pueden rechazar.
- [ ] El cron es seguro ante ejecuciones concurrentes (no restaura dos veces).

**Pruebas necesarias**
- **Unit/Integración:** variantes con color, con talle y con ambos: el stock vuelve a la variante correcta.
- **Integración:** orden con comprobante y más de 24 h → no se cancela.
- **Unit:** rechazar dos veces → stock sumado una sola vez.
- **Integración:** aprobar una orden cancelada → rechazo o re-reserva consistente.

**Dependencias:** AZ-008.

---

### AZ-010 · Rate limit de login efectivo y que falle cerrado

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* El límite vive solo en la server action ([user.actions.ts:36-40](../lib/actions/user.actions.ts#L36-L40)). `/api/auth/callback/credentials` queda expuesto sin límite. [lib/rate-limiter.ts](../lib/rate-limiter.ts) devuelve `success: true` si falta `UPSTASH_REDIS_REST_URL`. La clave es solo el email, lo que permite bloquear a una víctima.

**Historia de usuario**
Como **cliente** quiero que mi cuenta esté protegida contra adivinanza de contraseñas para que **nadie pueda tomarla ni bloquearme a voluntad**.

**Criterios de aceptación**
- [ ] El límite se aplica dentro de `authorize()`, por IP y por email.
- [ ] Sin Redis configurado en producción: falla cerrado (o falla el arranque) y loguea con claridad.
- [ ] Respuesta y tiempo uniformes para usuario inexistente (hash ficticio con `bcrypt.compare`).
- [ ] El bloqueo por email no impide que el dueño legítimo entre desde otra IP de forma indefinida (política documentada).

**Pruebas necesarias**
- **Unit:** N intentos fallidos → bloqueo; límite por IP y por email independientes.
- **Unit:** limiter sin configuración en `NODE_ENV=production` → deniega.
- **Integración:** POST directo a `/api/auth/callback/credentials` también se limita.

---

### AZ-011 · Normalizar emails a minúsculas

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S · **Sprint:** 2
- **Evidencia:** *Reportado.* `signUpUser` guarda el email tal cual; `authorize()` compara sensible a mayúsculas; `requestPasswordReset` usa `toLowerCase()`; `createPosCustomer` verifica sin normalizar y guarda normalizado. Un usuario registrado como `Foo@x.com` nunca puede restablecer su contraseña.

**Historia de usuario**
Como **cliente** quiero entrar y recuperar mi contraseña sin importar cómo escribí el email para que **no me quede fuera de mi cuenta**.

**Criterios de aceptación**
- [ ] Emails se normalizan (trim + minúsculas) en alta, login, reseteo y POS.
- [ ] Migración de datos que normaliza emails existentes, con detección y resolución de duplicados.
- [ ] Restricción única efectiva sobre el email normalizado.

**Pruebas necesarias**
- **Unit:** alta con `Foo@X.com` guarda `foo@x.com`; login con cualquier variante funciona.
- **Integración:** la migración detecta duplicados `A@x.com` / `a@x.com` y los reporta.
- **Regresión:** reseteo de contraseña con email de mayúsculas mixtas.

---

### AZ-012 · Cifrar el token de MercadoPago y proteger su lectura

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 2
- **Evidencia:** ✔ [lib/encrypt.ts](../lib/encrypt.ts): `encryptToken` y `decryptToken` devuelven el input sin tocar; el token queda en texto plano en `Setting`. *Reportado:* `getMercadoPagoSettings` y `getSetting(key)` son exportaciones públicas de un archivo `'use server'` sin autorización; `getSetting('MERCADOPAGO_ACCESS_TOKEN')` devolvería el token.

**Historia de usuario**
Como **dueño de la tienda** quiero que mis credenciales de pago estén cifradas y solo las lea el servidor para que **una filtración de la base de datos no exponga mi cuenta de cobro**.

**Criterios de aceptación**
- [ ] AES-256-GCM con IV aleatorio de 12 bytes por cifrado; formato `iv:tag:ciphertext`; clave de 32 bytes desde variable de entorno o gestor de secretos.
- [ ] Migración que cifra el valor existente sin interrumpir el servicio (lectura tolerante a valores sin cifrar durante la transición).
- [ ] `getSetting` solo acepta claves de una lista blanca y exige autorización; el token nunca viaja al cliente.
- [ ] El token no se rellena en el formulario del admin (se muestra enmascarado).
- [ ] Se elimina el código comentado de `encrypt.ts`.

**Pruebas necesarias**
- **Unit:** cifrar/descifrar es reversible; IV distinto en cada cifrado; ciphertext alterado → error de autenticación.
- **Unit:** `getSetting('MERCADOPAGO_ACCESS_TOKEN')` desde un contexto sin admin → error.
- **Integración:** el valor en base de datos no coincide con el token en claro.

---

### AZ-013 · No exponer hashes de password ni acciones sin guarda

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* `searchPosCustomers` ([user.actions.ts:292-303](../lib/actions/user.actions.ts#L292-L303)), `getAllUsers` y `getUserById` devuelven la fila completa con el hash bcrypt. Sin guarda: `getOrderById`, `getAllOrders`, `getOrderSummary`, `getInventory`, `getSellerCommissionSummary`, `getMyCommissionRate`, `recordPromoCodeUsage`, `getAllPromoBanners`, `getPromoBannerById`, `updateOrderToPaid`.

**Historia de usuario**
Como **responsable de seguridad** quiero que ninguna exportación de un archivo `'use server'` exponga datos sin autorización para que **una importación accidental desde un componente cliente no abra una fuga**.

**Criterios de aceptación**
- [ ] Ninguna consulta de usuario devuelve `password`; todas usan `select` explícito.
- [ ] Las funciones de acceso a datos internas se mueven a módulos `server-only` (por ejemplo `lib/data/*`).
- [ ] Los archivos `'use server'` solo contienen acciones con su propia autorización (y comprobación de dueño donde aplique).
- [ ] `updateOrderToPaid` no es invocable por clientes con un `paymentResult` arbitrario.
- [ ] Test que recorre las exportaciones de los archivos `'use server'` y falla si alguna no llama a un guard.

**Pruebas necesarias**
- **Unit:** cada acción sin sesión → error; con rol insuficiente → error.
- **Unit:** las respuestas de búsqueda de usuarios no contienen la clave `password`.
- **Unit (lint de contrato):** test de recorrido de exportaciones.

---

### AZ-014 · Eliminar el mock de PayPal

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* [lib/paypal.ts](../lib/paypal.ts) siempre responde `COMPLETED` con `dummy-paypal-id`. `createPayPalOrder` y `approvePayPalOrder` ([order.actions.ts:390-475](../lib/actions/order.actions.ts#L390-L475)) no tienen autorización ni verificación de dueño. Hoy no se importan desde el cliente.

**Historia de usuario**
Como **dueño de la tienda** quiero eliminar caminos de pago falsos para que **no exista forma de marcar una orden como pagada sin pagar**.

**Criterios de aceptación**
- [ ] Se eliminan `lib/paypal.ts`, `createPayPalOrder` y `approvePayPalOrder` y las referencias en tipos, validadores y constantes.
- [ ] Si PayPal se retoma, será un ticket nuevo con integración real, validación de monto y dueño.
- [ ] La documentación y la UI no mencionan PayPal como método disponible.

**Pruebas necesarias**
- **Unit/Typecheck:** el proyecto compila sin las referencias eliminadas.
- **Manual:** el checkout no ofrece PayPal.

---

### AZ-015 · `updateOrderToPaid` idempotente y webhook con errores tipados

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** M · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* [order.actions.ts:487-555](../lib/actions/order.actions.ts#L487-L555) comprueba `isPaid` fuera de la transacción y actualiza con `where: { id }`; dos webhooks simultáneos decrementan dos veces. Si lanza "Stock insuficiente", el webhook responde 500 y MercadoPago reintenta sin fin con el cliente ya cobrado. La idempotencia se detecta comparando el texto `'La orden ya está pagada'`.

**Historia de usuario**
Como **dueño de la tienda** quiero que un pago procesado dos veces o sin stock se maneje de forma segura para que **no haya doble descuento de stock ni reintentos infinitos**.

**Criterios de aceptación**
- [ ] Dentro de la transacción se usa `updateMany({ where: { id, isPaid: false } })` y se aborta si `count === 0`.
- [ ] Errores de dominio tipados (`AlreadyPaidError`, `InsufficientStockError`, `VariantNotFoundError`) en lugar de comparar texto.
- [ ] Ante falta de stock tras un pago aprobado: la orden queda marcada para revisión manual (posible reembolso), se notifica a un administrador y el webhook responde 200.
- [ ] Un segundo webhook idéntico no repite stock, emails ni comisiones.

**Pruebas necesarias**
- **Integración:** dos `updateOrderToPaid` concurrentes → stock descontado una sola vez.
- **Unit (webhook):** `InsufficientStockError` → 200, orden marcada, sin reintento.
- **Unit:** reintento del mismo `mpPaymentId` → idempotente.

**Dependencias:** AZ-004, AZ-008.

---

### AZ-016 · Emails rotos: links, cabecera secreta, página de recuperación y escape HTML

- **Prioridad:** P1 · **Tipo:** Bug / Seguridad · **Est.:** M · **Sprint:** 3
- **Evidencia:** *Reportado por dos revisores.* Links a `/orders/${id}` (la ruta real es `/order/[id]`) en `email-templates.ts`. El link `/cart-recovery/${token}` no tiene página. `sendNewSaleNotification` ([lib/email.ts:96-106](../lib/email.ts#L96-L106)) omite `x-internal-secret` y recibe 403. Ningún envío revisa `res.ok`. Los envíos son un HTTP a sí mismo, con `localhost:3000` de respaldo en producción. Valores como `customerName`, `item.name`, `reason` se interpolan sin escapar. `shippingUpdateTemplate` espera estados que la app no usa y el correo "entregado" dice "en camino".

**Historia de usuario**
Como **cliente** quiero recibir correos correctos con links que funcionen para que **pueda seguir mi pedido y recuperar mi carrito**.

**Criterios de aceptación**
- [ ] Todos los links de los correos apuntan a rutas existentes (test que los valida contra el router).
- [ ] Existe la página `/cart-recovery/[token]` y la recuperación funciona de punta a punta.
- [ ] Los envíos llaman directamente al cliente de Resend (sin HTTP a sí mismo) o incluyen la cabecera secreta; se revisa y registra cualquier fallo.
- [ ] Todo valor dinámico se escapa en HTML (o se usan componentes de React Email).
- [ ] Los estados de envío de la plantilla coinciden con los de `validators.ts` y `deliverOrder` actualiza `shippingStatus` a "Entregado".
- [ ] Sin fallback a `localhost` en producción: falla con un error claro.
- [ ] Marca, año y soporte salen de una única constante.

**Pruebas necesarias**
- **Unit:** plantillas con `<script>` en el nombre → salida escapada.
- **Unit:** snapshot de cada plantilla y validación de sus links.
- **Integración:** `/api/send-email` rechaza sin secreto y acepta con secreto; fallo de Resend se loguea.
- **E2E:** flujo de carrito abandonado → link → carrito recuperado.

---

### AZ-017 · XSS almacenado en JSON-LD de producto

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* [app/(cinematic)/product/[slug]/page.tsx:106-108](../app/(cinematic)/product/[slug]/page.tsx#L106-L108) usa `dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}` y `JSON.stringify` no escapa `<`. Un nombre de producto con `</script><script>…` se ejecuta para todos los visitantes. `name` y `description` solo exigen `min(3)`.

**Historia de usuario**
Como **visitante** quiero que los datos de un producto nunca ejecuten código en mi navegador para que **un vendedor malicioso no pueda atacar a clientes ni a administradores**.

**Criterios de aceptación**
- [ ] La salida de JSON-LD escapa `<`, `>` y `&` (por ejemplo `.replace(/</g, '\\u003c')`).
- [ ] Búsqueda de otros usos de `dangerouslySetInnerHTML` revisados.
- [ ] Una CSP mitiga el impacto residual (ver AZ-031).

**Pruebas necesarias**
- **Unit:** producto con `</script><script>alert(1)</script>` → el HTML generado no contiene el cierre de script.
- **E2E:** página de producto con ese nombre no dispara `alert`.

---

### AZ-018 · Open redirect en sign-in y sign-up

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** S · **Sprint:** 2
- **Evidencia:** *Reportado por dos revisores.* [app/(auth)/sign-in/page.tsx:29-35](../app/(auth)/sign-in/page.tsx#L29-L35) y [sign-up/page.tsx](../app/(auth)/sign-up/page.tsx) hacen `redirect(callbackUrl || '/')` con el parámetro sin validar. Los inputs ocultos `callbackUrl` de los formularios lo reenvían. No se verificó la validación en las server actions.

**Historia de usuario**
Como **cliente** quiero que iniciar sesión nunca me lleve a un sitio externo para que **no me usen en campañas de phishing**.

**Criterios de aceptación**
- [ ] Función `safeCallbackUrl()` que solo acepta rutas relativas (empiezan con `/`, no con `//`, sin `\`).
- [ ] Se usa en las dos páginas y en las server actions de sign-in y sign-up.
- [ ] Cualquier valor inválido cae a `/`.

**Pruebas necesarias**
- **Unit:** tabla de casos (`https://evil.tld`, `//evil.tld`, `/\evil`, `javascript:`, `/cart`, vacío).
- **E2E:** `/sign-in?callbackUrl=https://evil.tld` con sesión iniciada termina en `/`.

---

### AZ-019 · Proteger los tests de integración contra borrado de la base equivocada

- **Prioridad:** P1 · **Tipo:** Seguridad / Tests · **Est.:** S · **Sprint:** 2
- **Evidencia:** *Reportado.* [jest.globalSetup.ts](../jest.globalSetup.ts) llama a `dotenv.config()` sin `override`; un `DATABASE_URL` ya exportado en la shell gana, y luego corre `prisma db push --force-reset --accept-data-loss` sin comprobar que sea una base de test.

**Historia de usuario**
Como **desarrollador** quiero que los tests de integración se nieguen a correr contra una base real para que **un mal export no borre datos**.

**Criterios de aceptación**
- [ ] Se usa `dotenv.config({ override: true })` sobre un archivo de test dedicado.
- [ ] El setup aborta si el nombre de la base o el host no contiene `test` (o no está en una lista blanca).
- [ ] El script `test:integration` usa `--runInBand` o bases aisladas por worker y documenta la limpieza entre tests.

**Pruebas necesarias**
- **Unit:** el guard lanza con una URL de producción simulada y no ejecuta `db push`.
- **Manual:** correr la suite con `DATABASE_URL` exportado hacia otra base: aborta.

---

### AZ-020 · La búsqueda no tiene paginación

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S · **Sprint:** 3
- **Evidencia:** *Reportado.* [app/(root)/search/page.tsx](../app/(root)/search/page.tsx): `getAllProducts` devuelve `totalPages` (`PAGE_SIZE` = 12) pero la página nunca renderiza `Pagination`. El contador "(N resultados)" muestra el tamaño de la página, no el total. `getAllProducts` además puede recibir `NaN` por parámetros inválidos.

**Historia de usuario**
Como **cliente** quiero navegar todos los resultados de búsqueda para que **pueda ver y comprar productos más allá de los primeros 12**.

**Criterios de aceptación**
- [ ] La página muestra paginación cuando `totalPages > 1`.
- [ ] El contador muestra el total real de resultados.
- [ ] Los filtros y el orden se conservan al cambiar de página.
- [ ] Parámetros inválidos (`page`, `price`, `rating`) se normalizan sin error 500.
- [ ] El orden por precio se aplica en la consulta (ver AZ-034).

**Pruebas necesarias**
- **E2E:** con más de 12 productos se ve la paginación y la página 2 muestra otros productos.
- **Unit:** `page=abc` y `price=x-y` no rompen.

---

### AZ-021 · Crash de la galería al cambiar de color e imágenes vacías

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S · **Sprint:** 3
- **Evidencia:** *Reportado.* [components/shared/product/product-images.tsx:7](../components/shared/product/product-images.tsx#L7): `current` no se reinicia cuando cambia `images`; con `current = 3` y un color de 2 imágenes, `images[current]` es `undefined` y `next/image` lanza. `product-card.tsx:41` usa `product.images[0]` sin proteger el arreglo vacío.

**Historia de usuario**
Como **cliente** quiero cambiar de color sin que la página se rompa para que **pueda comprar el producto**.

**Criterios de aceptación**
- [ ] El índice actual se reinicia al cambiar el conjunto de imágenes (por ejemplo `key` o efecto).
- [ ] Un producto sin imágenes muestra un placeholder existente en `public/`, sin lanzar errores.
- [ ] Los botones miniatura tienen `type="button"` y `aria-label`.

**Pruebas necesarias**
- **Unit (componente):** color A con 4 imágenes en la 4.ª, cambio a color B con 2 → renderiza la 1.ª.
- **Unit:** `images=[]` → placeholder.
- **E2E:** cambiar entre colores en la página de producto sin errores en consola.

---

### AZ-022 · Editar un producto borra su subcategoría

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S · **Sprint:** 3
- **Evidencia:** *Reportado.* [components/admin/product-form.tsx:195-199](../components/admin/product-form.tsx#L195-L199): el efecto sobre `[categoryId, categories, form]` corre en el montaje y llama a `form.setValue('subCategoryId', null)` en modo edición.

**Historia de usuario**
Como **administrador** quiero editar un producto sin perder su subcategoría para que **no se desordene el catálogo sin que me dé cuenta**.

**Criterios de aceptación**
- [ ] La subcategoría solo se reinicia cuando el usuario cambia la categoría (se compara con el valor previo con un ref).
- [ ] Guardar un producto sin tocar la categoría conserva su subcategoría.

**Pruebas necesarias**
- **Unit (componente):** montar en modo edición con subcategoría → el valor se mantiene.
- **Unit:** cambiar la categoría → la subcategoría se limpia.
- **E2E:** editar el nombre de un producto con subcategoría y verificar que persiste.

---

### AZ-023 · Componentes definidos dentro del render y doble submit al ordenar

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** M · **Sprint:** 3
- **Evidencia:** *Reportado.* [order-details-table.tsx:72-197](../app/(root)/order/[id]/order-details-table.tsx#L72-L197) declara `MarkAsDeliveredButton`, `PayWithMercadoPagoButton`, `ApprovePaymentButton`, `RejectPaymentButton` y `MarkAsPaidButton` dentro de `OrderDetailsTable`, cada uno con `useTransition`: se remontan en cada render y pierden `isPending`. Igual en `SignInButton` y `SignUpButton`. [place-order-form.tsx:47-49](../app/(root)/place-order/place-order-form.tsx#L47-L49) hace `setPending(false)` en `finally`, incluso tras `router.push`, y el botón vuelve a quedar activo durante la navegación.

**Historia de usuario**
Como **cliente** quiero que un doble clic no cree dos órdenes ni dos pagos para que **no me cobren ni me despachen dos veces**.

**Criterios de aceptación**
- [ ] Todos esos componentes se mueven al nivel de módulo (o a archivos propios).
- [ ] `PlaceOrderForm` solo rehabilita el botón en rutas de error.
- [ ] `createOrder` es idempotente frente a doble invocación del mismo carrito (el carrito se consume en la misma transacción).
- [ ] Los botones de aprobar y rechazar no pueden dispararse dos veces mientras hay una acción en curso.

**Pruebas necesarias**
- **Unit (componente):** un re-render del padre no reinicia el estado `pending` de los botones.
- **E2E:** doble clic rápido en "Realizar pedido" → una sola orden.
- **Integración:** dos `createOrder` con el mismo carrito → una orden.

---

### AZ-024 · Agregar `error.tsx` y redirigir a sign-in en rutas de usuario

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S · **Sprint:** 3
- **Evidencia:** ✔ No existe `middleware.ts` ni `proxy.ts`. *Reportado:* no hay `error.tsx` ni `global-error.tsx` en `app/`; `getMyOrders` lanza `'Usuario no autorizado'` ([order.actions.ts:594](../lib/actions/order.actions.ts#L594)) y `app/user/orders/page.tsx` no comprueba sesión, así que un anónimo ve el 500 por defecto.

**Historia de usuario**
Como **cliente** quiero ver una pantalla clara o ser enviado a iniciar sesión cuando algo falla para que **no me quede frente a un error genérico**.

**Criterios de aceptación**
- [ ] Existen `app/error.tsx` y `app/global-error.tsx` con mensaje y reintento, sin filtrar detalles internos.
- [ ] Las páginas `/user/**` redirigen a `/sign-in` sin sesión (con o sin `proxy.ts`).
- [ ] Los errores se registran en el servidor.

**Pruebas necesarias**
- **E2E:** anónimo en `/user/orders` termina en `/sign-in`.
- **Unit:** error simulado en una página → se muestra `error.tsx`.

**Dependencias:** AZ-007 (puede resolverse parcialmente solo con este ticket).

---

# 🟡 P2 — Medio

---

### AZ-025 · Revalidar rol del JWT y endurecer el reseteo de contraseña

- **Prioridad:** P2 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* [auth.ts](../auth.ts): el rol se copia al token solo al iniciar sesión (24 h). Un admin degradado o eliminado conserva el acceso hasta 24 h; resetear la contraseña no invalida sesiones. [auth.actions.ts](../lib/actions/auth.actions.ts): `resetPassword` exige solo 6 caracteres (el alta pide 8 + mayúscula + número), `requestPasswordReset` no tiene rate limit y los tokens se guardan en claro.

**Historia de usuario**
Como **administrador** quiero que un cambio de rol o de contraseña tenga efecto inmediato para que **un acceso comprometido no siga vigente**.

**Criterios de aceptación**
- [ ] El callback `jwt` revalida existencia y rol contra la base periódicamente o en acciones privilegiadas.
- [ ] `tokenVersion` o `passwordChangedAt` invalida sesiones previas tras un reseteo.
- [ ] `resetPassword` usa `resetPasswordSchema` con la misma política que el alta.
- [ ] `requestPasswordReset` tiene rate limit por IP y email; el token se guarda como SHA-256.
- [ ] `maxAge` más corto para roles admin (política documentada).

**Pruebas necesarias**
- **Unit:** token con rol obsoleto → la sesión refleja el rol actual.
- **Unit:** contraseña débil en reseteo → rechazada.
- **Integración:** tras un reseteo, la sesión anterior deja de ser válida.

---

### AZ-026 · Validación de inputs con zod y errores sin filtrar internos

- **Prioridad:** P2 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* `formatError` ([lib/utils.ts:24-47](../lib/utils.ts#L24-L47)) devuelve `error.message` crudo (mensajes de Prisma). `updateUser` acepta `role` como string libre y no impide auto-degradarse ni borrar al último admin; `updateProfile`, `createCategory`, `createSubCategory`, `createPosCustomer` y `createPosOrder.paymentMethod` no validan con sus esquemas. El alta devuelve "ya existe" (enumeración de cuentas). Los patrones de error son inconsistentes (algunas acciones lanzan, otras devuelven `{success}`).

**Historia de usuario**
Como **responsable de seguridad** quiero que toda entrada se valide en el servidor y que los errores no revelen detalles para que **un atacante no aprenda del sistema ni lo manipule**.

**Criterios de aceptación**
- [ ] Todas las acciones validan su input con un esquema zod explícito.
- [ ] `role` es un enum; no se puede dejar al sistema sin admin ni auto-degradarse.
- [ ] `formatError` mapea errores conocidos a mensajes genéricos en español y registra el detalle solo en el servidor.
- [ ] Una convención única de respuesta `{ success, message, data }` para todas las acciones.
- [ ] Respuesta genérica en el alta ante email duplicado.

**Pruebas necesarias**
- **Unit:** payloads inválidos por acción → error de validación sin llegar a Prisma.
- **Unit:** error de Prisma → mensaje genérico al cliente.
- **Unit:** degradar al último admin → rechazado.

---

### AZ-027 · Costo de envío, total redondeado y datos de la orden en servidor

- **Prioridad:** P2 · **Tipo:** Bug / Negocio · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* [order.actions.ts:30-40,194-209](../lib/actions/order.actions.ts#L30-L40): `shippingMethod` no se usa, `shippingPrice` viene de `cart.shippingPrice` (siempre `0.00`), `bannerDiscount` se descarta y `totalPrice` no pasa por `round2` (ruido de coma flotante que el validador `currency` rechaza). `getShippingSettings` se importa y no se usa en `cart.actions.ts`.

**Historia de usuario**
Como **dueño de la tienda** quiero que el envío se calcule y se guarde con la orden para que **cobre el costo real y vea cómo se entrega cada pedido**.

**Criterios de aceptación**
- [ ] El costo de envío se calcula en el servidor según método, destino y `getShippingSettings()`.
- [ ] El método de envío y el descuento de banner se persisten en la orden.
- [ ] Todos los importes usan una función de redondeo única y el total nunca falla por decimales.
- [ ] El umbral de envío gratis se aplica en el servidor.

**Pruebas necesarias**
- **Unit:** combinaciones de precio + promo + banner no generan ruido decimal.
- **Unit:** envío gratis sobre el umbral; retiro en tienda = 0.
- **Integración:** la orden guarda `shippingMethod` y los importes correctos.

---

### AZ-028 · Códigos promocionales atómicos y validador único

- **Prioridad:** P2 · **Tipo:** Bug / Negocio · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* El chequeo de `maxUsesPerUser` está fuera de la transacción de `createOrder` (TOCTOU) y es ilimitado si es `null`. La lógica se duplica entre `createOrder` y `app/api/validate-promo/route.ts`. Promo y banner se apilan sobre el precio completo. `recordPromoCodeUsage` es público y sin autenticación. El limiter de `validate-promo` falla abierto.

**Historia de usuario**
Como **dueño de la tienda** quiero que los códigos promocionales respeten sus límites para que **no se usen más veces de las permitidas ni se apilen descuentos sin control**.

**Criterios de aceptación**
- [ ] Un único validador compartido por el checkout y la API.
- [ ] El límite por usuario se comprueba dentro de la transacción con inserción condicional o restricción única.
- [ ] Regla de apilado documentada y aplicada con un tope combinado.
- [ ] `recordPromoCodeUsage` deja de ser invocable desde fuera (ver AZ-013).

**Pruebas necesarias**
- **Integración:** dos `createOrder` simultáneos con un código de un solo uso → solo uno lo consume.
- **Unit:** combinaciones promo + banner respetan el tope.

---

### AZ-029 · Limitar lo que puede hacer un vendedor

- **Prioridad:** P2 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* `updateOrderToPaidCOD` permite a un vendedor marcar cualquier orden como pagada; puede editar o borrar cualquier producto; `createPosOrder` toma `priceUsed`, `name` y `paymentMethod` del cliente y calcula su comisión sobre eso; `customerId` puede apuntar a cualquier usuario.

**Historia de usuario**
Como **dueño de la tienda** quiero que cada vendedor opere solo dentro de su alcance para que **no pueda inflar comisiones ni alterar ventas ajenas**.

**Criterios de aceptación**
- [ ] Matriz de permisos documentada por rol y aplicada en acciones y en `proxy.ts`.
- [ ] Un vendedor solo modifica productos propios y sus propias ventas POS.
- [ ] Marcar una orden como pagada exige la evidencia correspondiente al método.
- [ ] La comisión se calcula con precios resueltos en el servidor (AZ-001).

**Pruebas necesarias**
- **Unit:** matriz acción × rol completa.
- **Integración:** un vendedor intenta editar el producto de otro → rechazado.

**Dependencias:** AZ-001, AZ-007.

---

### AZ-030 · Integridad referencial: no borrar historial financiero

- **Prioridad:** P2 · **Tipo:** Datos · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado.* [prisma/schema.prisma](../prisma/schema.prisma): `OrderItem.product`, `Order.user` y `PromoCodeUsage` usan `onDelete: Cascade`; `deleteProduct`, `deleteUser` y `deleteOrder` son borrados duros que eliminan órdenes pagadas sin restituir stock.

**Historia de usuario**
Como **contador o dueño** quiero conservar el historial de ventas para que **borrar un producto o usuario no destruya registros financieros**.

**Criterios de aceptación**
- [ ] Las relaciones críticas pasan a `Restrict` o `SetNull`, con migración probada.
- [ ] Productos y usuarios se desactivan (soft delete) en lugar de borrarse.
- [ ] Borrar una orden pagada queda prohibido o requiere un flujo de anulación auditado.

**Pruebas necesarias**
- **Integración:** borrar un producto con ventas → error o desactivación; las órdenes siguen intactas.
- **Manual:** migración sobre una copia de producción.

---

### AZ-031 · Cabeceras de seguridad, CSP y cookies consistentes

- **Prioridad:** P2 · **Tipo:** Seguridad · **Est.:** M · **Sprint:** 4
- **Evidencia:** *Reportado por dos revisores.* [next.config.ts](../next.config.ts): sin CSP ni `poweredByHeader: false`; `X-XSS-Protection` obsoleta. La cookie `sessionCartId` en `auth.config.ts:49` no tiene `httpOnly`/`secure`/`maxAge`, a diferencia de `cart.actions.ts:44`. Cron: secreto aceptado por query string y comparado sin tiempo constante en `release-expired-orders` (`detect-abandoned-carts` ya usa `timingSafeEqual`).

**Historia de usuario**
Como **responsable de seguridad** quiero cabeceras y cookies estrictas para que **un XSS o una mala configuración tengan menor impacto**.

**Criterios de aceptación**
- [ ] CSP definida (con nonces) y validada en navegador sin romper la app.
- [ ] `poweredByHeader: false`; se retira `X-XSS-Protection`.
- [ ] Una sola definición de la cookie `sessionCartId` con atributos seguros.
- [ ] Los crons leen el secreto solo de la cabecera y lo comparan con `timingSafeEqual`; ambos soportan el método que usa el planificador real.

**Pruebas necesarias**
- **Unit:** helper de comparación segura de secretos.
- **E2E:** las páginas principales cargan sin violaciones de CSP en consola.
- **Manual:** revisar las cabeceras con un escáner de cabeceras.

---

### AZ-032 · Crash del callback `session` al actualizar el perfil

- **Prioridad:** P2 · **Tipo:** Bug · **Est.:** S · **Sprint:** 4
- **Evidencia:** *Reportado por dos revisores (sin verificar por ejecución).* [auth.ts:64-66](../auth.ts#L64-L66) lee `user.name` dentro del callback `session`, donde `user` es `undefined` con estrategia JWT. `profile-form.tsx:131` llama a `update(newSession)`.

**Historia de usuario**
Como **cliente** quiero editar mi perfil sin errores para que **mi nombre se actualice en toda la sesión**.

**Criterios de aceptación**
- [ ] Se reproduce el fallo con un test; si es real, se elimina la rama defectuosa (el callback `jwt` ya la maneja).
- [ ] Se elimina la rama legada `NO_NAME` y el `token.id` sin uso si siguen sin usarse.

**Pruebas necesarias**
- **Unit:** callback `session` con `trigger: 'update'` no lanza.
- **E2E:** cambiar el nombre en el perfil se refleja en el header.

---

### AZ-033 · Trabajo en segundo plano que se pierde en serverless y N+1 de notificaciones

- **Prioridad:** P2 · **Tipo:** Bug / Rendimiento · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* En `order.actions.ts` (≈ líneas 314-361, 577-582, 932-943, 979-990, 1060-1071) los correos se disparan sin `await`; en serverless pueden cortarse al responder. Las notificaciones a vendedores hacen consultas por ítem y están duplicadas entre `createOrder` y `createPosOrder`. En el POS, si una notificación lanza error tras el commit, la UI muestra fallo de una venta que existe y un reintento la duplica. `detect-abandoned-carts` hace una consulta por carrito, envía en serie y no tiene límite de antigüedad.

**Historia de usuario**
Como **cliente** quiero recibir mis correos de forma confiable para que **no dependan de cuánto tarda el servidor en responder**.

**Criterios de aceptación**
- [ ] El trabajo diferido usa `after()` o `waitUntil` y sus errores no afectan la respuesta.
- [ ] Un único helper de notificaciones con consultas en lote.
- [ ] En el POS, un fallo de notificación no se reporta como fallo de la venta.
- [ ] El cron de carritos abandonados tiene antigüedad máxima, consultas en lote y envío con límite de concurrencia.

**Pruebas necesarias**
- **Unit:** un fallo del envío no cambia el resultado de `createOrder` ni `createPosOrder`.
- **Integración:** el cron procesa N carritos con un número constante de consultas.

---

### AZ-034 · Caché, orden por precio y KPIs del dashboard

- **Prioridad:** P2 · **Tipo:** Bug · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* `getAllCategories` captura el error dentro de `unstable_cache` y cachea `{success:false}` por 1 h; no existe `revalidateTag` para los tags `products` y `categories`. [product.actions.ts:181-192](../lib/actions/product.actions.ts#L181-L192) ordena por precio en memoria después de paginar. `getOrderSummary` mezcla órdenes pagadas y no pagadas (`totalSales`/`salesData` vs `salesByMethod`) y hace ≈ 9 consultas secuenciales. `updateProduct` borra y recrea variantes (pérdida de stock en ventas concurrentes) y descarta variantes con stock 0. `stock` acepta negativos y decimales. `createUpdateReview` no tiene unicidad `(userId, productId)` y `isVerifiedPurchase` es `true` por defecto.

**Historia de usuario**
Como **administrador** quiero datos de caché y métricas correctos para que **vea el stock y las ventas reales**.

**Criterios de aceptación**
- [ ] Los errores no se cachean y se invalida con `revalidateTag` al mutar productos y categorías.
- [ ] El orden por precio se aplica en la base antes de paginar.
- [ ] KPIs del dashboard con un criterio único (solo pagadas) y consultas en paralelo.
- [ ] `updateProduct` hace upsert de variantes por clave en lugar de borrar y recrear; `stock` es entero ≥ 0.
- [ ] Reseñas: unicidad por usuario y producto; `isVerifiedPurchase` se calcula, no por defecto.

**Pruebas necesarias**
- **Unit:** orden `lowest`/`highest` correcto entre páginas.
- **Integración:** editar un producto durante una venta no pierde el descuento de stock.
- **Unit:** una falla en `getAllCategories` no queda cacheada.

---

### AZ-035 · Reparar tests vacíos y cubrir rutas críticas

- **Prioridad:** P2 · **Tipo:** Tests · **Est.:** L · **Sprint:** 4–5
- **Evidencia:** *Reportado.* [update-order-to-paid.test.ts:120,130,150](../__tests__/actions/update-order-to-paid.test.ts#L120) afirman que `$executeRaw` no se llamó, pero el código usa `$executeRawUnsafe`: pasan siempre. Los tests del webhook solo comprueban HTTP 200 con `Payment.get` indefinido. Los tests del cron devuelven `[]` y solo cubren el secreto; todos los casos usan talle `M`. El mock de `@/email` en `jest.integration.setup*.ts:35` apunta al directorio equivocado. Sin cobertura para `createOrder`, carrito, `createMercadoPagoOrder`, `updateOrderReceipt`, race del POS, idempotencia de rechazo, `send-email` ni el rate limiter. No se encontró CI.

**Historia de usuario**
Como **equipo de desarrollo** quiero tests que fallen cuando el comportamiento está roto para que **podamos refactorizar con confianza**.

**Criterios de aceptación**
- [ ] Las aserciones vacías se corrigen (mutación manual del código comprueba que el test falla).
- [ ] Tests de webhook para pago aprobado, monto distinto y orden inexistente.
- [ ] Tests del cron con datos reales, con color, talle y ambos.
- [ ] Cobertura de las rutas críticas listadas (se acompaña cada ticket P0/P1 con sus tests, este ticket cubre lo restante).
- [ ] Mock de email corregido y tests de integración aislados.
- [ ] Pipeline de CI que corre typecheck, lint, unit e integración en cada PR.

**Pruebas necesarias**
- **Meta:** verificación por mutación en las rutas de pago y stock (cambiar una condición y confirmar que algún test falla).
- **CI:** el pipeline falla ante un test roto.

---

### AZ-036 · Tooling y dependencias: lint, tipos, auditoría y versiones

- **Prioridad:** P2 · **Tipo:** Mantenimiento · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* `"lint": "next lint"` no existe en Next 16 (instalado 16.2.x). `eslint-config-next` está en 15.0.3 y `.eslintrc.json` es formato legado. `@types/react` y `@types/react-dom` en `^18` con React 19. `next-auth` es una beta con rango `^`. `prisma` y `@prisma/client` fijados en 6.5.0. `@prisma/client` figura en `devDependencies` pese a usarse en runtime. El script `email` copia `.env` dentro de `node_modules`. `nixpacks.toml` instala Bun sin fijar versión y sin añadir `~/.bun/bin` al `PATH` (sin verificar).

**Historia de usuario**
Como **desarrollador** quiero un tooling coherente para que **lint, tipos y despliegue funcionen y las dependencias estén auditadas**.

**Criterios de aceptación**
- [ ] `lint` ejecuta ESLint directamente con configuración flat y `eslint-config-next@16`.
- [ ] `@types/react*` alineados con React 19.
- [ ] `next-auth` fijado a una versión exacta; `bun audit` sin vulnerabilidades altas o con excepciones documentadas.
- [ ] `@prisma/client` en `dependencies`; evaluar la actualización de Prisma.
- [ ] El script `email` ya no copia secretos a `node_modules`.
- [ ] `nixpacks.toml` fija la versión de Bun a `packageManager` y verifica el `PATH`.

**Pruebas necesarias**
- **CI:** `bun run lint`, typecheck y build en verde.
- **Manual:** despliegue de prueba con nixpacks.

---

### AZ-037 · ISR configurado pero inefectivo

- **Prioridad:** P2 · **Tipo:** Rendimiento · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* [app/(cinematic)/product/[slug]/page.tsx:12-27](../app/(cinematic)/product/[slug]/page.tsx#L12-L27) define `revalidate = 3600` y `generateStaticParams`, pero `Header` → `Menu` llama a `getMyCart()` (usa `cookies()`) y `auth()`, y la página también llama a `getMyCart()`; la ruta es dinámica y se consulta la base en cada request. `footer-dark.tsx` llama a `auth()` solo para mostrar dos links.

**Historia de usuario**
Como **cliente** quiero páginas de producto rápidas para que **cargue más rápido y la base de datos no se sature**.

**Criterios de aceptación**
- [ ] Decisión documentada: página estática con islas dinámicas (carrito y sesión en componentes cliente o `Suspense`) o dinámica pura sin `revalidate` ni `generateStaticParams`.
- [ ] Si se elige estática, el build confirma la ruta como `●` (SSG/ISR).
- [ ] El footer no depende de `auth()` en el servidor.

**Pruebas necesarias**
- **Manual:** salida de `next build` muestra el tipo de ruta esperado.
- **E2E:** el carrito y la sesión siguen funcionando en la página de producto.

---

### AZ-038 · Modo oscuro expuesto pero sin soporte

- **Prioridad:** P2 · **Tipo:** UX · **Est.:** S · **Sprint:** 5
- **Evidencia:** *Reportado.* `ThemeToggle` aparece en el menú móvil, pero solo hay 11 clases `dark:` en toda la UI; el resto usa `bg-white`, `text-nike-ink` y hex fijos.

**Historia de usuario**
Como **cliente** quiero que lo que veo funcione para que **activar el modo oscuro no deje la página ilegible**.

**Criterios de aceptación**
- [ ] Decisión de producto: ocultar el toggle y quitar el `ThemeProvider` hasta tener diseño, o implementar el modo oscuro completo.
- [ ] Se eliminan imports y código comentado relacionados (`ThemeToggle` en `menu.tsx`).

**Pruebas necesarias**
- **Manual/E2E:** no existe forma de activar un estado ilegible.

---

### AZ-039 · Accesibilidad y HTML inválido

- **Prioridad:** P2 · **Tipo:** UX / A11y · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* `<Link><Button/></Link>` (un `a` envolviendo un `button`) en `search/page.tsx` (285-294, 322-327, 370-374) y `place-order-content.tsx` (93-102, 142-151). Botones de solo ícono sin `aria-label` (`product-form.tsx`, `user-button.tsx`, `image-upload-field.tsx`, miniaturas). `<label>` sin `htmlFor`. Modales del POS hechos con `div` `fixed inset-0`, sin `role="dialog"`, foco atrapado ni Escape. `SheetTitle` ausente en el sidebar móvil. Navegación del sidebar con `button` + `router.push` (sin prefetch ni `aria-current`) y `isActive` con `includes`. Varios `<h1>` por página en carruseles autoplay sin pausa. Alt de imágenes en inglés fijo. Inputs `type="text"` para email.

**Historia de usuario**
Como **persona que usa teclado o lector de pantalla** quiero poder usar la tienda para que **pueda comprar sin barreras**.

**Criterios de aceptación**
- [ ] `Button asChild` con `Link` en lugar de anidar elementos interactivos.
- [ ] Todo botón de ícono con `aria-label` y todo campo con etiqueta asociada.
- [ ] Los modales del POS usan `components/ui/dialog`.
- [ ] El sidebar usa `Link` con `aria-current`; `isActive` compara correctamente rutas.
- [ ] Un solo `<h1>` por página y controles de pausa en carruseles autoplay.
- [ ] Textos alternativos en español y `type="email"` en campos de correo.

**Pruebas necesarias**
- **Automatizada:** auditoría con axe (Playwright) en home, producto, carrito, checkout y admin sin violaciones graves.
- **Manual:** recorrido solo con teclado del checkout.

---

### AZ-040 · POS: mutación de estado, stock sin color y modales

- **Prioridad:** P2 · **Tipo:** Bug · **Est.:** M · **Sprint:** 5
- **Evidencia:** *Reportado.* [app/admin/pos/pos-form.tsx](../app/admin/pos/pos-form.tsx) (985 líneas): `updatedCart[i].qty += 1` muta estado (L196, 251); `address: any` (L56); `console.error` (L123); la búsqueda de stock por talle ignora el color (L232, `PosVariant` no tiene campo color, inferido); placeholder `/placeholder.png` inexistente (L214, 438). `hooks/use-media-query.ts`: `useIsMobile()` devuelve `true` en el primer render y provoca un salto de layout en escritorio.

**Historia de usuario**
Como **vendedor** quiero que el POS muestre el stock correcto para que **no venda variantes que no tengo**.

**Criterios de aceptación**
- [ ] Actualizaciones inmutables del carrito del POS.
- [ ] La variante se identifica por talle + color y el stock mostrado es el correcto.
- [ ] Tipos propios en lugar de `any`; sin `console.error` en cliente.
- [ ] Placeholder existente en `public/` o render condicional.
- [ ] `useIsMobile` usa CSS/breakpoints o un estado inicial coherente, sin salto de layout.

**Pruebas necesarias**
- **Unit (componente):** agregar dos veces el mismo ítem no muta el estado previo.
- **Unit:** producto con colores muestra el stock de la variante elegida.
- **E2E:** venta POS de un producto con color y talle.

---

# 🟢 P3 — Deuda técnica (Kanban continuo)

> Regla: un ticket P3 por semana como máximo, siempre sin cambiar comportamiento. Antes de borrar algo, confirmar con `rg` que no tiene importadores (incluyendo imports dinámicos y rutas de Next).

---

### AZ-041 · Eliminar componentes muertos de la UI

- **Prioridad:** P3 · **Est.:** S
- **Evidencia:** *Reportado, sin importadores según búsqueda de texto:* `components/deal-countdown.tsx`, `deal-countdown-dark.tsx`, `icon-boxes.tsx`, `icon-boxes-dark.tsx`, `view-all-products-button.tsx`, `shared/header/mode-toggle.tsx`, `notifications-bell.tsx`, `category-drawer.tsx`, `shared/navigation/main-nav.tsx`, `shared/product/product-carousel.tsx`, `product-list.tsx`, `ui/sidebar.tsx` (458 líneas), `ui/drawer.tsx`, `app/(cinematic)/product/[slug]/review-list.tsx` y `review-form.tsx`, exports `SidebarGroup`/`SidebarFooter`.
- **Historia:** Como desarrollador quiero un árbol de componentes sin código muerto para entender qué se usa realmente.
- **Criterios de aceptación**
  - [ ] Cada archivo se confirma sin importadores y se elimina.
  - [ ] Decisión de producto sobre reseñas: reactivarlas en la página de producto o eliminar `review-*` y `getReviews`.
  - [ ] `bun run build`, typecheck y tests en verde.
- **Pruebas:** build y typecheck sin errores; E2E de navegación principal sin cambios.

---

### AZ-042 · Dependencias sin uso o mal ubicadas

- **Prioridad:** P3 · **Est.:** S
- **Evidencia:** *Reportado:* sin importadores `@auth/core`, `@auth/prisma-adapter`, `@radix-ui/react-separator`, `@radix-ui/react-tooltip`; `vaul` solo lo usa código muerto; `react-email` (CLI) está en `dependencies`; `dotenv` se importa en `email/index.tsx`.
- **Historia:** Como desarrollador quiero un `package.json` honesto para reducir superficie de ataque y tiempo de instalación.
- **Criterios de aceptación**
  - [ ] Cada paquete se verifica con `rg` y herramienta de detección (por ejemplo `knip`) antes de quitarlo.
  - [ ] Los que corresponden pasan a `devDependencies`.
  - [ ] `bun.lock` actualizado; build y tests en verde.
- **Pruebas:** build, typecheck y suite completa.

---

### AZ-043 · Archivos que no deberían estar versionados

- **Prioridad:** P3 · **Est.:** S
- **Evidencia:** *Reportado (verificado en `.git/index` por el revisor):* `app/favicon.ico.bak` y `tests/e2e/.auth/admin.json` (estado de Playwright con cookies). `.gitignore` no cubre `.auth`, `playwright-report` ni `test-results`, y `.env*` oculta `.env.example`.
- **Historia:** Como equipo queremos que el repositorio no contenga sesiones ni basura para evitar fugas accidentales.
- **Criterios de aceptación**
  - [ ] `git rm` de ambos archivos.
  - [ ] `.gitignore` actualizado (`tests/e2e/.auth/`, `playwright-report/`, `test-results/`, `!.env.example`).
  - [ ] `.env.example` versionado con todas las variables requeridas y sin valores reales.
  - [ ] Se revisó que el historial de git no contenga secretos reales; si los hay, se rotan.
  - [ ] Decisión sobre versionar o ignorar `.claude/`.
- **Pruebas:** `git status` limpio tras correr la suite E2E.

---

### AZ-044 · Eliminar código muerto en `lib/`, `db/` y CSS

- **Prioridad:** P3 · **Est.:** M
- **Evidencia:** *Reportado:* funciones sin uso (`resolvePriceUsed` si no se adopta en AZ-001, `suggestMpPrice`, `getPriceMapForProduct`, `getPromoBannerWithProductsPublic`, `getAllSubCategories`, `getSubCategoriesByCategoryId`, `requireSeller`/`assertSeller`); constantes y esquemas sin uso (`signInDefaultValues`, `shippingAddressDefaultValues`, `PAYMENT_METHOD_LABELS`, `insertOrderItemSchema`); `SENDER_EMAIL` duplicado; `lib/data/countries.json`; `db/seed.ts` duplicado; `setting.actions.ts` vs `settings.actions.ts`; comentarios de `schema.prisma:289-292`; CSS legado en `globals.css` (utilidades `.font-ss03`, `.display-*`, `.az-*` sin uso, reglas `body` duplicadas, `.font-display` que pisa la familia de Tailwind); fuente `Bebas_Neue` cargada y sin uso; clases indefinidas (`az-body-lg-bold`, `hover:text-az-primary-hover`, `w-22`); `email/*.tsx` y `db/sample-data.ts` divergidos de `lib/email-templates.ts`.
- **Historia:** Como desarrollador quiero eliminar lo que no se usa para reducir ruido y descarga innecesaria.
- **Criterios de aceptación**
  - [ ] Cada elemento confirmado sin referencias antes de borrarlo.
  - [ ] Decisión sobre las plantillas de `email/` (eliminar o convertirlas en la fuente única de AZ-016).
  - [ ] Las clases indefinidas se definen o se reemplazan.
  - [ ] Build, typecheck y tests en verde.
- **Pruebas:** build, typecheck, suite completa; revisión visual de páginas con clases afectadas.

---

### AZ-045 · Consolidar componentes y lógica duplicados

- **Prioridad:** P3 · **Est.:** L
- **Evidencia:** *Reportado:* `product-card.tsx` vs `product-card-dark.tsx` (≈ 90 % idénticos); `footer.tsx` vs `footer-dark.tsx`; `file-upload-field.tsx` vs `admin/image-upload-field.tsx`; `shared/delete-dialog.tsx` vs `admin/promo-code-delete-button.tsx`; la clase de estilo del input copiada en ≈ 20 lugares; lógica de provincia/ciudad duplicada en `profile-form.tsx` y `shipping-address-form.tsx` (con `argentina.json` en tres bundles cliente); `TableHead` repetido; validación de promo duplicada; lookup de variantes repetido ≈ 6 veces; predicado de agregar al carrito repetido 3 veces; creación y edición de variantes de producto duplicadas.
- **Historia:** Como desarrollador quiero una única implementación de cada patrón para corregir una vez y no N veces.
- **Criterios de aceptación**
  - [ ] Un componente `ProductCard` con prop `variant`.
  - [ ] Un uploader y un diálogo de confirmación reutilizables.
  - [ ] Variante de `Input` o constante compartida para el estilo.
  - [ ] Un componente `ProvinceCityField` y datos cargados bajo demanda.
  - [ ] Los helpers de servidor (`findVariant`, validador de promo) provienen de AZ-009 y AZ-028.
- **Pruebas:** tests de componentes existentes pasan; snapshots visuales de las pantallas afectadas sin cambios.

---

### AZ-046 · Unificar el design system (tokens)

- **Prioridad:** P3 · **Est.:** L
- **Evidencia:** *Reportado:* conviven `nike-*` y `az-*` más hex fijos (`text-[#111111]` aparece 238 veces en 37 archivos); `tailwind.config.ts` define familias `marder-*` y `nike-*`; `lib/email-templates.ts` menciona "Marder Hombres".
- **Historia:** Como diseñador y desarrollador quiero un único sistema de tokens para que la marca sea coherente y cambiarla sea barato.
- **Criterios de aceptación**
  - [ ] Decisión documentada del sistema vigente (`nike-*` o `az-*`) en `docs/DESIGN.md`.
  - [ ] Los hex repetidos se reemplazan por tokens.
  - [ ] Restos de la marca anterior eliminados de código y correos.
  - [ ] Revisión visual sin regresiones.
- **Pruebas:** comparación visual (capturas Playwright) de home, producto, carrito, checkout y admin antes y después.

---

### AZ-047 · Dividir archivos gigantes y extraer helpers

- **Prioridad:** P3 · **Est.:** L
- **Evidencia:** *Reportado:* `order.actions.ts` 1470 líneas (`createOrder` ≈ 340 y `createPosOrder` ≈ 245 líneas, imports a mitad de archivo, 11 `as any`); `product-form.tsx` 1084 líneas (muchos `form.watch()` y `any`); `pos-form.tsx` 985 líneas.
- **Historia:** Como desarrollador quiero módulos acotados para poder revisarlos y probarlos.
- **Criterios de aceptación**
  - [ ] `order.actions.ts` se divide por responsabilidad (creación, pago, envío, administración, POS) sin cambiar la API pública.
  - [ ] `product-form` y `pos-form` se parten en subcomponentes y hooks; los `watch` se acotan.
  - [ ] `as any` eliminados o justificados.
  - [ ] Cada extracción ocurre con los tests de AZ-035 en verde.
- **Pruebas:** la suite completa antes y después; sin cambios de comportamiento.

**Dependencias:** AZ-035 (red de seguridad), AZ-008, AZ-009.

---

### AZ-048 · Detalles de UX, SEO y assets faltantes

- **Prioridad:** P3 · **Est.:** M
- **Evidencia:** *Reportado:* un único `loading.tsx` global (pantalla completa) y sin esqueletos en `search`, `pos` ni `overview`; `/opengraph-image.png` referenciado pero solo existe `app/opengraph-image.tsx`; metadatos de la home duplican los del layout; `app/not-found.tsx` con `'use client'` innecesario y tarjeta `w-1/3` que rompe en móvil; enlaces `<a href>` en vez de `Link` en recuperación de contraseña; botón de eliminar imagen con `opacity-0` hasta hover (inaccesible en táctil); en el upload, un error en la primera subida descarta las ya subidas; rangos de precio y textos de métodos de envío fijos en código; la mezcla de formatos de precio (`toFixed`, `Intl.NumberFormat`, `formatCurrency`, `ProductPrice`) y `formatCurrency` con USD / `en-US` aunque los precios son ARS; el precio de MercadoPago (más alto) se muestra tachado como si fuera un descuento (`dual-price.tsx:37`, `product-action.tsx:214`); la clave de fila en `place-order-content.tsx:185` omite `productColorId`; `formattedPrice` sin uso en `product-gallery-and-actions.tsx`.
- **Historia:** Como cliente quiero una experiencia coherente en estados de carga, errores y precios.
- **Criterios de aceptación**
  - [ ] `loading.tsx` y esqueletos por segmento.
  - [ ] Imagen OG correcta y metadatos sin duplicar.
  - [ ] Una única función de formato de moneda ARS y presentación clara del precio por método de pago (sin tachado engañoso).
  - [ ] Claves de lista correctas y código sin uso eliminado.
  - [ ] Los uploaders conservan los archivos ya subidos ante un error parcial.
- **Pruebas:** E2E de carga de las páginas principales; pruebas unitarias de la función de formato; verificación visual en móvil.

---

## 7. Ampliación — segunda revisión exhaustiva (AZ-049 en adelante)

> **Origen:** revisión por lente de 260 archivos con diez revisores: UX (UXA/UXB/UXC), frontend (FEA/FEB/FEC), Next.js (NXT), fullstack de backend (FSB), fullstack de tests y tooling (FST) y arquitectura (ARC). Aportó unos 280 hallazgos nuevos, que aquí se consolidan **por causa raíz**, no uno por hallazgo.
> **Convención:** los IDs entre paréntesis (por ejemplo FSB-1) remiten a hallazgos de esos reportes. Los datos esenciales (archivo y línea) están dentro de cada ticket. ✔ = verificado manualmente en el código; *Build* = confirmado con artefactos de `.next/`; *Reportado* = lectura estática, **reproducir primero**.
> **Alcance:** esta sección **no modifica** AZ-001 a AZ-048. Los ajustes a esos tickets están en 7.1.

### 7.1 Ajustes a tickets existentes (sin editarlos)

| Ticket | Ajuste |
|--------|--------|
| AZ-003 | Su criterio "un talle en uso no puede borrarse" es **falso en la base real** hasta resolver AZ-049 (FK en cascada). |
| AZ-007 | ✔ `middleware.ts` se borró **a propósito** en el commit `acf26f2` ("remove auth middleware"). El README menciona el límite de tamaño del Edge en Vercel; verificar si el `proxy.ts` de Next 16 (runtime Node) evita ese problema antes de restaurarlo. |
| AZ-013 | Además de las acciones listadas, `mergeCart` y `getSetting` son exportaciones públicas (ver AZ-053 y AZ-058). La explotabilidad depende de que el ID de la acción llegue al bundle del cliente (sin verificar). |
| AZ-024 | Los guards (`requireAdmin*`) redirigen a `/unauthorized` y no a `/sign-in?callbackUrl=`. Añadir un `requireUser()` (NXT-8). |
| AZ-033 | Su premisa ("serverless") contradice `nixpacks.toml` (Coolify, `next start`). **Depende de AZ-050.** |
| AZ-034 | *Build:* `rg revalidateTag` no encuentra llamadas. En Next 16 `revalidateTag` toma dos argumentos y las Server Actions deben usar `updateTag` (NXT-12). |
| AZ-037 | *Build:* `dynamicRoutes: []` y la home y el PDP no se prerenderizan. **Toda la tienda es dinámica**, no solo el PDP. |
| AZ-043 | NXT discrepa: `.example-env` **sí** está versionado (el patrón `.env*` no lo captura). *Reportado:* verificar. |
| AZ-047 | ARC recomienda hacerlo **después** de AZ-035 (tests de caracterización) y **antes** de AZ-008/009/015, para no repetir cada corrección en seis sitios. Decisión del equipo. |

### 7.2 Resumen priorizado de la ampliación

| ID | Prioridad | Título | Tipo | Est. |
|----|-----------|--------|------|------|
| AZ-049 | P0 | FK `ProductVariant.sizeId` en cascada: borrar un talle o categoría elimina stock | Datos / Seguridad | M |
| AZ-050 | P1 | ADR-001: decidir el destino de despliegue | Decisión | S |
| AZ-051 | P1 | `updateProduct` regenera ids de color y huérfana carritos y órdenes | Bug / Negocio | L |
| AZ-052 | P1 | Modelo de estado de la orden y registro de pagos | Datos / Negocio | L |
| AZ-053 | P1 | `mergeCart` público y stock sin talle | Seguridad / Bug | M |
| AZ-054 | P1 | Guards de entorno para scripts, seeds y E2E | Seguridad | M |
| AZ-055 | P1 | Configuración de entorno validada y URL base en runtime | Bug / Operación | M |
| AZ-056 | P1 | Retorno de MercadoPago ignora el estado y la preferencia no expira | Bug / Negocio | M |
| AZ-057 | P1 | Recuperación de contraseña inutilizable en la app construida | Bug | S |
| AZ-058 | P1 | Datos sensibles viajan al cliente en props RSC | Seguridad | S |
| AZ-059 | P1 | POS: usuario "consumidor final" y asociación por email sin verificar | Seguridad / Datos | M |
| AZ-060 | P1 | La comisión del vendedor se redondea y se sobrescribe al guardar | Bug / Negocio | S |
| AZ-061 | P1 | Un admin puede eliminarse a sí mismo o al último admin | Bug / Seguridad | S |
| AZ-062 | P1 | Un umbral de stock vacío tumba el dashboard | Bug | S |
| AZ-063 | P1 | Menú móvil no se cierra y fallas críticas de accesibilidad en primitivos | Bug / A11y | S |
| AZ-064 | P1 | Uploader compartido pierde actualizaciones y puede romper | Bug | M |
| AZ-065 | P1 | Checkout: envío contradictorio, login sin retorno y datos de transferencia | UX / Negocio | M |
| AZ-066 | P1 | Fechas de promociones se desplazan 3 h en cada guardado | Bug / Negocio | M |
| AZ-067 | P2 | Endurecer el schema: índices, FKs, únicos y CHECKs | Datos | M |
| AZ-068 | P2 | Validador de moneda y aritmética monetaria | Bug / Negocio | S |
| AZ-069 | P2 | Crons de carritos abandonados y de expiración resilientes | Bug / Operación | M |
| AZ-070 | P2 | Capa única de envío de emails | Bug / Operación | M |
| AZ-071 | P2 | Estrategia de renderizado y caché de Next 16 | Rendimiento | L |
| AZ-072 | P2 | Frontera `server-only` y dirección de dependencias | Arquitectura | M |
| AZ-073 | P2 | SEO: sitemap, robots, canonical y Open Graph | SEO | S |
| AZ-074 | P2 | Formato único de moneda y fechas es-AR | UX / Bug | M |
| AZ-075 | P2 | Datos de provincias y localidades incorrectos | Datos | S |
| AZ-076 | P2 | POS: tablet, errores de red, velocidad y accesibilidad | UX / Bug | L |
| AZ-077 | P2 | Admin: listas, filtros y acciones destructivas | UX | L |
| AZ-078 | P2 | Admin: formularios de configuración | Bug / UX | M |
| AZ-079 | P2 | Formularios de producto, categoría y marca | Bug / UX | M |
| AZ-080 | P2 | Formularios de perfil y dirección | Bug / UX | M |
| AZ-081 | P2 | Formularios de autenticación | UX / A11y | M |
| AZ-082 | P2 | Tienda móvil: búsqueda, carrito y orden | UX | L |
| AZ-083 | P2 | Confianza y contenido legal de la tienda | UX / Legal | M |
| AZ-084 | P2 | Accesibilidad de primitivos y movimiento | A11y | L |
| AZ-085 | P2 | El descuento de banner depende de una cookie manipulable | Seguridad | S |
| AZ-086 | P2 | El borrado de assets puede eliminar imágenes aún referenciadas | Bug / Datos | S |
| AZ-087 | P2 | Reparar la suite de integración | Tests | L |
| AZ-088 | P2 | E2E que verifiquen comportamiento real | Tests | L |
| AZ-089 | P2 | CI y entorno de test reproducible | Tooling | M |
| AZ-090 | P3 | Primitivos del design system | Deuda | M |
| AZ-091 | P3 | Calidad de componentes de la tienda | Deuda | M |
| AZ-092 | P3 | Documentación desalineada con el código | Deuda | S |
| AZ-093 | P3 | Épica: migración arquitectónica incremental | Arquitectura | L |
| AZ-094 | P3 | ADRs restantes de arquitectura | Decisión | S |
| AZ-095 | P3 | Misceláneos de bajo riesgo | Deuda | M |

---

### 7.3 Tickets — 🔴 P0

---

#### AZ-049 · FK `ProductVariant.sizeId` en cascada: borrar un talle o categoría elimina stock

- **Prioridad:** P0 · **Tipo:** Datos / Seguridad · **Est.:** M
- **Evidencia:** ✔ [prisma/schema.prisma:125](../prisma/schema.prisma#L125) declara `onDelete: Restrict`, pero [la migración 20260523201002](../prisma/migrations/20260523201002_add_brands_and_variants/migration.sql#L123) crea `ProductVariant_sizeId_fkey` con `ON DELETE CASCADE`, y ninguna migración posterior la modifica. `Size_categoryId_fkey` también es `CASCADE` (línea 108). Cadena: `category.actions.ts:79-92` mueve los productos a la categoría por defecto y elimina la categoría, lo que arrastra los `Size` y, en cascada, **todas las `ProductVariant`** de esos productos. `deleteSize` ([size.actions.ts:29-31](../lib/actions/size.actions.ts#L29-L31)) hace lo mismo. Si producción se creó con `prisma db push` en vez de `migrate deploy`, el FK real podría ser `Restrict`: **confirmar contra la base viva** (`\d "ProductVariant"` o `pg_constraint`).

**Historia de usuario**
Como **dueño de la tienda** quiero que eliminar un talle o una categoría nunca borre el stock de productos existentes para **no perder inventario por una operación administrativa**.

**Criterios de aceptación**
- [ ] Se confirmó el `confdeltype` real de `ProductVariant_sizeId_fkey` y `Size_categoryId_fkey` en cada entorno.
- [ ] Una migración nueva recrea ambos FK como `RESTRICT` (o equivalente acordado) y se aplicó en todos los entornos.
- [ ] `deleteCategory` y `deleteSize` fallan con un mensaje claro si existen variantes asociadas.
- [ ] La CI ejecuta `prisma migrate diff --from-migrations --to-schema-datamodel --exit-code` y falla ante deriva (ver AZ-089).
- [ ] Mitigación inmediata hasta cerrar el ticket: AZ-003 aplicado y borrado de categorías deshabilitado desde la UI.

**Pruebas necesarias**
- **Integración (BD con migraciones reales):** crear categoría con talle y producto con variante; borrar el talle y la categoría → error y la variante sigue existiendo.
- **Unit:** `deleteCategory` con productos con variantes devuelve el mensaje de bloqueo.
- **CI:** el chequeo de deriva falla si se altera el schema sin migración.

**Dependencias:** AZ-003, AZ-089.

---

### 7.4 Tickets — 🟠 P1

---

#### AZ-050 · ADR-001: decidir el destino de despliegue

- **Prioridad:** P1 · **Tipo:** Decisión · **Est.:** S
- **Evidencia:** ✔ [nixpacks.toml](../nixpacks.toml) dice "Coolify deployments" y arranca con `bun run start` (nodo de larga vida). El README habla de Vercel y `docs/01-ARQUITECTURA.md` de Neon serverless. No hay `vercel.json`, Dockerfile ni CI. (ARC-6)

**Historia de usuario**
Como **equipo de desarrollo** quiero una decisión explícita del entorno de ejecución para **dimensionar correctamente trabajo en segundo plano, crons, conexiones a base de datos y migraciones**.

**Criterios de aceptación**
- [ ] ADR escrito en `docs/` con: destino (Coolify o Vercel o ambos), driver de BD (adaptador Neon o conexión directa), cómo corre el trabajo diferido, quién dispara los crons y cuándo se aplican las migraciones.
- [ ] Los tickets AZ-033, AZ-055, AZ-069 y AZ-070 se re-dimensionan según la decisión.
- [ ] `docs/01-ARQUITECTURA.md` y el README reflejan la decisión.

**Pruebas necesarias**
- **Manual:** revisión del ADR por el equipo; ningún documento contradice la decisión.

---

#### AZ-051 · `updateProduct` regenera ids de color y huérfana carritos y órdenes

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** L
- **Evidencia:** *Reportado (FSB-2, FSB-11).* [product.actions.ts:397-421](../lib/actions/product.actions.ts#L397-L421) borra y recrea todas las variantes y los `ProductColor` con uuids nuevos. `Cart.items` (JSON) y `OrderItem.productColorId` (columna sin FK) conservan los ids viejos. Consecuencias: `updateOrderToPaid` lanza "Variante no encontrada" ([order.actions.ts:521-525](../lib/actions/order.actions.ts#L521-L525)) y el webhook devuelve 500 con el cliente ya cobrado; `createOrder` omite en silencio el descuento de stock si no encuentra la variante. Además, la variante se identifica por **nombre** de talle (6 copias del lookup), de modo que renombrar un talle rompe la restitución y el descuento.

**Historia de usuario**
Como **administrador** quiero editar un producto sin romper pedidos y carritos en curso para **no dejar pagos aprobados sin poder cumplirse**.

**Criterios de aceptación**
- [ ] `updateProduct` hace *upsert* por clave estable (`productId + colorId` y `productId + sizeId + colorId`) en lugar de borrar y recrear.
- [ ] `OrderItem` guarda `variantId` (nullable al inicio, con relleno retroactivo) y todos los lookups usan un único helper `findVariant`.
- [ ] Editar un producto con una orden pendiente no impide que se pague ni que se restituya su stock.
- [ ] Una variante inexistente nunca se omite en silencio al crear una orden: falla con error.

**Pruebas necesarias**
- **Integración:** crear orden pendiente, editar el producto (cambiar nombre y stock) y pagar la orden → el stock se descuenta de la variante correcta.
- **Integración:** renombrar un talle y rechazar una transferencia → el stock vuelve a la variante correcta.
- **Unit:** `findVariant` resuelve las combinaciones con talle, con color y con ambos.

**Dependencias:** AZ-008, AZ-009.

---

#### AZ-052 · Modelo de estado de la orden y registro de pagos

- **Prioridad:** P1 · **Tipo:** Datos / Negocio · **Est.:** L
- **Evidencia:** *Reportado (FSB-4, FSB-6, FSB-12, ARC-3).* El estado vive en `isPaid`, `isDelivered`, el string `shippingStatus` y `paymentResult.status === 'CANCELLED'` dentro de un JSON ([order.actions.ts:1041-1048](../lib/actions/order.actions.ts#L1041-L1048), [release-expired-orders/route.ts:76-85](../app/api/cron/release-expired-orders/route.ts#L76-L85)). La UI nunca lee `CANCELLED` (recibe `Omit<Order,'paymentResult'>`), así que una orden cancelada sigue mostrando "Pagar" y los botones de aprobar. El webhook, ante un segundo pago aprobado, responde 200 sin registrarlo (cobro doble sin rastro) y no maneja reembolsos ni contracargos. `createMercadoPagoOrder` sobreescribe `paymentResult` y des-cancela la orden. `deliverOrder` y `updateShippingStatus` son fuentes de verdad independientes.

**Historia de usuario**
Como **dueño de la tienda** quiero un estado de orden explícito y un registro de pagos para **que cancelaciones, reembolsos y cobros duplicados sean visibles y no corrompan el stock**.

**Criterios de aceptación**
- [ ] `Order.status` (enum) y `cancelledAt` con índice; transiciones válidas en una función pura `canTransition()`.
- [ ] Tabla `Payment` (`orderId`, `mpPaymentId` único, `status`, `amount`, respuesta cruda) y `paymentResult` queda solo para datos del gateway.
- [ ] El webhook maneja `approved`, `refunded`, `charged_back` y `cancelled`, y alerta ante un pago duplicado o tardío.
- [ ] La UI muestra el estado real y oculta acciones no válidas; `shippingStatus` e `isDelivered` se derivan de una sola fuente.
- [ ] Migración con relleno retroactivo del estado a partir de los datos actuales.

**Pruebas necesarias**
- **Unit:** matriz de transiciones válidas e inválidas.
- **Integración:** pago duplicado → segundo `Payment` registrado y alerta, sin doble descuento de stock.
- **Integración:** orden cancelada → no se puede aprobar ni pagar.
- **Manual:** la migración sobre una copia de producción conserva los estados.

**Dependencias:** AZ-004, AZ-009, AZ-015, AZ-050.

---

#### AZ-053 · `mergeCart` público y stock sin talle

- **Prioridad:** P1 · **Tipo:** Seguridad / Bug · **Est.:** M
- **Evidencia:** *Reportado (NXT-5, FSB-3).* [cart.actions.ts:281](../lib/actions/cart.actions.ts#L281): `mergeCart(userId, sessionCartId)` es una Server Action exportada sin comprobar sesión; combinada con AZ-001 permite inyectar ítems con precios falsificados en el carrito de cualquier usuario cuyo id se conozca. Además `auth.ts` ↔ `cart.actions.ts` forman un import circular. En la lógica de stock, `maxStock` queda en 0 para ítems sin talle (líneas 73-89 y 319-339): con carrito existente, un ítem de solo color siempre falla con "No hay suficiente stock", y `mergeCart` fija su cantidad en 0; además elige la variante solo por talle e ignora el color.

**Historia de usuario**
Como **cliente** quiero que mi carrito solo lo modifique mi sesión y que los productos con color se cuenten bien para **no perder ni recibir ítems ajenos**.

**Criterios de aceptación**
- [ ] `mergeCart` se mueve a un módulo `server-only` invocado solo desde `auth.ts`; ya no es un endpoint.
- [ ] Se rompe el import circular `auth.ts` ↔ `cart.actions.ts`.
- [ ] Un helper `resolveStock(product, size, productColorId)` se usa en `addItemToCart`, `mergeCart` y `createOrder`.
- [ ] `qty` es estrictamente positivo; las líneas con cantidad 0 se descartan.

**Pruebas necesarias**
- **Unit:** llamada externa a `mergeCart` → no existe como acción pública.
- **Integración:** fusionar un carrito anónimo con ítems de solo color no los deja en 0.
- **Unit:** `qty: 0` rechazado.

**Dependencias:** AZ-001, AZ-072.

---

#### AZ-054 · Guards de entorno para scripts, seeds y E2E

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** M
- **Evidencia:** *Reportado (FSB-5, FST-1, FST-5).* [scripts/reset-qa-db.js](../scripts/reset-qa-db.js) lee `DATABASE_URL` de `.env.qa` y ejecuta `prisma migrate reset --force` (incluye seed) sin verificar el host. [scripts/migrate-production.js](../scripts/migrate-production.js) corre `migrate deploy` contra la `DATABASE_URL` ambiente sin confirmación. `package.json` define `dev:prod`, `db:seed:prod` y `db:migrate:prod`. El setup E2E (`tests/e2e/global.setup.ts`) usa el `.env` por defecto, crea `admin@example.com` con contraseña conocida y el teardown nunca lo borra. `jest.globalSetup.ts` puede resetear una base distinta de la que usan los workers.

**Historia de usuario**
Como **desarrollador** quiero que ninguna operación destructiva pueda apuntar a producción por accidente para **proteger los datos reales**.

**Criterios de aceptación**
- [ ] Una lista blanca de host/nombre de BD por entorno y un flag `--confirm=<dbname>` obligatorio en los scripts destructivos.
- [ ] Se eliminan `dev:prod` y `db:seed:prod` (o requieren `CONFIRM_PROD=1`).
- [ ] Un único helper `loadTestEnv()` con `override: true` que aborta si el nombre de la BD no contiene `test`, usado por Jest (setup y workers) y Playwright.
- [ ] El E2E genera credenciales aleatorias por corrida y elimina todos los usuarios que crea.

**Pruebas necesarias**
- **Unit:** el helper aborta con una URL de producción simulada.
- **Manual:** ejecutar `reset-qa-db.js` con `.env.qa` apuntando a otra base → aborta.

**Dependencias:** AZ-006, AZ-019.

---

#### AZ-055 · Configuración de entorno validada y URL base en runtime

- **Prioridad:** P1 · **Tipo:** Bug / Operación · **Est.:** M
- **Evidencia:** *Build (NXT-1)* y *Reportado (NXT-9, NXT-10, FSB-16, FSB-30).* `NEXT_PUBLIC_SERVER_URL` se incrusta en tiempo de build y se usa en el servidor: en el build local `robots.txt` y `sitemap.xml` contienen `http://localhost:3000`. Afecta `metadataBase`, las `back_urls` y `notification_url` de MercadoPago ([order.actions.ts:1117-1125](../lib/actions/order.actions.ts#L1117-L1125)), el link de reseteo y los emails. `.example-env` no incluye `INTERNAL_API_SECRET` (sin él todo email da 403), `MERCADOPAGO_WEBHOOK_SECRET` (sin él el webhook da 500), `AUTH_URL`/`AUTH_TRUST_HOST` ni `UPSTASH_*` (sin ellos el rate limit falla abierto). `new Resend(process.env.RESEND_API_KEY)` a nivel de módulo puede romper `next build` si falta la clave. El chequeo de `x-internal-secret` acepta secreto vacío y no es de tiempo constante.

**Historia de usuario**
Como **responsable de operaciones** quiero que la app falle al arrancar si falta configuración y que las URLs absolutas se resuelvan en runtime para **evitar enlaces y callbacks apuntando a `localhost`**.

**Criterios de aceptación**
- [ ] Un módulo `lib/config/env.ts` validado con zod que falla al arrancar (excepto en desarrollo) ante variables obligatorias ausentes.
- [ ] Una variable `APP_URL` no pública leída en runtime en todo código de servidor; `robots` y `sitemap` pasan a ser dinámicos o con `revalidate`.
- [ ] `.example-env` y la documentación listan todas las variables y marcan cuáles deben ser *Build Variable* en Coolify.
- [ ] `auth.ts` declara `trustHost` de forma explícita.
- [ ] Resend se instancia de forma perezosa; el secreto interno exige valor no vacío y usa `timingSafeEqual`.

**Pruebas necesarias**
- **Unit:** el módulo de env lanza con variables faltantes y acepta un conjunto completo.
- **Unit:** `send-email` con secreto vacío o ausente → 403.
- **Manual:** `next build` sin `RESEND_API_KEY` no falla; los links de un email de prueba usan el dominio configurado.

**Dependencias:** AZ-050.

---

#### AZ-056 · Retorno de MercadoPago ignora el estado y la preferencia no expira

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** M
- **Evidencia:** *Reportado (NXT-7, FSB-14).* [order.actions.ts:1117-1127](../lib/actions/order.actions.ts#L1117-L1127) apunta `success`, `failure` y `pending` a `/order/${id}` con `auto_return: 'approved'`, pero la página ni lee `?status=` ni hace polling: muestra "Pendiente de Pago" y el botón de pagar hasta que llega el webhook (riesgo de pago doble). La preferencia no define `expires`/`expiration_date_to`, por lo que el link sigue pagable después de la expiración local de 30 minutos y puede pagarse una orden ya cancelada por el cron.

**Historia de usuario**
Como **cliente** quiero ver "procesando pago" tras volver de MercadoPago para **no pagar dos veces**.

**Criterios de aceptación**
- [ ] La página de la orden interpreta `status` y `payment_id`, muestra "procesando pago" y refresca periódicamente mientras `!isPaid`.
- [ ] El botón de pagar se oculta cuando hay un pago en curso.
- [ ] La preferencia expira en el mismo instante que `order.expiresAt`.
- [ ] Un pago aprobado sobre una orden ya cancelada genera una alerta de revisión manual (ver AZ-052).

**Pruebas necesarias**
- **Unit (componente):** con `?status=pending` no se muestra el botón de pagar.
- **Unit:** la preferencia incluye la expiración correcta.
- **Manual (sandbox):** pago aprobado y vuelta a la tienda sin doble cobro posible.

**Dependencias:** AZ-004, AZ-052.

---

#### AZ-057 · Recuperación de contraseña inutilizable en la app construida

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S
- **Evidencia:** *Build (NXT-21) y tres revisores (FEB-1, UXB-01).* [reset-password/page.tsx:10-15](../app/(auth)/reset-password/page.tsx#L10-L15) tipa `searchParams` como objeto y lee `searchParams.token` de forma síncrona; en Next 16 es una `Promise`. Además `/reset-password` aparece prerenderizada en el build, así que el token siempre es `undefined` y el formulario siempre muestra "Link inválido". El resto de las páginas sí hacen `await props.searchParams`.

**Historia de usuario**
Como **cliente** quiero restablecer mi contraseña con el enlace del email para **recuperar el acceso a mi cuenta**.

**Criterios de aceptación**
- [ ] La página usa `props: { searchParams: Promise<{ token?: string }> }` y `await`.
- [ ] La ruta es dinámica (no prerenderizada).
- [ ] El token se verifica en el Server Component, sin `useEffect` ni "Verificando link…".
- [ ] El formulario se mantiene deshabilitado tras el éxito (evita reuso del token durante la redirección).

**Pruebas necesarias**
- **E2E:** solicitar el reseteo, abrir el link con token válido y cambiar la contraseña con éxito.
- **Unit:** token inválido o expirado → mensaje claro y sin formulario.

**Dependencias:** AZ-025.

---

#### AZ-058 · Datos sensibles viajan al cliente en props RSC

- **Prioridad:** P1 · **Tipo:** Seguridad · **Est.:** S
- **Evidencia:** *Reportado (NXT-14, UXC/FEC-28).* [admin/users/[id]/page.tsx:20,31](../app/admin/users/[id]/page.tsx#L20): `getUserById` no usa `select`, por lo que la fila completa del usuario, incluido el hash bcrypt, DNI y dirección, se serializa al navegador como prop de `UpdateUserForm`. `admin/settings/page.tsx:13,50` pasa el `accessToken` de MercadoPago a un formulario cliente. `order/[id]/page.tsx:30,40` envía siempre `bankInfo` (CBU/CUIT), aunque la orden sea de MercadoPago o esté pagada.

**Historia de usuario**
Como **responsable de seguridad** quiero que al navegador solo lleguen los campos necesarios para **que una inspección del HTML no revele credenciales ni datos bancarios**.

**Criterios de aceptación**
- [ ] Todas las consultas de usuario usan `select` explícito sin `password`.
- [ ] Se pasan a los componentes cliente DTOs mínimos, no filas de Prisma.
- [ ] El token de MercadoPago se muestra enmascarado y solo se envía si el campo cambió (ver AZ-012).
- [ ] `bankInfo` solo se envía cuando `paymentMethod === 'TransferenciaBancaria' && !isPaid`.

**Pruebas necesarias**
- **Unit:** las respuestas de acciones y páginas no contienen la clave `password`.
- **Manual:** el HTML y el payload RSC de `/admin/users/[id]` y `/admin/settings` no contienen hash ni token.

**Dependencias:** AZ-012, AZ-013.

---

#### AZ-059 · POS: usuario "consumidor final" y asociación por email sin verificar

- **Prioridad:** P1 · **Tipo:** Seguridad / Datos · **Est.:** M
- **Evidencia:** *Reportado (FSB-19).* [order.actions.ts:1204-1284](../lib/actions/order.actions.ts#L1204-L1284): el usuario compartido `consumidorfinal@local.store` acumula el teléfono y DNI del primer cliente y los copia a ventas posteriores. La venta se asocia a cualquier cuenta existente por email o DNI, pero el alta no verifica el email: una cuenta pre-registrada por un atacante recibe la orden de otra persona. Si ese usuario del sistema aún no existe, cualquiera puede registrarlo desde el alta pública. La actualización del usuario (L1268) ocurre fuera de la transacción.

**Historia de usuario**
Como **vendedor** quiero registrar ventas de mostrador sin mezclar datos personales de clientes distintos para **cumplir con la protección de datos y evitar que una cuenta ajena reciba pedidos**.

**Criterios de aceptación**
- [ ] El "consumidor final" es un usuario de sistema que no puede iniciar sesión (sin contraseña y con rol bloqueado), y no se puede registrar por el alta pública.
- [ ] La asociación automática por email o DNI exige que la cuenta tenga email verificado, o requiere elegir explícitamente al cliente.
- [ ] El teléfono y los datos de la venta se toman de la solicitud, no del usuario compartido.
- [ ] La actualización del usuario va dentro de la transacción.

**Pruebas necesarias**
- **Integración:** dos ventas anónimas consecutivas no comparten teléfono ni DNI.
- **Unit:** registrar el email reservado desde el alta pública → rechazado.
- **Integración:** una venta no se asocia a una cuenta con email sin verificar.

**Dependencias:** AZ-029.

---

#### AZ-060 · La comisión del vendedor se redondea y se sobrescribe al guardar

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** S
- **Evidencia:** *Reportado por dos revisores (FEC-4, UXC-2).* [commission-editor.tsx:24-26](../app/admin/overview/commission-editor.tsx#L24-L26) y [overview/page.tsx:264,299](../app/admin/overview/page.tsx#L264) muestran `Math.round(rate * 100)`, pero el campo permite `step=0.5` y la acción guarda `pct/100`. Un vendedor con 7,5 % se ve como 8 %; abrir el diálogo y guardar sin cambios escribe 8 %. Además, un valor `NaN` retorna sin mensaje y el botón del lápiz no tiene `aria-label`.

**Historia de usuario**
Como **administrador** quiero ver la comisión exacta de cada vendedor para **no alterar sus pagos sin darme cuenta**.

**Criterios de aceptación**
- [ ] La tabla, la tarjeta y el editor muestran el valor real (hasta 2 decimales).
- [ ] Guardar sin cambios no modifica el valor almacenado.
- [ ] Un valor inválido muestra un error claro; el botón tiene `aria-label` y el campo una etiqueta asociada.

**Pruebas necesarias**
- **Unit:** una tasa 0,075 se muestra como 7,5 y se guarda como 0,075.
- **Unit:** valor vacío o `NaN` → mensaje de error y sin llamada al servidor.

---

#### AZ-061 · Un admin puede eliminarse a sí mismo o al último admin

- **Prioridad:** P1 · **Tipo:** Bug / Seguridad · **Est.:** S
- **Evidencia:** *Reportado (UXC-1).* [admin/users/page.tsx:111](../app/admin/users/page.tsx#L111) muestra "Eliminar" en todas las filas, incluida la del administrador logueado. `deleteUser` ([user.actions.ts:239-256](../lib/actions/user.actions.ts#L239-L256)) no tiene guarda de auto-eliminación ni de último admin, mientras que el formulario de edición ya deshabilita el cambio de rol propio.

**Historia de usuario**
Como **dueño de la tienda** quiero que sea imposible quedarse sin administradores para **no perder el acceso al panel**.

**Criterios de aceptación**
- [ ] La UI oculta o deshabilita "Eliminar" en la fila del usuario actual.
- [ ] `deleteUser` y `updateUser` rechazan eliminar o degradar al último admin y la auto-eliminación.
- [ ] El diálogo de confirmación nombra al usuario y advierte sobre sus pedidos asociados (ver AZ-030).

**Pruebas necesarias**
- **Unit:** eliminar al último admin → rechazado; eliminar a otro usuario → permitido.
- **E2E:** la fila propia no ofrece "Eliminar".

---

#### AZ-062 · Un umbral de stock vacío tumba el dashboard

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** S
- **Evidencia:** *Reportado (FEC-1, FSB-25).* [setting-form.tsx:25-35,44-50](../app/admin/overview/setting-form.tsx#L25-L35) envía un string vacío; `setSetting` guarda cualquier valor y luego `parseInt('')` da `NaN`, que llega a Prisma como `{ lte: NaN }` en [order.actions.ts:661-671](../lib/actions/order.actions.ts#L661-L671) y [product.actions.ts:522-525](../lib/actions/product.actions.ts#L522-L525). `/admin/overview` (la página de aterrizaje del admin) y el filtro de stock crítico devuelven 500, sin `error.tsx`. Además `setSetting` llama a `requireAdmin` dentro de un `try/catch` que traga la redirección, y el formulario se muestra a vendedores aunque falle para ellos.

**Historia de usuario**
Como **administrador** quiero que un valor de configuración inválido no rompa el panel para **no tener que corregir la base de datos a mano**.

**Criterios de aceptación**
- [ ] `setSetting` valida el valor con zod (entero ≥ 0 para el umbral) y solo acepta claves de una lista blanca.
- [ ] Toda lectura usa un valor por defecto cuando `parseInt` da `NaN`.
- [ ] El formulario muestra errores de validación y no se muestra a vendedores (o se mueve a Configuración).
- [ ] El umbral configurable se usa en todos los lugares donde hoy está fijo en 2.

**Pruebas necesarias**
- **Unit:** valor vacío o no numérico → rechazado; lectura con valor corrupto → cae al valor por defecto.
- **E2E:** guardar un umbral válido actualiza el filtro de stock crítico.

---

#### AZ-063 · Menú móvil no se cierra y fallas críticas de accesibilidad en primitivos

- **Prioridad:** P1 · **Tipo:** Bug / A11y · **Est.:** S
- **Evidencia:** *Reportado (UXA-1, UXA-2, UXA-3).* [menu-mobile.tsx:71-160](../components/shared/header/menu-mobile.tsx#L71-L160): el `Sheet` no tiene `SheetClose` ni se cierra al navegar, y el `Header` vive en layouts persistentes, así que tras tocar "Mi Perfil" o "Carrito" el panel y el overlay quedan sobre la página nueva. [ui/input.tsx:29](../components/ui/input.tsx#L29): el botón de mostrar contraseña tiene `tabIndex={-1}` (WCAG 2.1.1): usuarios de teclado no pueden revelarla en ningún formulario. [ui/toast.tsx:73-88](../components/ui/toast.tsx#L73-L88): el botón de cierre es `opacity-0` hasta el hover, es invisible en táctil y no tiene nombre accesible.

**Historia de usuario**
Como **cliente en móvil o con teclado** quiero que la navegación y los formularios funcionen para **poder usar la tienda**.

**Criterios de aceptación**
- [ ] El menú móvil se cierra al navegar (`SheetClose asChild` o efecto sobre `usePathname`).
- [ ] El botón de contraseña es alcanzable por teclado y tiene `aria-pressed`.
- [ ] El cierre del toast es siempre visible y tiene `aria-label="Cerrar"`.

**Pruebas necesarias**
- **E2E (viewport móvil):** abrir el menú, tocar un enlace → el panel se cierra y la página es interactiva.
- **Unit (componente):** el botón de contraseña recibe foco con Tab.
- **Automatizada:** axe sin violaciones en los componentes afectados.

---

#### AZ-064 · Uploader compartido pierde actualizaciones y puede romper

- **Prioridad:** P1 · **Tipo:** Bug · **Est.:** M
- **Evidencia:** *Reportado por cuatro revisores (FEA-1, FEB-8, UXA-7, UXA-8, FEA-15).* [file-upload-field.tsx:43-87](../components/shared/file-upload-field.tsx#L43-L87) (usado para comprobantes de pago y banners) captura `files` al llamar, sube de a un archivo y termina con `onChange([...files, ...uploadedUrls])`: una segunda subida o un borrado durante la primera se sobreescriben. Con `multiple={false}` y resultado vacío emite `[undefined]` y `next/image` falla con `src` indefinido. La zona de soltar sigue activa durante la subida, tiene `role='button'` con un `<input>` anidado, maneja solo Enter y el botón de quitar mide 20 px sin `aria-label`. `image-upload-field.tsx` repite el patrón.

**Historia de usuario**
Como **administrador y cliente** quiero subir archivos de forma confiable para **no perder imágenes ni comprobantes**.

**Criterios de aceptación**
- [ ] Una única llamada `startUpload(files)` y un `onChange` con actualización funcional (o ref).
- [ ] La zona se deshabilita durante la subida y se protege contra `uploadedUrls.length === 0`.
- [ ] Se valida el tipo del archivo soltado contra `accept` y se limpia `input.value` tras cada selección.
- [ ] Accesibilidad: un único control de teclado, soporte de Espacio, botón de quitar de tamaño táctil con etiqueta.
- [ ] Un error parcial conserva los archivos ya subidos.

**Pruebas necesarias**
- **Unit (componente):** dos subidas consecutivas conservan ambas; quitar durante una subida no la revive.
- **Unit:** resultado vacío no llama a `onChange([undefined])`.
- **Manual:** subir un comprobante PDF y una imagen.

**Dependencias:** AZ-005 (validación del lado del servidor).

---

#### AZ-065 · Checkout: envío contradictorio, login sin retorno y datos de transferencia

- **Prioridad:** P1 · **Tipo:** UX / Negocio · **Est.:** M
- **Evidencia:** *Reportado (UXB-04, UXB-05, UXB-07, UXB-02, FEB-14).* [place-order-content.tsx:245-247](../app/(root)/place-order/place-order-content.tsx#L245-L247) muestra "Envío: Gratis" siempre (`cart.shippingPrice` es 0), mientras el selector de envío dice "A cargo del cliente"; el "Total" parece final pero excluye el envío. El botón del carrito lleva a `/shipping-address`, que redirige a `/sign-in` **sin `callbackUrl`**, y tras el login el usuario cae en `/` en lugar de volver al checkout. En la orden de transferencia, CBU, alias y CUIT se muestran en 12 px sin botón de copiar, sin importe a transferir ni concepto. El formulario de dirección no usa `autoComplete`, `inputMode` ni `type='email'`, y sus inputs son `text-sm` (iOS hace zoom).

**Historia de usuario**
Como **cliente** quiero un checkout coherente y sin fricción para **completar mi compra sin dudas sobre el costo ni perder el progreso**.

**Criterios de aceptación**
- [ ] La fila de envío refleja el método elegido ("A coordinar" o "Gratis desde $X"), y el total se rotula "Total (sin envío)" cuando corresponde. Se renderiza una fila de impuestos si es distinta de cero.
- [ ] `redirect('/sign-in?callbackUrl=…')` válido (ver AZ-018) en el carrito, la dirección y el resumen; el carrito avisa que se requiere iniciar sesión.
- [ ] El bloque de transferencia muestra importe, número de orden como concepto y botones de copiar CBU y alias con estado "Copiado".
- [ ] Todos los campos de dirección usan `autoComplete`, `inputMode` y `type` correctos, y `text-base md:text-sm`.

**Pruebas necesarias**
- **E2E:** carrito → login → vuelve al paso de dirección con el carrito intacto.
- **Unit (componente):** la fila de envío cambia según el método y el umbral.
- **Manual (iOS):** enfocar un campo del formulario no hace zoom.

**Dependencias:** AZ-018, AZ-027.

---

#### AZ-066 · Fechas de promociones se desplazan 3 h en cada guardado

- **Prioridad:** P1 · **Tipo:** Bug / Negocio · **Est.:** M
- **Evidencia:** *Reportado por cuatro revisores (UXC-3, FEC-3, FEB-20, UXB-31).* [discount-codes/[id]/page.tsx:25-30](../app/admin/promotions/discount-codes/[id]/page.tsx#L25-L30) y [promo-banner-form.tsx:100-101](../components/admin/promo-banner-form.tsx#L100-L101) rellenan `datetime-local` con `toISOString().slice(0,16)` (hora **UTC**), mientras el navegador interpreta ese valor como hora **local**; al guardar se vuelve a convertir. En Argentina (UTC-3) la ventana de vigencia se corre 3 horas en cada apertura y guardado. Si la página pasa un `Date` o un ISO completo, el formulario de códigos muestra el campo vacío y un guardado borra las fechas (sin verificar). Además `formatDateTime` usa `en-US` y no fija zona horaria.

**Historia de usuario**
Como **administrador** quiero que las fechas de una promoción se muestren y guarden tal como las ingreso para **que empiecen y terminen a la hora prevista**.

**Criterios de aceptación**
- [ ] Un único helper `toLocalInputValue()`/`fromLocalInput()` con zona `America/Argentina/Buenos_Aires`, usado en los formularios de banner y de código.
- [ ] Abrir y guardar sin cambios no altera las fechas.
- [ ] Las fechas se envían como ISO con offset explícito y se pueden borrar de forma intencional.
- [ ] Las páginas pasan al formulario solo los campos necesarios, sin `usageHistory`.

**Pruebas necesarias**
- **Unit:** ida y vuelta de fechas conservando la hora local, incluso cerca de medianoche.
- **E2E:** editar un código sin tocar las fechas y verificar que no cambian.

---

### 7.5 Tickets — 🟡 P2

> Formato compacto: se mantienen evidencia, historia, criterios y pruebas, con menos detalle por criterio.

---

#### AZ-067 · Endurecer el schema: índices, FKs, únicos y CHECKs

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FSB-7, FSB-8, FSB-9, FSB-23, ARC-10).* No hay `@@index` salvo claves; faltan en `Order(userId, sellerId, createdAt, isPaid+expiresAt)`, `OrderItem.productId`, `Product(categoryId, brandId, subCategoryId, sellerId, isFeatured, createdAt)`, `Review`, `Cart`, `PromoCodeUsage`, `PasswordResetToken`, `CartRecovery`. Sin FK: `Order.bannerId`, `Order.sellerId`, `PromoCodeUsage.orderId`, `CartRecovery.cartId`. Faltan únicos: `Size(categoryId,name)`, `Review(userId,productId)`, `Cart(userId)` y nombres de color/categoría/marca de forma insensible a mayúsculas. Sin `CHECK` para `stock >= 0`, `qty > 0`, `priceUsed >= 0`, rating 1..5. La búsqueda `contains` insensible a mayúsculas hace *seq scan*.
- **Historia:** Como equipo quiero que la base de datos garantice sus invariantes para que un error de aplicación no corrompa los datos.
- **Criterios de aceptación:** [ ] Migraciones pequeñas con los índices, FKs, únicos y CHECKs listados, con detección previa de datos que los violen. [ ] Un `CHECK (stock >= 0)` convierte la sobreventa en un fallo transaccional. [ ] Índice trigram para la búsqueda de productos si se mantiene `contains`. [ ] Subcategoría validada contra la categoría del producto.
- **Pruebas:** **Integración:** insertar stock negativo o un rating 6 → error. **Manual:** `EXPLAIN` del cron y de la búsqueda usa índices. **Manual:** migración sobre copia de producción.
- **Dependencias:** AZ-049, AZ-089.

---

#### AZ-068 · Validador de moneda y aritmética monetaria

- **Prioridad:** P2 · **Est.:** S · **Evidencia:** *Reportado (FSB-10, ARC-10).* [validators.ts:5-10](../lib/validators.ts#L5-L10) valida `formatNumberWithDecimal(Number(v))` y no el string original: acepta `""`, `"0"`, `"0x10"` y `"1e3"`; un total negativo falla con el mensaje engañoso "dos decimales". Los precios en cero son válidos en productos y carrito. Los importes se calculan con floats de JS aunque la base usa `Decimal(12,2)`.
- **Historia:** Como dueño quiero que ningún precio sea vacío, cero o negativo para evitar ventas regaladas.
- **Criterios de aceptación:** [ ] Regex `^\d+\.\d{2}$` con mínimo y máximo explícitos. [ ] Un total menor a 0 produce un error claro. [ ] Un objeto `Money` (o Decimal) para todos los cálculos y un único redondeo.
- **Pruebas:** **Unit:** tabla de entradas inválidas (`""`, `"0"`, `"-1.00"`, `"1e3"`) rechazadas. **Unit:** combinaciones promo + banner nunca dan negativos ni ruido decimal.

---

#### AZ-069 · Crons de carritos abandonados y de expiración resilientes

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FSB-13, FSB-14, FSB-31).* [detect-abandoned-carts/route.ts:85-100](../app/api/cron/detect-abandoned-carts/route.ts#L85-L100) deduplica solo por `recoveredAt: null`, que el POST de `cart-recovery` marca al hacer clic (no al comprar), así que cada corrida reenvía el correo; crea la fila antes de enviar y un envío fallido no se reintenta; el email no tiene opción de baja (riesgo legal). `release-expired-orders/route.ts:52-87` ejecuta una transacción por orden en un bucle sin `try/catch` por orden: una falla corta el resto. Ambos son solo `POST` y no se conoce el planificador.
- **Historia:** Como cliente quiero no recibir correos repetidos ni que un error detenga la liberación de stock.
- **Criterios de aceptación:** [ ] Deduplicación por ventana de N días y marca de "recuperado" al crear una orden. [ ] La fila se crea solo tras un envío exitoso. [ ] Enlace de baja en el email. [ ] `try/catch` por orden con log estructurado. [ ] El método HTTP coincide con el del planificador documentado en AZ-050.
- **Pruebas:** **Integración:** dos corridas seguidas envían un único correo. **Integración:** una orden que falla no impide procesar las siguientes.
- **Dependencias:** AZ-050, AZ-009.

---

#### AZ-070 · Capa única de envío de emails

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FSB-15, FSB-17, ARC-5).* `lib/email.ts` hace 8 `fetch` a su propio `/api/send-email` (más `auth.actions.ts:64`) sin timeout, sin `res.ok`, sin reintentos ni outbox; `sendWelcomeEmail` se espera antes de `signIn` y puede bloquear el alta. `sendNewSaleNotification` usa una plantilla escrita para el cliente y la envía al admin, y se dispara en cada orden pagada. Los correos de confirmación no muestran descuentos, de modo que las líneas no suman el total; el recibo se envía dos veces con significados distintos. Existen tres fuentes de plantillas (`email-templates.ts`, `email/*.tsx` sin importadores, y un `switch` sin tipos en `send-email/route.ts`).
- **Historia:** Como cliente quiero correos correctos y confiables.
- **Criterios de aceptación:** [ ] Un helper `sendMail` que llama directamente a Resend con timeout, log y reintentos (tabla `EmailLog` o outbox). [ ] Plantilla propia para el admin; los correos incluyen las líneas de descuento; el segundo envío solo ocurre al pagar. [ ] Una sola fuente de plantillas tipadas. [ ] Sin llamadas HTTP a sí mismo.
- **Pruebas:** **Unit:** fallo de Resend → registrado y reintentable, sin romper `createOrder`. **Unit:** snapshot de cada plantilla con los importes.
- **Dependencias:** AZ-016, AZ-050.

---

#### AZ-071 · Estrategia de renderizado y caché de Next 16

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Build (NXT-3, NXT-6) y reportado (NXT-4, NXT-12, NXT-13, NXT-17, FEB-17, FEC-7, FEA-11).* `Header → Menu` espera `getMyCart()` y `auth()` en cada layout sin `Suspense`, por lo que toda la tienda es dinámica y el TTFB depende de 2–3 consultas. `getMyCart` hace 3 consultas por llamada y corre dos veces en el PDP; `getProductBySlug` corre dos veces (metadata y página); `auth()` se llama dos veces por request. Los paneles admin y de usuario también renderizan el carrito. Solo existe un `loading.tsx` global y el `not-found` de un producto muestra el 404 raíz sin header. La revalidación tras mutaciones es incompleta (PDP, POS, inventario). `unstable_cache` sin `revalidateTag`.
- **Historia:** Como cliente quiero páginas rápidas.
- **Criterios de aceptación:** [ ] Decisión documentada entre `cacheComponents` / `'use cache'` y dinámico puro; se eliminan `revalidate` y `generateStaticParams` ineficaces del PDP. [ ] `Menu` en `Suspense` o como isla cliente, y sin carrito en admin/user. [ ] `React.cache` para `getMyCart`, `getProductBySlug` y la sesión. [ ] `loading.tsx` y `not-found.tsx` por segmento. [ ] `updateTag`/`revalidateTag` con la firma de Next 16 y revalidación de PDP, POS, inventario y overview tras mutar. [ ] `Promise.all` y `Suspense` por widget en overview, home y páginas de checkout.
- **Pruebas:** **Manual:** la salida de `next build` muestra el tipo de ruta esperado. **E2E:** editar un producto actualiza su PDP y la home. **Medición:** TTFB de home y PDP antes y después.
- **Dependencias:** AZ-037, AZ-050.

---

#### AZ-072 · Frontera `server-only` y dirección de dependencias

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (ARC-1, ARC-8, NXT-15, NXT-18).* Los 15 archivos `lib/actions/*.ts` son `'use server'` (~104 exportaciones) y funcionan como capa de servicio; no hay ningún `import 'server-only'`. Páginas acceden a Prisma directo (`product/[slug]/page.tsx`, `admin/pos/page.tsx`, `admin/categories/sub/[id]/page.tsx`, `sitemap.ts`, `notifications-bell.tsx`), `lib/mercadopago.ts` importa de `actions/settings.actions`, y `isRedirectError` se importa de rutas internas de Next (`user.actions.ts:11`, `order.actions.ts:3`, `utils.ts:20`).
- **Historia:** Como equipo quiero una frontera clara entre endpoints públicos y servicios internos.
- **Criterios de aceptación:** [ ] `import 'server-only'` en `db/prisma.ts` y en los módulos de lectura. [ ] Lecturas internas en `lib/data/*`; `'use server'` solo para comandos con su autorización. [ ] Regla de lint (`no-restricted-imports` o dependency-cruiser) que prohíbe que UI y dominio importen `@prisma/client` o `db/`. [ ] `unstable_rethrow` en lugar de `isRedirectError`. [ ] Test que recorre las exportaciones `'use server'` (ver AZ-013).
- **Pruebas:** **CI:** la regla de lint falla ante un import prohibido. **Unit:** recorrido de exportaciones.
- **Dependencias:** AZ-013, AZ-053.

---

#### AZ-073 · SEO: sitemap, robots, canonical y Open Graph

- **Prioridad:** P2 · **Est.:** S · **Evidencia:** *Build/Reportado (NXT-2, NXT-20, FEC-12, FEC-26, UXC-40).* [sitemap.ts:9-12](../app/sitemap.ts#L9-L12) lista solo productos `isFeatured` (el comentario "los demás no aparecen" es falso) y se congela en el build; usa `createdAt` como `lastModified`; un fallo de BD en el build se hornea como sitemap de una URL. `sitemap` incluye `/search?category=…` que `search` marca `noindex`; faltan `alternates.canonical`; `robots` bloquea `/checkout` (no existe); `/admin` y `/user` no tienen `noindex`. "Destacados" enlaza a `/search?isFeatured=true`, que ignora el filtro.
- **Historia:** Como dueño quiero que los buscadores indexen el catálogo correcto.
- **Criterios de aceptación:** [ ] Todos los productos visibles en el sitemap, con `updatedAt` (añadirlo a `Product`) y `revalidate` horario; un fallo de BD no reemplaza la copia anterior. [ ] Sin URLs `noindex` en el sitemap; canonical en búsqueda y PDP. [ ] `noindex` en `/admin` y `/user`. [ ] `isFeatured` soportado en `getAllProducts` o un enlace a una ruta real.
- **Pruebas:** **Unit:** el sitemap contiene un producto no destacado y excluye URLs filtradas. **Manual:** `robots.txt` y metadatos de las páginas privadas.

---

#### AZ-074 · Formato único de moneda y fechas es-AR

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (UXC-23, UXC-6, UXB-11, UXA-10, FEA-30, FEA-18).* `formatCurrency` usa USD y `en-US` ([lib/utils.ts:61](../lib/utils.ts#L61)): `$1,250.00` se lee como 1,25 pesos en la pantalla de mayor riesgo (POS). Coexisten `toFixed(2)`, `Intl` por componente, `$${priceUsed}` crudo y `ProductPrice` (con `$NaN.NaN` si falta el precio). `formatDateTime` es `en-US`, 12 h y sin zona horaria (el servidor puede renderizar en UTC y mostrar días equivocados cerca de medianoche).
- **Historia:** Como cliente y vendedor quiero ver importes y fechas en el formato local.
- **Criterios de aceptación:** [ ] `formatARS()` y `formatDate()` únicos (`es-AR`, `America/Argentina/Buenos_Aires`, 24 h) usados en todo el proyecto. [ ] Un precio ausente no renderiza `NaN`. [ ] El POS muestra el precio por método de pago junto a cada opción. [ ] Los lectores de pantalla leen un único valor (no "$ 12000 .00").
- **Pruebas:** **Unit:** tabla de importes y fechas. **E2E:** el total del POS coincide con el esperado en formato local.
- **Dependencias:** AZ-048.

---

#### AZ-075 · Datos de provincias y localidades incorrectos

- **Prioridad:** P2 · **Est.:** S · **Evidencia:** *Reportado (FSB-26).* [lib/data/argentina.json](../lib/data/argentina.json) tiene pares incorrectos (por ejemplo "Corrientes" en Chaco y Formosa, "El Soberbio" e "Iguazú" en Formosa, "Dolavon" en Santa Cruz, "Bragado" en La Pampa, "Bálcarce" mal escrito). La ciudad de envío gratis por defecto es "La Banda del Río Salí" ([settings.actions.ts:125](../lib/actions/settings.actions.ts#L125)) pero el JSON dice "Banda del Río Salí", así que la comparación por nombre falla. El JSON entra en tres bundles cliente.
- **Historia:** Como cliente quiero encontrar mi localidad para completar el envío.
- **Criterios de aceptación:** [ ] Datos tomados de una fuente oficial (INDEC o Georef) y localidad por id. [ ] Opción "Mi localidad no figura" con texto libre. [ ] El envío gratis compara ids, no nombres. [ ] Carga bajo demanda, no en el bundle.
- **Pruebas:** **Unit:** ninguna localidad aparece bajo una provincia incorrecta (test de integridad de datos). **Unit:** la ciudad de envío gratis por defecto coincide.

---

#### AZ-076 · POS: tablet, errores de red, velocidad y accesibilidad

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado por cinco revisores (UXC-4 a UXC-9, FEC-2, FEC-13, FEC-14, FEC-30, NXT-13, NXT-26).* El punto de quiebre `lg` (1024 px de viewport) deja una columna de carrito de ≈ 275 px junto a un sidebar de 256 px; en vertical (768–1023 px) el carrito cae debajo y el total no es fijo; hay tres áreas con scroll anidado y el carrito mide `max-h-[22vh]`. Tras una venta el carrito sigue activo detrás del modal de éxito (se puede registrar una segunda venta con el teclado). `startTransition(async …)` sin `try/catch`: un fallo de red no muestra error y un reintento duplica la venta. La búsqueda de clientes tiene condición de carrera, no es un combobox y se lanza con 1 carácter. El catálogo completo viaja al cliente y el stock queda desactualizado tras vender (no hay `revalidatePath` ni `router.refresh`). Hay 14 elementos con el mismo `data-testid`.
- **Historia:** Como vendedor quiero un POS rápido y confiable en tablet.
- **Criterios de aceptación:** [ ] Punto de quiebre `xl:`, sidebar colapsable en `/admin/pos`, columna de carrito fija y barra de total fija en pantallas menores. [ ] El carrito se limpia al confirmar la venta y los modales usan `components/ui/dialog`. [ ] `try/catch` con mensaje "No se pudo confirmar la venta, revisá Pedidos antes de reintentar" y conservación del carrito. [ ] Búsqueda de cliente con cancelación, mínimo 2 caracteres y patrón combobox. [ ] Búsqueda de productos en servidor con paginación; Enter agrega cuando hay un único resultado. [ ] Revalidar POS, inventario y overview tras vender. [ ] Cantidad editable en un campo táctil, "Vaciar" con deshacer y `aria-label` en controles. [ ] `data-testid` únicos.
- **Pruebas:** **E2E (viewport tablet):** venta completa con búsqueda, color y talle. **Unit (componente):** un fallo de red conserva el carrito. **Integración:** dos ventas concurrentes de la última unidad.
- **Dependencias:** AZ-001, AZ-008, AZ-040.

---

#### AZ-077 · Admin: listas, filtros y acciones destructivas

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado por tres revisores (UXC-11, 12, 14, 17, 18, 20 a 22, 24 a 27, 35; FEC-6, 20, 21, 34; FEB-35).* `?page=abc`, `0` o `-3` rompen las listas con 500 (sin `error.tsx`). La lista de pedidos no muestra método de pago ni comprobante, y una orden cancelada aparece como "Pendiente". "Detalles" abre la vista de tienda, sin el shell admin. El buscador global de la cabecera es ciego al contexto y pierde filtros. El diálogo de borrado siempre dice "¿Estás absolutamente seguro?" sin nombrar el elemento; no hay *soft delete* para órdenes y usuarios. Los filtros copian props a estado y solo aplican con botón. Sin estados vacíos ni "Página X de Y"; el umbral de stock bajo está fijo en 2 en tres lugares; los links usan `query` sin codificar; sin paginación en listas pequeñas; la navegación mezcla roles (colores para vendedores redirige a `/unauthorized`) y está en inglés parcial.
- **Historia:** Como administrador quiero listas claras y seguras.
- **Criterios de aceptación:** [ ] `parsePage()` y listas blancas para `role`, `status`, `stock` (un único helper). [ ] Columnas Método y Estado, filtros por estado y vista de orden admin en `/admin/orders/[id]`. [ ] `DeleteDialog` con `entityLabel`, `aria-label` por fila y confirmación escrita para órdenes y usuarios. [ ] `FilterBar` único (formulario GET con `defaultValue`) con aplicación inmediata, chips y conteo. [ ] Paginación con "Página X de Y · N resultados", estados vacíos y `URLSearchParams`. [ ] Un componente de estado de stock (Agotado/Bajo/OK con texto, no solo color) y el umbral viene del servidor. [ ] La navegación y los controles salen de una única matriz de permisos (ver AZ-029) y se agrupa por Ventas/Catálogo/Marketing/Administración en español.
- **Pruebas:** **Unit:** `parsePage` con entradas inválidas. **E2E:** filtrar y paginar conserva los parámetros. **Automatizada:** axe en listas.
- **Dependencias:** AZ-007, AZ-029, AZ-052.

---

#### AZ-078 · Admin: formularios de configuración

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FEC-10, FEC-24, UXC-31).* Los formularios de banco, envío y MercadoPago no usan resolver zod: `valueAsNumber` vacío da `NaN` y el servidor guarda `'NaN'`; se aceptan umbrales negativos, ciudades vacías o duplicadas; CBU (22 dígitos) y CUIT no se validan; las etiquetas no se asocian a sus campos. El formulario promete que el token "se encripta" mientras `encrypt.ts` no hace nada (ver AZ-012). `getShippingSettings` hace `JSON.parse` sin protección.
- **Historia:** Como administrador quiero que la configuración se valide para no guardar datos inválidos.
- **Criterios de aceptación:** [ ] Un esquema zod por formulario, compartido con la acción. [ ] CBU de 22 dígitos, CUIT válido, números ≥ 0 y ciudades únicas y no vacías. [ ] Etiquetas con `htmlFor`/`id` y aviso de cambios sin guardar. [ ] Lectura tolerante a valores corruptos (valores por defecto). [ ] Importes rotulados en ARS.
- **Pruebas:** **Unit:** entradas inválidas rechazadas en cliente y servidor. **Unit:** `JSON.parse` corrupto no rompe `getShippingSettings`.
- **Dependencias:** AZ-012, AZ-055.

---

#### AZ-079 · Formularios de producto, categoría y marca

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FEB-5, 6, 7, 16, 23, 25, 28; UXB-25, 29, 30; FEB-31).* En edición, renombrar una categoría, marca o subcategoría regenera el slug (`type === 'Create' || !dirtyFields.slug`) y rompe URLs guardadas. `product-form` carga talles sin cancelación y reinicia el stock al cambiar categoría; al quitar un color o desmarcar `hasColorVariants` quedan variantes huérfanas que se envían; ≈ 10 `form.watch()` re-renderizan todo el formulario (≈ 765 líneas); los precios son texto sin `inputMode` y escribir "1.500" puede leerse como 1,5; no hay resumen de errores ni barra de guardado fija. Textos en inglés ("Create Categoría", "ERROR!"). Preview apunta a un placeholder inexistente. Varios formularios usan `method='post'` sin `action`.
- **Historia:** Como administrador quiero editar el catálogo sin efectos secundarios.
- **Criterios de aceptación:** [ ] Auto-slug solo al crear; en edición, botón "Regenerar". [ ] `loadSizes` con cancelación y referencia a la categoría previa. [ ] Se podan las variantes de colores inexistentes antes de enviar. [ ] Vista previa en un componente con `useWatch`. [ ] Campos de precio numéricos con prefijo, normalización de separadores y resumen de errores con scroll al primero. [ ] Textos en español y `method` eliminado.
- **Pruebas:** **Unit (componente):** renombrar en edición conserva el slug. **Unit:** quitar un color elimina sus variantes del payload. **E2E:** editar un producto con colores y guardar.
- **Dependencias:** AZ-022, AZ-051.

---

#### AZ-080 · Formularios de perfil y dirección

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FEC-8, FEC-9, FEB-15, UXB-02, UXB-03, UXB-28, UXC-32, NXT-27).* [profile-form.tsx:396](../app/user/profile/profile-form.tsx#L396) llama a `useState` dentro del callback de un `FormField` (viola las reglas de hooks) y lee `getValues('province')` sin suscribirse. Guardar el perfil no es atómico (el nombre se guarda aunque la dirección sea inválida) y los errores de dirección salen como un único toast. En el formulario de dirección, el `id` explícito de cada `<Input>` dentro de `FormControl` pisa el `formItemId` y deja las etiquetas sin asociar; el orden de campos no sigue el habitual (provincia, localidad, código postal, calle) y la localidad es un combobox cerrado.
- **Historia:** Como cliente quiero completar mi dirección sin errores confusos.
- **Criterios de aceptación:** [ ] Un componente `CityField` y `useWatch({ name: 'province' })`. [ ] Un único resolver zod con el esquema de dirección y errores por campo; una sola llamada al servidor. [ ] Sin `id` explícitos dentro de `FormControl` (usar `data-testid`/`getByLabel` en E2E). [ ] Campos reordenados y validación `onTouched`. [ ] El email deshabilitado no se envía.
- **Pruebas:** **Unit (componente):** hacer clic en una etiqueta enfoca su campo. **Unit:** dirección inválida no guarda el nombre. **E2E:** completar la dirección con autocompletado.
- **Dependencias:** AZ-002, AZ-075.

---

#### AZ-081 · Formularios de autenticación

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FEB-11, 12, 13, 22, 27; UXB-21 a 24, 33, 36).* El login (formulario no controlado) borra el email tras un error. `forgot` y `reset` no usan `try/finally` (el botón puede quedar bloqueado) y `reset` se reactiva durante los 2 s previos a la redirección. Sin `autoComplete` (`new-password`, `email`), sin etiquetas asociadas y errores sin `role='alert'`. `sanitizeName` borra guiones y puntos ("García-Márquez"). El email del alta es `type='text'`. Las páginas de forgot/reset no usan el mismo shell que sign-in y usan clases inexistentes (`az-body-lg-bold`, `hover:text-az-primary-hover`). Falta un `h1` en sign-in y sign-up. El logo de 4000 × 1303 px (371 KB) se sirve a ≈ 310 px.
- **Historia:** Como cliente quiero formularios de acceso claros y compatibles con mi gestor de contraseñas.
- **Criterios de aceptación:** [ ] El login conserva el email tras un error. [ ] `try/finally` y formulario deshabilitado tras éxito. [ ] `autoComplete`, `type='email'`, etiquetas con `htmlFor` y `role='alert'` ligado al campo. [ ] Nombres con guion y punto permitidos y validados al enviar. [ ] Mismo shell visual y un `h1` en las cuatro páginas; logo con tamaño real y `sizes`. [ ] Checklist de requisitos reutilizada en el reseteo (misma política que el alta).
- **Pruebas:** **Unit (componente):** error de login conserva el email. **E2E:** alta y login con gestor de contraseñas simulado. **Automatizada:** axe en las cuatro páginas.
- **Dependencias:** AZ-025, AZ-057.

---

#### AZ-082 · Tienda móvil: búsqueda, carrito y orden

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado (UXB-06, 08, 09, 10, 12, 13, 14, 15, 16, 17, 43, 44, 45; FEB-10, 14, 18, 19, 21).* En móvil los filtros de búsqueda (~20 enlaces) se apilan sobre los resultados, sin panel colapsable, y el `aside` sticky no tiene `max-h`; las tarjetas usan 1 columna. En la orden, `grid md:grid-cols-3` con `col-span-2` sin prefijo rompe el layout bajo `md`; el CTA y el total quedan tras la lista de ítems sin barra fija. El carrito no tiene botón de eliminar (se borra bajando a 0, sin confirmación), botones de 32 px, precio sin total por línea y "items" sin pluralizar. El color elegido desaparece en el resumen y la orden. Estados "Pendiente de pago" y "No entregado" con estilo de error; no hay mensaje de confirmación tras comprar. "Aprobar/Rechazar pago" actúan con un clic. Un vendedor ve "Pagar con Mercado Pago" en pedidos de clientes. Las dos columnas de cantidad (+/−) de una misma fila pueden dispararse a la vez.
- **Historia:** Como cliente móvil quiero buscar, revisar y pagar sin fricción.
- **Criterios de aceptación:** [ ] Filtros en un `Sheet` o `<details>` bajo `md`, `max-h` con scroll en el `aside` y 2 columnas base. [ ] `md:col-span-2` y barra fija "Total + CTA" bajo `lg`. [ ] Botón "Quitar" con deshacer, botones de 40 px, total por línea y "productos". [ ] El color y su muestra en resumen y orden. [ ] Estados neutros/ámbar, un único estado con línea de tiempo y un banner de confirmación en la primera visita. [ ] `AlertDialog` en Aprobar/Rechazar. [ ] El botón de pago de MercadoPago solo para el dueño de la orden. [ ] Un `useTransition` por fila del carrito con ambos botones deshabilitados.
- **Pruebas:** **E2E (360 px):** buscar con filtros, agregar, quitar y pagar. **Unit (componente):** el vendedor no ve el botón de pago. **Manual:** revisión visual en 320 y 360 px.
- **Dependencias:** AZ-020, AZ-023, AZ-052.

---

#### AZ-083 · Confianza y contenido legal de la tienda

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (UXB-20, UXB-27).* Ningún footer incluye canal de contacto, política de devoluciones o envíos, términos o privacidad (el enlace a privacidad está comentado); el PDP tiene un bloque "Envíos y Devoluciones" sin texto; el alta no muestra aceptación de términos; el checkout (footer mínimo) no ofrece ayuda; la home promete "Seguimiento en tiempo real" aunque el estado de envío es manual y "Pagos 100 % seguros" sin respaldo. `text-white/45` sobre `#0a1317` no cumple AA. El revisor señala que el comercio electrónico en Argentina suele requerir información de defensa del consumidor y "botón de arrepentimiento" (Res. 424/2020): **validar con un asesor legal**.
- **Historia:** Como cliente quiero ver cómo contactar a la tienda y cuáles son sus políticas para confiar en la compra.
- **Criterios de aceptación:** [ ] Páginas de términos, privacidad, devoluciones y envíos con contenido aprobado por el dueño. [ ] Contacto (WhatsApp o email) en ambos footers y en el checkout. [ ] Aceptación de términos en el alta y en la confirmación de la orden. [ ] Textos del PDP y de la home alineados con lo que el sistema realmente hace. [ ] Contraste AA en el footer.
- **Pruebas:** **E2E:** los enlaces del footer abren páginas existentes. **Manual:** revisión legal documentada.
- **Dependencias:** decisión del dueño y asesoría legal.

---

#### AZ-084 · Accesibilidad de primitivos y movimiento

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado (UXA-4, 5, 6, 11, 14, 15, 19 a 22, 24 a 27, 30, 31; FEA-7, FEA-23, FEA-24).* Ninguna regla `prefers-reduced-motion` en el proyecto; los carruseles con autoplay no tienen pausa ni `inert` en slides ocultos (los enlaces ocultos entran en el orden de tabulación). Contraste insuficiente a nivel de token: `--az-stone` ≈ 3,1:1, `--destructive` ≈ 3,8:1, ámbar ≈ 3,2:1. Objetivos táctiles de 16–40 px en botones, inputs, checkbox, radio y cerrar de diálogo/sheet. `FormMessage` sin `role='alert'`, `aria-describedby` colgante y sin indicador de requerido. "Cerrar sesión" es un `<form>` dentro de `DropdownMenuItem` (puede no activarse con teclado) y el avatar no tiene nombre. Los colores y talles no exponen estado seleccionado; los pasos del checkout no son una lista ni tienen `aria-current`; el sidebar colapsado depende de `title` y su anillo de foco mide ≈ 1,5:1. Textos `sr-only` en inglés y mezcla de voseo/tuteo.
- **Historia:** Como persona con discapacidad o preferencias de movimiento reducido quiero usar la tienda y el panel sin barreras.
- **Criterios de aceptación:** [ ] Bloque global `@media (prefers-reduced-motion: reduce)`, autoplay desactivado y control de pausa visible. [ ] Carrusel con `inert`/`aria-hidden` en slides no activos, `aria-label` y `aria-roledescription`. [ ] Tokens de color con contraste AA. [ ] Un tamaño `touch` (`min-h-11 min-w-11`) y áreas de impacto ampliadas. [ ] `role='alert'`, `aria-describedby` condicional y asterisco de requerido en `FormMessage`/`FormLabel`. [ ] `DropdownMenuItem onSelect` para cerrar sesión y `aria-label` en el avatar. [ ] `role='radiogroup'`/`aria-checked` en color y talle, `<ol aria-current="step">` y `aria-expanded` en el sidebar. [ ] Textos accesibles en español, un registro (voseo) y un glosario.
- **Pruebas:** **Automatizada:** pasada con axe (Playwright) en home, producto, carrito, checkout y admin. **Manual:** recorrido solo con teclado y con lector de pantalla del checkout.
- **Dependencias:** AZ-039, AZ-090.

---

#### AZ-085 · El descuento de banner depende de una cookie manipulable

- **Prioridad:** P2 · **Est.:** S · **Evidencia:** *Reportado (FEA-12).* [banner-activator.tsx:6-10](../components/shared/banner-activator.tsx#L6-L10) (componente cliente) escribe una cookie sin `Secure` desde un `useEffect` y [place-order/page.tsx:32-36](../app/(root)/place-order/page.tsx#L32-L36) confía en ella para decidir qué descuento de banner aplica. Cualquier visitante puede fijar `activeBanner=<id de un banner activo>` y obtener ese descuento sin pasar por el banner (el servidor sí verifica que esté activo).
- **Historia:** Como dueño quiero que un descuento solo se aplique a quien llegó por la promoción.
- **Criterios de aceptación:** [ ] El `bannerId` se fija en el servidor (route handler o acción) y se firma, o se guarda en el carrito. [ ] El servidor verifica que los productos del carrito pertenezcan al banner. [ ] Regla de acumulación con códigos promocionales documentada (ver AZ-028).
- **Pruebas:** **Unit:** una cookie fabricada a mano no aplica descuento. **Integración:** un descuento solo aplica a productos del banner.
- **Dependencias:** AZ-028.

---

#### AZ-086 · El borrado de assets puede eliminar imágenes aún referenciadas

- **Prioridad:** P2 · **Est.:** S · **Evidencia:** *Reportado (FSB-20).* [product.actions.ts:228-236,440-446](../lib/actions/product.actions.ts#L228-L236) y `promo-banner.actions.ts:138,162` borran los archivos de UploadThing al editar o eliminar. `OrderItem.image` guarda la misma URL como instantánea, de modo que los pedidos históricos pierden su miniatura; imágenes compartidas entre productos o colores también se borran. `extractFileKey` conserva el *query string* y trata rutas locales (`/images/...`) como claves. Extiende AZ-005.
- **Historia:** Como cliente quiero ver las imágenes de mis pedidos anteriores.
- **Criterios de aceptación:** [ ] Antes de borrar se comprueba que ninguna fila (Product, ProductColor, OrderItem, PromoBanner) referencia el archivo. [ ] Limpieza diferida en un job, con reintento. [ ] `extractFileKey` ignora el query string y rechaza rutas locales.
- **Pruebas:** **Unit:** editar un producto cuya imagen figura en una orden no la borra. **Unit:** `extractFileKey` con URL con query y con ruta local.
- **Dependencias:** AZ-005.

---

#### AZ-087 · Reparar la suite de integración

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado, por lectura cruzada de código y tests (FST-2, 3, 4, 8, 9, 10, 11, 12, 15, 26 a 29).* Los tests del webhook mockean `@/lib/mercadopago` solo con `{ mpClient }` mientras la ruta llama a `getMercadoPagoClient()`: las pruebas de "aprobado" y "pendiente" devolverían 500. `authorization.test.ts` espera `/NEXT_REDIRECT/` pero las acciones lanzan `UnauthorizedError`. `promo-code-payment-method.test.ts` ejecuta `deleteMany({})` sin filtro con workers en paralelo. El mock de `@/email` apunta al directorio de plantillas, no a `lib/email.ts`, de modo que se hacen `fetch` reales. Las pruebas de "race condition" son secuenciales y la idempotencia del webhook acepta un monto distinto como correcto (codifica el hueco de AZ-004). Los tests del cron no usan items ni colores. Fixtures con formas que no coinciden con producción; ids fijos y dependencia de orden; títulos con IDs de tickets antiguos que chocan con este documento.
- **Historia:** Como equipo quiero tests de integración que detecten regresiones reales.
- **Criterios de aceptación:** [ ] Mocks corregidos y compartidos entre unit e integración; falla cualquier `fetch` sin mock. [ ] `maxWorkers: 1` (o un esquema por worker) y limpieza acotada a los ids propios. [ ] Aserciones sobre mensajes y estado de BD en los casos negativos. [ ] Tests concurrentes reales (`Promise.all`) para la última unidad de stock y para el webhook duplicado. [ ] Tests del cron con items, colores y comprobantes; test de monto distinto en el webhook (debe fallar hasta resolver AZ-004). [ ] Fábricas con tipos de Prisma, un único `uid()` y ejemplos con color. [ ] Títulos sin IDs de tickets antiguos.
- **Pruebas:** **Meta:** verificación por mutación en rutas de pago y stock (quitar la condición `stock >= qty` o la idempotencia hace fallar al menos un test).
- **Dependencias:** AZ-035, AZ-089.

---

#### AZ-088 · E2E que verifiquen comportamiento real

- **Prioridad:** P2 · **Est.:** L · **Evidencia:** *Reportado (FST-6, 7, 19 a 22, FEC-19).* Los specs son casi tautológicos: `04-admin-nav` afirma `onPage || signIn || unauthorized`; `03-pos` se protege con `if (url incluye '/admin/pos')` y traga errores con `.catch(()=>{})`; `02-checkout` hace `test.skip()` incondicional si falta el producto y envuelve cada paso en `if (isVisible)`; `01-auth` entra con `123456` mientras la contraseña sembrada es otra. La fixture de autenticación es un no-op y `global.setup.ts` no inicia sesión, así que nunca se escribe `storageState`. Los selectores son frágiles (`button:has-text("M")`); hay 14 elementos con el mismo `data-testid`. No hay `webServer`, la imagen sembrada usa un host no permitido por `next/image` y el `upsert` con uuid nuevo nunca actualiza.
- **Historia:** Como equipo quiero que un E2E en verde signifique que el flujo funciona.
- **Criterios de aceptación:** [ ] Un proyecto `setup` que inicia sesión y guarda `storageState` para admin y cliente. [ ] Aserciones concretas (badge del carrito, orden creada, código de estado o URL de redirección). [ ] Selectores por rol/etiqueta y `data-testid` únicos. [ ] `webServer` configurado con el entorno de test y `trace: 'retain-on-failure'`. [ ] Datos sembrados con claves estables y una imagen permitida. [ ] Flujos cubiertos: compra con MercadoPago simulado, transferencia con comprobante, POS, aprobar/rechazar, reseteo de contraseña.
- **Pruebas:** **E2E:** romper a propósito el carrito o el pago hace fallar el suite.
- **Dependencias:** AZ-054, AZ-057, AZ-089.

---

#### AZ-089 · CI y entorno de test reproducible

- **Prioridad:** P2 · **Est.:** M · **Evidencia:** *Reportado (FST-13, 14, 18, 24, 25, 30 a 32, ARC-6).* No hay `.github/`, docker-compose ni plantilla `.env.test`; no existen scripts `typecheck`, `test:ci` ni cobertura. ts-jest recibe un `tsconfig` inline que reemplaza el del archivo (se pierden `strict`, `jsx`, `paths`). La BD de test se crea con `db push --force-reset` en lugar de aplicar migraciones, así que las migraciones y restricciones reales nunca se prueban. `package.json` tiene el nombre `"az store"` (con espacio) y no define `engines` (Next 16 requiere Node ≥ 20.9); `nixpacks.toml` no fija Node ni ejecuta `prisma migrate deploy`. `@/*` apunta a la raíz del repo, lo que facilita confundir `@/email` con `@/lib/email`. Falta `autoprefixer` en PostCSS y los globs de Tailwind incluyen `./pages` inexistente.
- **Historia:** Como equipo quiero que cada PR se valide automáticamente de forma reproducible.
- **Criterios de aceptación:** [ ] Workflow de CI con typecheck, lint, unit, integración (Postgres de servicio) y chequeo de deriva de migraciones (ver AZ-049). [ ] `docker-compose` con Postgres y `.env.test.example`. [ ] `tsconfig` de test derivado del principal. [ ] La BD de test usa `migrate reset`/`deploy`. [ ] `engines`, nombre de paquete válido, Node fijo y paso de migración en el despliegue (según AZ-050). [ ] Alias claros para evitar `@/email` ambiguo.
- **Pruebas:** **CI:** el pipeline falla ante un test roto, un error de tipos o deriva del schema.
- **Dependencias:** AZ-050.

---

### 7.6 Tickets — 🟢 P3 (Kanban continuo)

---

#### AZ-090 · Primitivos del design system

- **Prioridad:** P3 · **Est.:** M · **Evidencia:** *Reportado (UXA-16, 17, 23, 32 a 35, FEA-4, 5, 6, 14, 16, 24, FST-31).* `Button` tiene variantes de tres épocas y ninguna coincide con el CTA real (se construyen a mano); el radio de los tamaños pisa el de las variantes `pill`; no hay prop `loading` ni `type='button'` por defecto. `Input` es `'use client'` y hace `useState` en todos los inputs (incluida la búsqueda del servidor) y el wrapper de contraseña cambia cómo se aplican `className` y `ref`. `TOAST_LIMIT = 1` reemplaza un toast con el siguiente, y la variante `default` es verde (parece éxito). `ThemeToggle` lee `theme` en lugar de `resolvedTheme`. Clases de Tailwind inexistentes (silenciosamente ignoradas): `shadow-xs`, `scrollbar-none`, `shadow-az-card`, `az-body-lg-bold`, `w-22`. Tokens sin uso en `tailwind.config.ts`.
- **Historia:** Como desarrollador quiero primitivos coherentes para no reconstruirlos en cada pantalla.
- **Criterios de aceptación:** [ ] Una variante CTA/pill con el token vigente, prop `loading` y `type='button'` por defecto; se eliminan las variantes sin uso. [ ] `PasswordInput` separado y `Input` sin `'use client'`. [ ] Cola de toasts (límite 3 a 5), variantes neutral/éxito/error y duración mayor para errores. [ ] `resolvedTheme` en el toggle. [ ] Las clases inexistentes se definen o reemplazan, con una regla de lint que las detecte. [ ] Tokens sin uso eliminados.
- **Pruebas:** **Unit (componente):** variantes y estados de `Button`/`Input`. **CI:** lint de clases de Tailwind inexistentes.
- **Dependencias:** AZ-046.

---

#### AZ-091 · Calidad de componentes de la tienda

- **Prioridad:** P3 · **Est.:** M · **Evidencia:** *Reportado (FEA-3, 8, 9, 10, 13, 17 a 21, 25 a 29, FEB-29 a 36, UXA-9 a 14, UXA-26 a 29).* `DualPrice` no propaga `className` al precio interno (un producto con precio MercadoPago se ve a 24 px y uno sin él a 14 px); `ProductAction` construye el `CartItem` dos veces y monta dos `AddToCart`; la barra fija móvil no tiene `safe-area-inset-bottom`; el "Total" es en realidad el precio unitario; `ProductCardData` está duplicado y `images[0]` sin protección; `PromoBannerCarousel` serializa la fila completa de Prisma; `PromoCodeInput` no revisa `response.ok`, renderiza `0` y muestra enums crudos; `Rating` define componentes dentro del render; contextos con `value` inline; etiquetas de métodos de pago repetidas en cuatro lugares (existe `PAYMENT_METHOD_LABELS` sin usar); `Pagination` es cliente con `router.push` en lugar de `Link`; el catálogo de paginación y la galería no tienen swipe ni zoom.
- **Historia:** Como desarrollador quiero componentes sin duplicación ni trampas.
- **Criterios de aceptación:** [ ] Un único `cartItem` y un único `AddToCart` responsivo. [ ] `className` propagado, un único `ProductCardData` y `images[0] ?? PLACEHOLDER`. [ ] DTOs con `Pick<>` hacia componentes cliente y `import type`. [ ] Manejo de `!res.ok` y valores `0` en `PromoCodeInput`. [ ] Una constante de etiquetas de pago usada en todo el proyecto. [ ] `Pagination` como componente de servidor con `Link` y `<nav aria-label>`. [ ] Componentes anidados movidos a nivel de módulo, `useMemo` en contextos.
- **Pruebas:** **Unit (componente):** casos límite de cada componente. **Manual:** barra móvil en un dispositivo con *notch*.
- **Dependencias:** AZ-041, AZ-045.

---

#### AZ-092 · Documentación desalineada con el código

- **Prioridad:** P3 · **Est.:** S · **Evidencia:** *Reportado (ARC-15, ARC-16).* `docs/01-ARQUITECTURA.md` y `docs/02`/`03` describen un `middleware.ts` inexistente, `email.actions.ts` y `promo.actions.ts` (los reales son `lib/email.ts` y `promo-code.actions.ts`), React Email como sistema de correo (producción usa strings), un campo `shippingStatus: Cancelado` que nadie define, un ajuste manual de stock que no existe, un enlace de recuperación `/cart/recover?token=` (el código usa `/cart-recovery/${token}`) y que `Product.rating` nunca se sincroniza (sí se sincroniza). El README sigue siendo el de la plantilla ProStore.
- **Historia:** Como persona nueva en el equipo quiero documentación que describa el sistema real.
- **Criterios de aceptación:** [ ] Cada afirmación de `docs/` verificada contra el código o corregida. [ ] README propio con instalación, variables de entorno, scripts y despliegue (según AZ-050). [ ] La documentación se actualiza en cada PR que cambie un contrato.
- **Pruebas:** **Manual:** una persona sin contexto levanta el proyecto siguiendo el README.
- **Dependencias:** AZ-050, AZ-055.

---

#### AZ-093 · Épica: migración arquitectónica incremental

- **Prioridad:** P3 · **Est.:** L (varias entregas) · **Evidencia:** *Reportado (ARC-2, 3, 4, 5, 7, 8, 10, 11, 12, 13).* `order.actions.ts` (1469 líneas) mezcla checkout, pagos, inventario, envío, revisión de transferencias, POS, notificaciones y analítica. Stock, precios y búsqueda de variantes se reimplementan 5 o 6 veces con distintas guardas; los métodos de pago son strings en cinco vocabularios; no hay capa anticorrupción para MercadoPago, Uploadthing ni Resend; la autorización tiene tres estilos sin política única.
- **Historia:** Como equipo quiero un dominio testeable y sin duplicación para que cada corrección se aplique una sola vez.
- **Criterios de aceptación (cada paso es entregable por separado y se planifica como ticket propio cuando corresponda):**
  - [ ] Paso 0: ADR-001 (AZ-050) y CI (AZ-089), con tests de caracterización de `createOrder`, `updateOrderToPaid` y el webhook.
  - [ ] Paso 1: frontera `server-only` (AZ-072).
  - [ ] Paso 2: módulo de configuración tipado (AZ-055).
  - [ ] Paso 3: primitivas de dominio (`PaymentMethod`/`Channel`, `OrderStatus` con `canTransition`, `Money`) (AZ-052, AZ-068).
  - [ ] Paso 4: `InventoryService` con reserva, confirmación y liberación atómicas (AZ-008, AZ-009, AZ-051).
  - [ ] Paso 5: `quote(cart, método, promo, banner, envío)` en el servidor, consumido por carrito, validate-promo, `createOrder`, MercadoPago y POS (AZ-001, AZ-027, AZ-028).
  - [ ] Paso 6: dividir `order.actions.ts` por casos de uso con las mismas acciones públicas (AZ-047).
  - [ ] Paso 7: puerto `PaymentGateway` con adaptador de MercadoPago y tabla `PaymentEvent` (AZ-052).
  - [ ] Paso 8: `Mailer` y outbox (AZ-070).
  - [ ] Paso 9: logger, tabla de auditoría, `error.tsx` y endpoint de salud (AZ-024).
  - [ ] Paso 10: `proxy.ts` y una matriz de capacidades por rol (AZ-007, AZ-029).
  - [ ] Paso 11: migraciones de FKs, índices y estados (AZ-067).
  - [ ] Paso 12: chrome estático con islas cliente, un único conjunto de tokens y carpetas por contexto (AZ-071, AZ-090).
- **Pruebas:** la suite de caracterización del Paso 0 debe seguir en verde en cada paso.
- **Dependencias:** AZ-050, AZ-087, AZ-089.

---

#### AZ-094 · ADRs restantes de arquitectura

- **Prioridad:** P3 · **Est.:** S · **Evidencia:** *Reportado (ARC, sección de decisiones).* Decisiones que el equipo humano debe tomar y registrar (el ADR-001 es AZ-050): estilo arquitectónico (hexagonal ligero o acciones como servicios más `server-only`); política de Server Actions (comandos delgados o rutas para operaciones admin); modelo del ciclo de vida de la orden y migración de datos históricos; política de stock con MercadoPago (reservar al crear o reembolso/backorden tras aprobación tardía); taxonomía de pagos (canal × medio) y dónde cabe el terminal POS; qué ve y hace un vendedor y si el rol se revalida contra la base; Decimal frente a centavos enteros y reglas de apilado de promociones, impuestos y envío; garantía de entrega de notificaciones (outbox, `after()` o cola); qué valores pueden vivir en la tabla `Setting` (el token de MercadoPago pertenece a variables de entorno o a un gestor de secretos); persistencia del carrito (`Json[]` o tabla `CartItem`); base de observabilidad; convención de componentes y mecanismo único de tematización.
- **Historia:** Como equipo quiero decisiones registradas para evitar rehacer trabajo.
- **Criterios de aceptación:** [ ] Un ADR corto por decisión en `docs/adr/`, con estado, contexto, decisión y consecuencias. [ ] Los tickets afectados se actualizan al aceptar cada ADR.
- **Pruebas:** **Manual:** revisión del equipo.

---

#### AZ-095 · Misceláneos de bajo riesgo

- **Prioridad:** P3 · **Est.:** M · **Evidencia:** *Reportado.* Agrupa hallazgos menores que no justifican ticket propio:
  - **FSB-24:** el campo `order` de los banners no se usa; `updatePromoCode` no permite borrar una ventana de vigencia; `discountPercent` y `commissionRate` son `Float` frente a `Decimal` en otros modelos; el código se mide antes de recortar espacios.
  - **FSB-27:** `prisma/prisma.json` ignorado, dos seeds divergentes (`db/seed.ts` y `prisma/seed.ts`), `scripts/*.js` sin referencias en `package.json`, `db/sample-data.ts` obsoleto y los seeds no crean las filas centinela ni los `Setting`.
  - **FSB-28/29/31:** el gráfico mensual agrupa en UTC y sin `ORDER BY`; migración `fix_banner_join_table_fk` con `DROP TABLE` sin copia de datos; `compare(undefined, hash)` lanza en `authorize`; `Number(paymentId)` puede ser `NaN` en el webhook; `updateSellerCommission` deja escapar `UnauthorizedError` como 500; `formatError(null)` lanza.
  - **NXT-23/24/25:** `remotePatterns` solo permite `utfs.io` (Uploadthing v7 usa `*.ufs.sh`); `analyze` con `@next/bundle-analyzer` solo sirve con webpack; HSTS con `preload` difícil de revertir; cuatro familias de fuentes en todas las rutas incluida `Bebas_Neue` sin uso; regex sin anclar en `authorized` (relevante al restaurar `proxy.ts`).
  - **FEA-31, UXA-35:** hack `!important` para clases de Uploadthing, `.az-hero-display` fijo en 64 px, `100vw` en `.full-bleed`, `scroll-padding-top` ausente.
- **Historia:** Como equipo queremos reducir ruido y riesgos latentes sin priorizarlos individualmente.
- **Criterios de aceptación:** [ ] Cada viñeta se reproduce o descarta, y se corrige o se convierte en ticket propio si resulta relevante. [ ] Los seeds se consolidan en uno solo. [ ] Los remote patterns incluyen `*.ufs.sh`.
- **Pruebas:** según cada ítem; la suite completa en verde antes de cerrar.

---

## 8. Limitaciones de esta planificación

- Los hallazgos provienen de **lectura estática**. Los revisores no tenían acceso a Bash, así que **no se ejecutaron** tests, typecheck, lint ni `bun audit`, y no se revisó el historial de git.
- Se verificaron manualmente solo los hallazgos marcados con ✔. El resto debe reproducirse antes de corregirse (Definition of Ready).
- Las estimaciones son preliminares y la capacidad del equipo es un dato pendiente.
- Las decisiones de producto abiertas (política del vendedor en AZ-007/AZ-029, reseñas en AZ-041, modo oscuro en AZ-038, sistema de diseño en AZ-046) deben resolverse en la planning antes de pasar esos tickets a `Listo`.
