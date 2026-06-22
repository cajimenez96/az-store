# Pending bug — cache de productos en home

## Síntoma
Al eliminar todos los productos, la home sigue mostrándolos.

## Causa raíz
- `getLatestProducts` en `lib/actions/product.actions.ts` está envuelto en
  `unstable_cache` con `revalidate: 3600` (1h) y tag `'products'`.
- El delete de productos no llama a `revalidateTag('products')`, así que
  aunque la DB quede vacía, la respuesta cacheada sobrevive 1h.
- Además puede haber cache de Next.js a nivel de segmento (App Router + ISR)
  que también se queda con la versión vieja.

## Fix propuesto (pendiente de implementar)
1. En `deleteProduct` (y `createProduct`, `updateProduct`), agregar:
   `revalidateTag('products')` después de la mutación.
2. Considerar bajar el `revalidate` de `getLatestProducts` (ej. 60s) o
   cambiar a `revalidate: 0` si la home debe estar siempre fresca.
3. Auditar otros caches con `unstable_cache`:
   - `getFeaturedProducts` (mismo patrón).
   - Cualquier otro que pueda quedar stale.

## Decisión del usuario (12 jun 2026)
Dejarlo anotado, retomar después de Fase 2 (dual pricing).
