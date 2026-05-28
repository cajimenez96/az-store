# Guia de Verificacion Funcional y Control de Calidad

Esta guia detalla las pruebas manuales y el plan de pruebas automatizadas para asegurar el correcto funcionamiento del e-commerce y el Punto de Venta (POS).

---

## Estado Actual de Tests

**Sprint 1 completado (2026-05-25):** 37 tests / 6 suites, todos pasando. Los tests usan mocks de Prisma (sin DB real) — son rápidos y corren en CI sin infraestructura. Sprint 3 agrega tests de integración con DB real y E2E con Playwright.

```bash
npx jest --no-coverage   # → 37 passed, 0 failed
```

### Archivos de test actuales

| Archivo | Ticket | Tests | Qué cubre |
|---------|--------|-------|-----------|
| `__tests__/middleware/auth-config.test.ts` | AZ-001 | 7 | Role check en `/admin/*`, rutas protegidas, sessionCartId |
| `__tests__/cron/release-expired-orders.test.ts` | AZ-002 | 6 | CRON_SECRET obligatorio, POST-only, autenticación |
| `__tests__/actions/order-auth.test.ts` | AZ-003 | 8 | `approveBankTransfer` y `rejectBankTransfer` — roles user/seller/admin/null |
| `__tests__/webhooks/mercadopago.test.ts` | AZ-004 | 7 | Firma HMAC válida/inválida, headers ausentes, IPN y webhook format |
| `__tests__/actions/update-order-to-paid.test.ts` | AZ-005 | 4 | Guard atómico de stock, variante no encontrada, TransferenciaBancaria |
| `__tests__/actions/mp-idempotency.test.ts` | AZ-006 | 5 | mpPaymentId nuevo/duplicado, isPaid check, sin mpPaymentId (PayPal/COD) |

### Resumen

| Tipo | Estado |
|------|--------|
| Tests con mocks (Sprint 1) | 37 tests / 6 suites ✓ |
| Tests de integracion con DB real | Pendiente — Sprint 3 |
| Tests E2E (Playwright) | No configurado — Sprint 3 |
| QA manual documentado | Completo (ver abajo) |

### Notas de configuración Jest

- `query-string` v9+ es ESM-only. Requiere `jest.mock('query-string', ...)` en cada test que importe desde `lib/actions/`.
- Usar `jest.resetAllMocks()` en `beforeEach` (no `clearAllMocks`) para limpiar colas de `mockResolvedValueOnce` entre tests.
- `redirect()` de `next/navigation` dentro de `try/catch` es capturado — los tests verifican que fue llamado + el return value, no que la promesa rechaza.

---

## Estrategia de Base de Datos para Tests

Para tests de integracion que tocan Prisma y la base de datos, hay dos enfoques validos:

### Opcion A: Schema de test separado (recomendado para CI)
Crear una base de datos o schema dedicado para tests:
```env
# .env.test
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/az_store_test?schema=public"
```
El `globalSetup` de Jest corre migraciones sobre esta DB de test. El `globalTeardown` la limpia. Cada test suite puede hacer seed de los datos que necesita.

### Opcion B: Rollback por transaccion (recomendado para tests rapidos)
Cada test ejecuta dentro de una transaccion que se revierte en `afterEach`:
```typescript
let tx: PrismaClient

beforeEach(async () => {
  tx = await prisma.$transaction(async (prisma) => {
    // usar este prisma dentro del test
  }, { timeout: 10000 })
})

afterEach(async () => {
  await tx.$queryRaw`ROLLBACK`
})
```
Mas rapido, pero requiere pasar el cliente de transaction a todas las funciones bajo prueba.

---

## Prioridad de Tests (MVP 2 — Sprint 3)

En orden de riesgo descendente — los mas criticos van primero:

1. **Webhook MP — firma y stock:** Verificar firma valida e invalida, idempotencia (mismo paymentId), decremento de stock, imposibilidad de stock negativo.
2. **createPosOrder — flujo completo:** Venta exitosa, rollback por stock insuficiente, asociacion a "Consumidor Final".
3. **Transferencia bancaria — ciclo completo:** Crear orden, subir recibo, aprobar (stock no se decrementa dos veces), rechazar (stock se reintegra), expiracion por cron.
4. **Cron — release expired orders:** Libera ordenes vencidas de transferencia, restaura stock, no toca ordenes activas ni ordenes de MP.
5. **Autorizacion:** Admin puede, seller puede donde corresponde, user no puede, no autenticado no puede. Todos los guards de Server Actions.
6. **Cart merge en login:** Carrito anonimo se fusiona correctamente con el del usuario tras iniciar sesion.
7. **createOrder MP — sin reserva de stock:** La orden se crea con `isPaid: false` y el stock no cambia.
8. **calcPrice — logica de precios:** `shippingPrice` threshold, tax, totales.
9. **searchPosCustomers:** Busqueda parcial por nombre, email, DNI, telefono.
10. **createPosCustomer:** Colision de email y DNI controlada.

---

## Flujos de Prueba por Rol (QA Manual — Happy Paths)

