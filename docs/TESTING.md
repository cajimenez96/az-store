# Guía de Verificación Funcional y Control de Calidad (Testing y QA)

Esta guía detalla las pruebas manuales y el plan de pruebas automatizadas para asegurar el correcto funcionamiento del e-commerce y el Punto de Venta (POS).

---

## 👥 Flujos de Prueba por Rol (Happy Paths)

### 🛍️ 1. Rol: Usuario (Cliente) — Tienda Online
1. **Navegación e Inventario:** Ingresa a la tienda. Filtra productos por marca y categoría. Selecciona talle en la página del producto y comprueba el stock disponible de la variante. Agrega al carrito.
2. **Registro y Checkout:** Avanza al checkout. Si eres nuevo, completa el registro. Verifica que el carrito se fusione correctamente tras iniciar sesión.
3. **Pago por Transferencia:**
   - Selecciona Transferencia Bancaria. Finaliza el pedido.
   - Comprueba que el stock físico de la variante en base de datos se decrementó de forma inmediata.
   - Sube un comprobante de transferencia y verifica que el estado de la orden cambie a "Esperando Aprobación".
4. **Pago por Mercado Pago:**
   - Crea un nuevo carrito. Selecciona Mercado Pago.
   - Comprueba en base de datos que el stock **no** se decrementa en este punto.
   - Realiza el pago usando tarjetas de sandbox. Tras la aprobación y redirección, verifica que el webhook IPN se ejecute, restando el stock físico de la variante y enviando la confirmación de compra por email.

---

### 🏪 2. Rol: Vendedor (Seller) — Operaciones de Local y POS
1. **Acceso Restringido:** Inicia sesión como `seller`. Verifica que en el menú del panel de administración `/admin` solo visualices las opciones: **POS (Venta)**, **Productos**, **Inventario** y **Pedidos**. Al intentar entrar a `/admin/users` o `/admin/categories` por URL, debes ser redirigido a `/unauthorized`.
2. **Operación en el POS (Venta Rápida):**
   - Accede a `/admin/pos`. Comprueba que el catálogo carga los productos ordenados alfabéticamente.
   - Filtra productos seleccionando categorías en la botonera superior y escribe en el buscador predictivo para validar el filtro al instante.
   - Haz clic en talles en stock para agregarlos. Talles agotados deben mostrarse inactivos y tachados.
3. **Búsqueda e Ingreso de Cliente:**
   - Busca un cliente registrado escribiendo su DNI o teléfono en la barra de búsqueda de clientes. Selecciona su perfil y comprueba que se completen de manera automática todos sus datos (incluyendo domicilio).
   - Registra un nuevo cliente haciendo clic en "Nuevo Cliente". Rellena los datos de DNI, teléfono y domicilio. Haz clic en "Guardar y Seleccionar" para vincularlo a la venta.
4. **Cierre de Venta:** Selecciona el método de pago "Efectivo" y haz clic en "Registrar Venta".
   - Verifica que aparezca el modal de éxito con el ID de orden y botón para imprimir.
   - En la base de datos, comprueba que la orden se creó marcada directamente como pagada, entregada y que el stock físico se restó de forma atómica.

---

### 👑 3. Rol: Administrador (Admin) — Control Total ERP
1. **Control de Dashboard:** Accede a `/admin/overview`. Verifica que las tarjetas de métricas coincidan con las órdenes reales de la base de datos.
2. **Alertas de Stock Crítico:** Modifica la base de datos para dejar una variante con stock <= 2. Comprueba que el contador de la campana en el header se incremente, y al hacer clic te dirija al listado de stock crítico.
3. **Moderación de Transferencias:** Ingresa a `/admin/orders`, abre una orden pendiente de transferencia. Inspecciona la miniatura del comprobante subido por el cliente.
   - **Aprobar:** Presiona "Aprobar Pago". Comprueba que el estado cambie a "Pagado" y no se descuente stock por segunda vez.
   - **Rechazar:** Presiona "Rechazar Pago". Comprueba que la orden se cancele y el stock reservado retorne a las variantes correspondientes de forma segura.

---

## 🛠️ Casos de Borde (Edge Cases) y Pruebas Críticas

| Caso a Probar | Cómo Probarlo | Resultado Esperado |
|---|---|---|
| **Colisión de DNI** | Intenta crear un cliente con un DNI que ya existe en la base de datos desde el POS. | Alerta controlada: "Ya existe un usuario registrado con este DNI". La transacción se aborta de forma segura. |
| **Expiración de Stock** | Genera una orden de transferencia. Cambia el campo `expiresAt` en la base de datos a hace 2 horas. Llama a `/api/cron/release-expired-orders`. | La orden cambia a cancelada y el stock se reintegra atómicamente a la variante. |
| **Doble Compra del Mismo Producto** | Agrega 2 unidades del mismo producto en talle M y 1 unidad en talle L al carrito POS. | La orden se crea con dos registros distintos en `OrderItem` diferenciados por el campo `size` sin provocar colisiones de clave primaria. |
| **Sobreventa Física** | Desde el POS, intenta agregar un talle cuya variante tiene stock 1. Luego incrementa la cantidad en el carrito a 2. | El sistema bloquea el incremento y lanza un Toast: "Stock máximo alcanzado". |

---

## 🧪 Pruebas Automatizadas

El proyecto tiene configurado **Jest** como motor de pruebas y **ts-jest** para soporte de TypeScript.

### 1. Ejecutar Tests Existentes
Para ejecutar el conjunto de pruebas unitarias configuradas en el proyecto:
```bash
bun run test # o npm run test
```

### 2. Tests Unitarios Existentes
Actualmente el proyecto cuenta con pruebas unitarias sobre:
- Validación de esquemas Zod (validación de campos de entrada).
- Funciones utilitarias de formateo de moneda y números.

### 3. Plan de Tests a Incorporar (Próximos Pasos)
Se recomienda expandir la suite agregando los siguientes tests críticos:

#### Tests de Integración en Server Actions (`tests/actions.test.ts`)
* **Test de `createPosOrder`:** Simular el registro de una venta física, verificando que se descuente el stock de la variante asociada en `ProductVariant` y la orden se guarde en `Order` marcada como pagada y entregada.
* **Test de Concurrencia de Stock:** Validar mediante simulación concurrente que múltiples compras del mismo talle en milisegundos respeten el stock total disponible sin producir inventarios negativos.

#### Tests E2E de Interfaz Visual (POS) con Playwright
* **Test de Flujo POS:** Levantar un navegador headless, ingresar al POS con rol de vendedor, filtrar por categoría, escribir en buscador de productos, seleccionar talle M, buscar un cliente por DNI, seleccionarlo, presionar "Registrar Venta" y validar que se despliegue el modal de éxito con el ID de la orden.
* **Test de Alta de Cliente:** Validar que al llenar el modal de registro de cliente y presionar guardar, se inserte en base de datos y se pre-cargue en la sección de caja sin necesidad de recargar la página.