### 1. Rol: Usuario (Cliente) — Tienda Online

1. **Navegacion e Inventario:** Ingresar a la tienda. Filtrar productos por marca y categoria. Seleccionar talle en la pagina del producto y comprobar el stock disponible de la variante. Agregar al carrito.
2. **Registro y Checkout:** Avanzar al checkout. Si es nuevo, completar el registro. Verificar que el carrito se fusione correctamente tras iniciar sesion.
3. **Pago por Transferencia:**
   - Seleccionar Transferencia Bancaria. Finalizar el pedido.
   - Comprobar que el stock fisico de la variante en base de datos se decremento de forma inmediata.
   - Subir un comprobante de transferencia y verificar que el estado de la orden cambie a "Esperando Aprobacion".
4. **Pago por Mercado Pago:**
   - Crear un nuevo carrito. Seleccionar Mercado Pago.
   - Comprobar en base de datos que el stock **no** se decrementa al crear la orden.
   - Realizar el pago usando tarjetas de sandbox. Tras la aprobacion y redireccion, verificar que el webhook IPN se ejecute, restando el stock fisico de la variante y enviando la confirmacion de compra por email.

---

### 2. Rol: Vendedor (Seller) — Operaciones de Local, POS y Gestión de Producto

#### 2.1 Autorizacion y Acceso

1. **Acceso al Panel Admin:** Iniciar sesion como `seller`. Verificar navegacion:
   - ✓ Dashboard (Overview)
   - ✓ POS (Venta Rapida)
   - ✓ Productos (crear/editar/eliminar)
   - ✓ Categorias (crear/editar/eliminar)
   - ✓ Marcas (crear/editar/eliminar)
   - ✓ Inventario (ver stock detallado)
   - ✓ Pedidos (ver, aprobar pagos, actualizar envios)
   - ✗ Usuarios (debe redirigir a `/unauthorized`)
   - ✗ Configuracion (debe redirigir a `/unauthorized`)

2. **Acceso por URL:** Intentar acceder directamente a rutas restringidas:
   - `/admin/users` → redirige a `/unauthorized`
   - `/admin/settings` → redirige a `/unauthorized`

#### 2.2 Gestion de Productos

1. **Ver Productos:** Acceder a `/admin/products`. 
   - Verificar que ve TODOS los productos (sin filtro por vendedor).
   - Productos creados por otros sellers deben ser visibles.

2. **Crear Producto Nuevo:**
   - Hacer clic en "Crear Producto".
   - Rellenar: nombre, descripcion, precio, categoria, subcategoria, marca, imagenes, talles/stock.
   - Presionar "Guardar".
   - **Verificar en BD:** La orden tiene `sellerId = {seller_id}` (no null como admin).
   - Volver a `/admin/products` — debe aparecer el nuevo producto en la lista.

3. **Editar Producto (creado por seller):**
   - Seleccionar un producto creado por el seller.
   - Editar descripcion, stock de talles.
   - Presionar "Actualizar".
   - **Verificar en BD:** Los cambios se persistieron.

4. **Eliminar Producto (creado por seller):**
   - Hacer clic en "Eliminar" en un producto del seller.
   - Confirmar eliminacion.
   - **Verificar:** El producto desaparece de la lista.
   - **Verificar en BD:** `Product` se elimino. Variantes asociadas tambien.

#### 2.3 Inventario

1. **Ver Inventario Detallado:** Acceder a `/admin/inventory`.
   - Verificar que ve TODOS los items de inventario (sin filtro por vendedor).
   - Items de otros sellers deben ser visibles.

2. **Filtrar por Categoria, Marca, Stock Critico:**
   - Usar los filtros. Stock critico (<=2) debe resaltarse en rojo.
   - Hacer clic en "Ver Producto" → debe ir a la pagina del producto.

#### 2.4 Operacion en el POS (Venta Rapida)

1. **Acceso POS:** Acceder a `/admin/pos`. Comprobar que el catalogo carga productos correctamente.
2. **Filtrado:** Seleccionar categorias en la botonera superior. Escribir en el buscador predictivo.
3. **Talles:** Hacer clic en talles en stock para agregarlos. Talles agotados deben mostrarse inactivos.
4. **Busqueda de Cliente:**
   - Buscar cliente registrado por DNI o telefono. Seleccionar y completar datos automaticamente.
   - Registrar nuevo cliente: rellenar DNI, telefono, domicilio. Guardar.
5. **Cierre de Venta:** Seleccionar "Efectivo". Presionar "Registrar Venta".
   - **Esperado:** Modal de exito con ID de orden.
   - **Verificar en BD:** Orden creada como pagada, entregada. Stock decrementado atomicamente.

#### 2.5 Gestion de Pedidos

1. **Ver Todos los Pedidos:** Acceder a `/admin/orders`.
   - Verificar que ve TODOS los pedidos (sin filtro por vendedor).
   - Pedidos de clientes que compraron de otros sellers deben ser visibles.

2. **Filtros:** Usar filtros por estado (Pendiente/Pagado/Entregado) y metodo de pago.

3. **Aprobar Pago (Transferencia Bancaria):**
   - Abrir una orden con estado "Comprobante Pendiente".
   - Ver el comprobante subido.
   - Presionar "Aprobar Pago".
   - **Esperado:** Estado cambia a "Pagado". No se descuenta stock por segunda vez.
   - **Email:** Debe llegar confirmacion al cliente.

4. **Rechazar Pago:**
   - Abrir una orden TB pendiente.
   - Presionar "Rechazar Pago".
   - **Esperado:** Orden se cancela. Stock reservado se reintegra.
   - **Email:** Debe llegar notificacion de rechazo al cliente.

5. **Actualizar Estado de Envio:**
   - Abrir una orden pagada.
   - En la seccion "Actualizar Estado de Envio", cambiar a "En Camino".
   - Agregar notas (ej: "Despachado por Andreani, guia 123456").
   - Presionar "Actualizar Envio".
   - **Esperado:** Estado se actualiza. Email se envia al cliente con notificacion.

6. **Marcar como Entregado:**
   - En una orden con estado "En Camino", presionar "Marcar como Entregado".
   - **Esperado:** Estado cambia a "Entregado". Email se envia al cliente.

#### 2.6 Visibilidad de Operaciones (Comparativa Admin vs Seller)

| Operacion | Admin | Seller | Cliente |
|-----------|-------|--------|---------|
| Ver Productos | ✓ Todos | ✓ Todos | ✓ Solo activos |
| Crear Producto | ✓ sellerId=null | ✓ sellerId={id} | ✗ |
| Editar Producto | ✓ | ✓ | ✗ |
| Eliminar Producto | ✓ | ✓ | ✗ |
| Ver Pedidos | ✓ Todos | ✓ Todos | ✓ Sus propios |
| Aprobar/Rechazar Pago TB | ✓ | ✓ | ✗ |
| Actualizar Envio | ✓ | ✓ | ✗ |
| Marcar Entregado | ✓ | ✓ | ✗ |
| Ver Usuarios | ✓ | ✗ | ✗ |
| Configuracion | ✓ | ✗ | ✗ |

---

### 3. Rol: Administrador (Admin) — Control Total ERP

1. **Control de Dashboard:** Acceder a `/admin/overview`. Verificar que las tarjetas de metricas coincidan con las ordenes reales de la base de datos.
2. **Alertas de Stock Critico:** Modificar la base de datos para dejar una variante con stock <= 2. Comprobar que el contador de la campana en el header se incremente.
3. **Moderacion de Transferencias:** Ingresar a `/admin/orders`, abrir una orden pendiente de transferencia.
   - **Aprobar:** Presionar "Aprobar Pago". Comprobar que el estado cambie a "Pagado" y que el stock NO se descuente por segunda vez.
   - **Rechazar:** Presionar "Rechazar Pago". Comprobar que la orden se cancele y el stock reservado retorne a las variantes correctamente.

---

## Tickets de Testing para QA (Importables a Linear/Trello)

Cada ticket representa una prueba completa e independiente. El QA puede crearlos como epicas o issues en su tablero.

### SUITE 1: Autorizacion y Acceso por Rol

#### QA-1.1: Acceso Admin Panel — Restriccion por Rol

**Objetivo:** Verificar que cada rol accede correctamente al panel admin segun permisos.

**Setup:** Crear 3 usuarios: 1 admin, 1 seller, 1 cliente regular.

**Pasos:**
1. Login como admin. Navegar a `/admin`.
   - Resultado esperado: Acceso permitido. Ver todos los menu items (Dashboard, POS, Productos, Categorias, Marcas, Inventario, Pedidos, Usuarios, Configuracion).

2. Login como seller. Navegar a `/admin`.
   - Resultado esperado: Acceso permitido. Menu items visibles: Dashboard, POS, Productos, Categorias, Marcas, Inventario, Pedidos.
   - Usuarios y Configuracion NO deben aparecer.

3. Login como cliente. Navegar a `/admin`.
   - Resultado esperado: Redirige a homepage o `/unauthorized`.

4. Sin login. Navegar a `/admin`.
   - Resultado esperado: Redirige a `/sign-in`.

**Verificacion:** ✓ Cada rol ve exactamente sus opciones permitidas.

---

#### QA-1.2: Rutas Protegidas — Admin Only

**Objetivo:** Verificar que rutas restringidas bloquean sellers y clientes.

**Pasos:**
1. Login como seller. Intentar navegar a `/admin/users`.
   - Resultado esperado: Redirige a `/unauthorized`.

2. Login como seller. Intentar navegar a `/admin/settings`.
   - Resultado esperado: Redirige a `/unauthorized`.

3. Login como cliente. Intentar navegar a `/admin/products`.
   - Resultado esperado: Redirige a `/sign-in` o `/unauthorized`.

**Verificacion:** ✓ Rutas protegidas bloquean a usuarios no autorizados.

---

### SUITE 2: Productos — Crear, Ver, Editar, Eliminar

#### QA-2.1: Admin Crea Producto (sellerId = null)

**Objetivo:** Verificar que admin puede crear productos sin asignacion de vendedor.

**Pasos:**
1. Login como admin. Navegar a `/admin/products/create`.
2. Rellenar formulario:
   - Nombre: "Remera Adidas Azul"
   - Descripcion: "Remera para hombre"
   - Precio: $45.99
   - Categoria: "Ropa"
   - Marca: "Adidas"
   - Imagenes: subir 2 imagenes
   - Talles/Stock: M (5), L (3), XL (2)
3. Presionar "Guardar Producto".
   - Resultado esperado: Redirige a `/admin/products`. Producto aparece en lista.

4. **Verificacion en BD:**
   ```sql
   SELECT id, name, sellerId FROM "Product" WHERE name = 'Remera Adidas Azul';
   ```
   - sellerId DEBE ser NULL.

**Verificacion:** ✓ Admin crea producto sin seller asignado.

---

#### QA-2.2: Seller Crea Producto (sellerId = {id})

**Objetivo:** Verificar que seller puede crear productos con su ID asignado.

**Pasos:**
1. Obtener ID del seller en BD:
   ```sql
   SELECT id FROM "User" WHERE email = 'seller@test.com' AND role = 'seller';
   ```
   (Asumir result: `seller_id = 12345`)

2. Login como seller (`seller@test.com`). Navegar a `/admin/products/create`.
3. Rellenar formulario:
   - Nombre: "Pantalon Levi's Negro"
   - Descripcion: "Pantalon vaquero"
   - Precio: $79.99
   - Categoria: "Ropa"
   - Marca: "Levis"
   - Talles/Stock: 28 (4), 30 (6), 32 (5)
4. Presionar "Guardar Producto".
   - Resultado esperado: Redirige a `/admin/products`. Producto aparece.

5. **Verificacion en BD:**
   ```sql
   SELECT id, name, sellerId FROM "Product" WHERE name = 'Pantalon Levi''s Negro';
   ```
   - sellerId DEBE ser `12345` (ID del seller).

**Verificacion:** ✓ Seller crea producto con su ID asignado.

---

#### QA-2.3: Seller Ve Todos los Productos (Sin Filtro)

**Objetivo:** Verificar que seller ve TODOS los productos, no solo los suyos.

**Setup:**
- Crear 2 sellers: seller_A (id=100) y seller_B (id=101).
- Admin crea producto: "Producto Admin" (sellerId=null).
- seller_A crea producto: "Producto de Seller A" (sellerId=100).
- seller_B crea producto: "Producto de Seller B" (sellerId=101).

**Pasos:**
1. Login como seller_A. Navegar a `/admin/products`.
   - Resultado esperado: Ve 3 productos en la lista:
     - "Producto Admin"
     - "Producto de Seller A"
     - "Producto de Seller B"

**Verificacion:** ✓ Seller ve todos los productos sin filtro.

---

#### QA-2.4: Seller Edita su Producto

**Objetivo:** Verificar que seller puede editar su propio producto.

**Setup:** seller_A tiene producto "Producto de Seller A" en BD.

**Pasos:**
1. Login como seller_A. Navegar a `/admin/products`.
2. Hacer clic en "Producto de Seller A".
3. Cambiar:
   - Descripcion: "Nuevo texto descriptivo"
   - Stock M: 5 → 8
4. Presionar "Actualizar".
   - Resultado esperado: Cambios se guardan. Vuelve a lista de productos.

5. **Verificacion en BD:**
   ```sql
   SELECT description FROM "Product" WHERE id = <product_id>;
   SELECT stock FROM "ProductVariant" WHERE productId = <product_id> AND sizeId = (SELECT id FROM "Size" WHERE name = 'M');
   ```
   - Cambios deben estar persistidos.

**Verificacion:** ✓ Seller edita su producto exitosamente.

---

#### QA-2.5: Seller Elimina su Producto

**Objetivo:** Verificar que seller puede eliminar su propio producto (sin restriccion de propiedad).

**Setup:** seller_A tiene producto "Producto Temporal" en BD.

**Pasos:**
1. Login como seller_A. Navegar a `/admin/products`.
2. Hacer clic en "Producto Temporal".
3. Presionar "Eliminar".
4. Confirmar dialogo.
   - Resultado esperado: Producto desaparece de lista.

5. **Verificacion en BD:**
   ```sql
   SELECT COUNT(*) FROM "Product" WHERE name = 'Producto Temporal';
   ```
   - COUNT debe ser 0.

6. **Verificacion de cascade:** Las variantes asociadas tambien deben eliminarse.
   ```sql
   SELECT COUNT(*) FROM "ProductVariant" WHERE productId = <deleted_product_id>;
   ```
   - COUNT debe ser 0.

**Verificacion:** ✓ Seller elimina producto con cascade de variantes.

---

### SUITE 3: Inventario

#### QA-3.1: Seller Ve Todos los Items de Inventario (Sin Filtro)

**Objetivo:** Verificar que seller ve todo el inventario sin filtro por vendedor.

**Setup:**
- Admin crea producto con 3 talle/variantes.
- seller_A crea producto con 2 talle/variantes.
- seller_B crea producto con 1 talle/variante.

**Pasos:**
1. Login como seller_A. Navegar a `/admin/inventory`.
   - Resultado esperado: Ve TODOS los items (6 variantes totales), sin filtro.

**Verificacion:** ✓ Seller ve inventario completo.

---

#### QA-3.2: Filtros de Inventario

**Objetivo:** Verificar que filtros funcionan correctamente.

**Pasos:**
1. Login como seller. Navegar a `/admin/inventory`.
2. Filtrar por Categoria = "Ropa".
   - Resultado esperado: Solo variantes de productos en categoria "Ropa".
3. Filtrar por Stock Critico (<=2).
   - Resultado esperado: Solo variantes con stock <= 2 resaltadas en rojo.
4. Filtrar por Marca = "Adidas".
   - Resultado esperado: Solo variantes de marca "Adidas".

**Verificacion:** ✓ Filtros funcionan independientemente.

---

### SUITE 4: POS (Venta Rapida)

#### QA-4.1: Seller Opera POS — Venta Completa

**Objetivo:** Verificar flujo completo de venta POS: catalogo, cliente, cierre.

**Setup:**
- Crear cliente en BD: nombre="Juan", DNI="12345678", telefono="1123456789", email="juan@test.com".
- Crear producto con stock: Talle M=10, Talle L=5.

**Pasos:**
1. Login como seller. Navegar a `/admin/pos`.
   - Resultado esperado: Catalogo carga productos.

2. Buscar y agregar producto: "Remera Azul" Talle M, Cantidad 2.
   - Resultado esperado: Aparece en carrito con subtotal $91.98 (si precio=$45.99).

3. Buscar cliente: "Juan" por DNI "12345678".
   - Resultado esperado: Perfil carga con email, telefono, domicilio.

4. Seleccionar metodo de pago: "Efectivo".

5. Presionar "Registrar Venta".
   - Resultado esperado: Modal de exito con orden ID.

6. **Verificacion en BD:**
   ```sql
   SELECT id, isPaid, isDelivered, user_id FROM "Order" WHERE id = <order_id>;
   SELECT stock FROM "ProductVariant" WHERE productId = <product_id> AND sizeId = (SELECT id FROM "Size" WHERE name = 'M');
   ```
   - `isPaid` debe ser `true`.
   - `isDelivered` debe ser `true`.
   - Stock debe ser 8 (10 - 2).

**Verificacion:** ✓ POS venta completa: pago, entrega, stock decrementado.

---

### SUITE 5: Pedidos — Aprobar, Rechazar, Actualizar Envio

#### QA-5.1: Seller Aprueba Pago de Transferencia Bancaria

**Objetivo:** Verificar que seller puede aprobar pagos TB sin decrementar stock dos veces.

**Setup:**
- Cliente crea orden TB: 2x "Remera" (stock actual=5, reservado=3 tras orden).
- Sube comprobante de transferencia.
- Orden estado: "Comprobante Pendiente".

**Pasos:**
1. Login como seller. Navegar a `/admin/orders`.
2. Filtrar por estado "Comprobante Pendiente".
3. Hacer clic en orden. Ver panel de comprobante (imagen/PDF).
4. Presionar "Aprobar Pago".
   - Resultado esperado: Dialogo de confirmacion → "Pago aprobado".
   - Estado cambia a "Pagado".

5. **Verificacion en BD:**
   ```sql
   SELECT isPaid, paidAt FROM "Order" WHERE id = <order_id>;
   SELECT stock FROM "ProductVariant" WHERE productId = <product_id> AND sizeId = (SELECT id FROM "Size" WHERE name = 'M');
   ```
   - `isPaid` debe ser `true`.
   - Stock debe ser 3 (decrementado una sola vez en createOrder, no nuevamente en approve).

6. **Verificacion de Email:** Email debe llegar al cliente con "¡Transferencia aprobada!".

**Verificacion:** ✓ Seller aprueba pago sin doble decremento de stock.

---

#### QA-5.2: Seller Rechaza Pago de Transferencia Bancaria

**Objetivo:** Verificar que seller puede rechazar pagos y reintegrar stock.

**Setup:**
- Cliente crea orden TB: 1x "Pantalon Levi's" (stock actual=6, reservado=5 tras orden).
- Sube comprobante.
- Orden estado: "Comprobante Pendiente".

**Pasos:**
1. Login como seller. Navegar a `/admin/orders`.
2. Hacer clic en orden con comprobante pendiente.
3. Presionar "Rechazar Pago".
4. (Opcional) Ingresar razon de rechazo en modal.
5. Presionar "Confirmar Rechazo".
   - Resultado esperado: Orden estado cambia a "Cancelado".
   - Stock se reintegra.

6. **Verificacion en BD:**
   ```sql
   SELECT isPaid, status FROM "Order" WHERE id = <order_id>;
   SELECT stock FROM "ProductVariant" WHERE productId = <product_id> AND sizeId = (SELECT id FROM "Size" WHERE name = '30');
   ```
   - `isPaid` debe ser `false`.
   - `status` debe ser "Cancelado".
   - Stock debe ser 6 (reintegrado).

7. **Verificacion de Email:** Email debe llegar al cliente con "Transferencia rechazada".

**Verificacion:** ✓ Seller rechaza pago con reintegracion de stock.

---

#### QA-5.3: Seller Actualiza Estado de Envio

**Objetivo:** Verificar que seller puede actualizar shipping status y enviar emails.

**Setup:**
- Orden pagada en BD con status "Pendiente".

**Pasos:**
1. Login como seller. Navegar a `/admin/orders`.
2. Hacer clic en orden pagada.
3. Scroll a "Actualizar Estado de Envio".
4. Cambiar estado a "En Camino".
5. Agregar notas: "Despachado por Andreani, guia ABC-123456".
6. Presionar "Actualizar Envio".
   - Resultado esperado: Seccion se actualiza con nuevo status y notas.

7. **Verificacion en BD:**
   ```sql
   SELECT shippingStatus, shippingNotes FROM "Order" WHERE id = <order_id>;
   ```
   - `shippingStatus` debe ser "En Camino".
   - `shippingNotes` debe contener "Andreani".

8. **Verificacion de Email:** Email debe llegar al cliente con "Tu orden está en camino".

**Verificacion:** ✓ Seller actualiza envio con notificacion.

---

#### QA-5.4: Seller Marca Orden como Entregada

**Objetivo:** Verificar que seller puede marcar orden como entregada.

**Setup:**
- Orden con status "En Camino".

**Pasos:**
1. Login como seller. Navegar a `/admin/orders`.
2. Hacer clic en orden "En Camino".
3. Presionar "Marcar como Entregado".
   - Resultado esperado: Dialogo de confirmacion. Orden cambia a "Entregado".

4. **Verificacion en BD:**
   ```sql
   SELECT isDelivered, deliveredAt, shippingStatus FROM "Order" WHERE id = <order_id>;
   ```
   - `isDelivered` debe ser `true`.
   - `deliveredAt` debe tener timestamp.
   - `shippingStatus` debe ser "Entregado".

5. **Verificacion de Email:** Email debe llegar al cliente con "¡Orden entregada!".

**Verificacion:** ✓ Seller marca como entregado con email.

---

#### QA-5.5: Seller Ve Todos los Pedidos (Sin Filtro)

**Objetivo:** Verificar que seller ve TODOS los pedidos sin filtro por vendedor.

**Setup:**
- Admin crea orden #1 (cliente compra producto admin).
- seller_A crea orden via POS #2 (cliente compra producto seller_A).
- seller_B crea orden via POS #3 (cliente compra producto seller_B).
- Cliente crea orden online #4 (compra de varios productos).

**Pasos:**
1. Login como seller_A. Navegar a `/admin/orders`.
   - Resultado esperado: Ve 4 ordenes en lista (no filtrado por seller).

**Verificacion:** ✓ Seller ve todos los pedidos.

---

### SUITE 6: Usuario (Cliente) — Flujo de Compra

#### QA-6.1: Cliente Compra por Transferencia Bancaria

**Objetivo:** Verificar flujo completo de compra TB: carrito, checkout, stock, email, aprobacion.

**Setup:** Producto "Remera Azul" con stock M=5, L=3.

**Pasos:**
1. Sin login. Navegar a tienda.
2. Buscar "Remera Azul". Hacer clic.
3. Seleccionar Talle M. Agregaral carrito.
4. Ir a checkout.
5. Registro (o login si ya existe):
   - Email: "cliente@test.com"
   - Nombre: "Cliente Test"
   - Contraseña: "test123456"
6. Completar direccion de envio.
7. Seleccionar "Transferencia Bancaria".
8. Presionar "Finalizar Compra".
   - Resultado esperado: Redirige a `/order/[id]` con datos bancarios visibles.

9. **Verificacion en BD (inmediato):**
   ```sql
   SELECT stock FROM "ProductVariant" WHERE productId = <product_id> AND sizeId = (SELECT id FROM "Size" WHERE name = 'M');
   ```
   - Stock debe ser 4 (5 - 1, decrementado inmediatamente).

10. **Verificacion de Email (E1):**
    - Email debe llegar a cliente@test.com con:
      - "¡Gracias por tu compra!"
      - Orden ID, monto, detalles
      - Datos bancarios (Banco, CBU, CUIT, Titular)

11. Cliente sube comprobante en `/order/[id]`.
    - Resultado esperado: Modal de confirmacion.

12. **Verificacion en BD:**
    ```sql
    SELECT receiptUrl FROM "Order" WHERE id = <order_id>;
    ```
    - `receiptUrl` debe tener URL/path.

13. **Verificacion de Email (E2):**
    - Email debe llegar a admin@test.com con:
      - "Comprobante de transferencia subido"
      - Link "Ver orden"

14. Login como admin. Navegar a `/admin/orders`.
15. Hacer clic en orden. Presionar "Aprobar Pago".
    - Resultado esperado: Estado cambia a "Pagado".

16. **Verificacion de Email (E3):**
    - Email debe llegar a cliente@test.com con "¡Transferencia aprobada!".

**Verificacion:** ✓ Flujo TB completo con emails en cada etapa.

---

#### QA-6.2: Cliente Compra por Mercado Pago

**Objetivo:** Verificar que stock NO se decrementa en createOrder (solo en webhook).

**Setup:** Producto con stock M=10.

**Pasos:**
1. Cliente crea carrito, selecciona Mercado Pago, presiona "Finalizar".
   - Resultado esperado: Redirige a MP sandbox.

2. **Verificacion en BD (antes de pago):**
   ```sql
   SELECT isPaid, stock FROM "Order" o JOIN "ProductVariant" pv ON ... WHERE o.id = <order_id>;
   ```
   - `isPaid` debe ser `false`.
   - Stock debe ser 10 (sin decrementar).

3. Realizar pago en MP sandbox.
   - Resultado esperado: Redirige a `/order/[id]` con estado "Pagado".

4. **Verificacion en BD (despues de webhook):**
   ```sql
   SELECT isPaid, stock FROM ... WHERE o.id = <order_id>;
   ```
   - `isPaid` debe ser `true`.
   - Stock debe ser 9 (decrementado por webhook).

5. **Verificacion de Email (E1 luego E5 via webhook):**
    - Email de confirmacion debe llegar al cliente.

**Verificacion:** ✓ MP: stock reserved en webhook, no en createOrder.

---

## Casos de Borde (Edge Cases) y Pruebas Criticas

| Caso a Probar | Como Probarlo | Resultado Esperado |
|---|---|---|
| Colision de DNI | Intentar crear un cliente con un DNI que ya existe en la base de datos desde el POS. | Error controlado: "Ya existe un usuario registrado con este DNI". Transaccion abortada. |
| Expiracion de Stock | Generar una orden de transferencia. Cambiar `expiresAt` en la base de datos a hace 2 horas. Llamar a `/api/cron/release-expired-orders`. | La orden cambia a cancelada y el stock se reintegra atomicamente. |
| Doble Compra del Mismo Producto | Agregar 2 unidades del mismo producto en talle M y 1 unidad en talle L al carrito POS. | La orden se crea con dos registros distintos en `OrderItem` sin colisiones de clave primaria. |
| Sobreventa Fisica en POS | Desde el POS, intentar agregar un talle con stock 1 e incrementar cantidad a 2. | El sistema bloquea el incremento con aviso "Stock maximo alcanzado". |
| Stock negativo via webhook MP | [No testeable manualmente con facilidad] Requiere test de integracion con dos webhooks concurrentes. | Con guard atomico implementado (MVP 2): el segundo webhook falla gracefully. Sin guard (estado actual): stock puede quedar negativo. |

---

## Configuracion de Tests Automatizados (Plan MVP 2)

### Setup inicial
```bash
# Crear archivo de entorno de tests
cp .env .env.test
# Editar DATABASE_URL_TEST para apuntar a la base de datos de tests

# Instalar Playwright (cuando se implemente)
bun add -D @playwright/test
npx playwright install
```

### Estructura de archivos propuesta
```
tests/
├── integration/
│   ├── webhook-mercadopago.test.ts
│   ├── create-pos-order.test.ts
│   ├── bank-transfer.test.ts
│   ├── cron-release-orders.test.ts
│   ├── authorization.test.ts
│   └── cart-merge.test.ts
├── e2e/
│   ├── checkout-mp.spec.ts
│   ├── pos-sale.spec.ts
│   └── admin-approve-transfer.spec.ts
└── fixtures/
    ├── user.factory.ts
    ├── product.factory.ts
    └── order.factory.ts
```

### Ejecutar tests
```bash
# Tests unitarios e integracion
bun run test

# Tests E2E (una vez configurado Playwright)
bun run test:e2e
```

---

## Email Testing (Sprint 5.3)

### Estados de Email

La implementación de emails transaccionales cubre 8 escenarios:

| ID | Tipo | Trigger | Destinatario | Estado |
|----|------|---------|--------------|--------|
| E1 | order-confirmation | Orden creada (TB) | Cliente | ✓ Enviado en createOrder() |
| E2 | receipt-uploaded | Comprobante subido | Admin | ✓ Enviado en updateOrderReceipt() |
| E3 | transfer-approved | Transferencia aprobada | Cliente | ✓ Enviado en approveBankTransfer() |
| E4 | transfer-rejected | Transferencia rechazada | Cliente | ✓ Enviado en rejectBankTransfer() |
| E5 | order-confirmation | Orden creada (MP) | Cliente | ✓ Enviado en createOrder() |
| E6 | shipping-update | Estado enviado/entregado | Cliente | ✓ Enviado en updateShippingStatus() |
| E7 | password-reset | Usuario solicita reset | Usuario | ✓ Enviado en requestPasswordReset() |
| E8 | MP webhook | Pago aprobado | Cliente | ⏳ Pendiente integración webhook MP |

### Testing Manual de Emails

#### Prerequisitos
- Resend API key configurado en `.env` (`RESEND_API_KEY`)
- `SENDER_EMAIL` configurado (default: `onboarding@resend.dev` para testing)
- `NEXT_PUBLIC_SERVER_URL` apunta a `http://localhost:3000`

#### Test Cases

**TC-E1: Confirmación de Orden — Transferencia Bancaria**
1. Iniciar sesión como usuario. Agregar producto al carrito.
2. Checkout: ingresar dirección, seleccionar **Transferencia Bancaria**.
3. Finalizar orden.
4. **Esperado:** Email llega a la dirección del usuario con:
   - "¡Gracias por tu compra!"
   - Detalles de orden (orden ID, monto)
   - Datos bancarios (Banco, CBU, Alias, CUIT, Titular)
   - Link "Ver detalles de la orden"

**TC-E2: Comprobante de Transferencia Subido**
1. Usuario (desde TC-E1) abre su orden.
2. Sube un comprobante de transferencia (imagen/PDF).
3. **Esperado:** Email llega a `ADMIN_EMAIL` con:
   - "Comprobante de transferencia subido"
   - Orden ID, monto, estado "Comprobante pendiente de aprobación"
   - Link "Ver orden"

**TC-E3: Transferencia Aprobada**
1. Admin abre `/admin/orders`, localiza la orden de TC-E2.
2. Presiona "Aprobar Pago".
3. **Esperado:** Email llega al cliente con:
   - "¡Transferencia aprobada!"
   - Orden ID, monto, estado "Pagado"
   - Badge verde
   - Link "Ver orden"

**TC-E4: Transferencia Rechazada**
1. Admin abre una orden TB pendiente.
2. Presiona "Rechazar Pago" (o ingresa razón personalizada).
3. **Esperado:** Email llega al cliente con:
   - "Transferencia rechazada"
   - Orden ID, monto, estado "Rechazado"
   - Opciones: Reintentar, cambiar método, cancelar
   - Badge rojo

**TC-E5: Confirmación de Orden — Mercado Pago**
1. Iniciar sesión como usuario. Agregar producto al carrito.
2. Checkout: seleccionar **Mercado Pago**.
3. Finalizar orden (aún no paga).
4. **Esperado:** Email llega con detalles de orden (sin datos bancarios, diferente a TB).
5. Completar pago en MP sandbox.
6. **Esperado:** Segundo email llega tras webhook aprobado (verificar en Resend dashboard).

**TC-E6: Actualización de Envío**
1. Admin abre `/admin/orders`, selecciona una orden pagada.
2. Actualiza `Shipping Status` a "Enviado" (o "En tránsito", "Entregado").
3. **Esperado:** Email llega al cliente con:
   - Estado ("Tu orden está en camino" o "¡Orden entregada!")
   - Badge con color según estado
   - Número de seguimiento (si se completa)
   - Entrega estimada (si se completa)

**TC-E7: Recuperación de Contraseña**
1. Ir a `/sign-in`, presionar "¿Olvidaste?".
2. Ingresar email registrado.
3. **Esperado:**
   - Página muestra "Email enviado"
   - Email llega con:
     - "Restablece tu contraseña"
     - Botón "Restablecer contraseña" + link copiable
     - Aviso: "Link válido por 1 hora"
4. Hacer clic en el link.
5. **Esperado:** Página `/reset-password?token=<uuid>` carga.
   - Si token válido: formulario de nueva contraseña
   - Si token inválido/expirado: "Link inválido. Solicita uno nuevo."
6. Ingresar contraseña nueva (≥6 caracteres), confirmar.
7. **Esperado:** "Contraseña restablecida. Redireccionando a inicio de sesión..."
8. Iniciar sesión con nueva contraseña — debe funcionar.

### Email API Testing (Desarrollo)

Para verificar que `/api/send-email` funciona sin Resend (desarrollo local):

```bash
# Enviar email test
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "password-reset",
    "email": "test@example.com",
    "resetLink": "http://localhost:3000/reset-password?token=test-token-123"
  }'

# Respuesta esperada
{
  "success": true,
  "data": { "id": "email-id-from-resend" }
}
```

### Validación en Resend Dashboard

1. Ir a [https://resend.com](https://resend.com), iniciar sesión.
2. Navegar a "Emails" en el dashboard.
3. Verificar que cada email testeado aparezca:
   - Filtrar por dirección de destino
   - Confirmar subject y contenido HTML
   - Estado: "Delivered" o "Opened"

### Consideraciones para QA

- **Resend limits:** El plan gratuito tiene cuota de 100 emails/día en modo test. Para producción, usar API key de producción.
- **Email delay:** Resend entrega en < 30 segundos normalmente. Si no llega, verificar:
  1. Email en spam/basura
  2. Dirección correcta en DB
  3. Logs en `/api/send-email` (console.error)
  4. RESEND_API_KEY válido en `.env`
- **Token TTL:** PasswordResetToken expira en 1 hora. Test rapido si el timing es crítico.
- **Idempotencia:** Renovar un reset antes de expirar elimina el token anterior (solo hay uno activo por email).
