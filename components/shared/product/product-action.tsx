'use client';

import { useState } from 'react';
import AddToCart from './add-to-cart';
import { Cart, Product, ProductColor, ProductVariant } from '@/types';
import { cn } from '@/lib/utils';
import { extractDualPrice } from '@/lib/duo-pricing';

type ProductWithVariants = Omit<Product, 'variants' | 'colors'> & {
  variants: ProductVariant[];
  colors: ProductColor[];
  prices?: { paymentMethod: string; value: string }[];
};

export default function ProductAction({
  product,
  cart,
  selectedColorId: selectedColorIdProp,
  onSelectColor: onSelectColorProp,
}: {
  product: ProductWithVariants;
  cart: Cart | undefined;
  selectedColorId?: string | null;
  onSelectColor?: (id: string) => void;
}) {
  // Si no vienen las props, el componente maneja su propio state (modo standalone)
  const [internalColorId, setInternalColorId] = useState<string | null>(
    product.colors[0]?.id ?? null
  );
  const selectedColorId =
    selectedColorIdProp !== undefined ? selectedColorIdProp : internalColorId;
  const handleSelectColor = (id: string) => {
    if (onSelectColorProp) onSelectColorProp(id);
    else setInternalColorId(id);
  };

  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const selectedColor = product.colors.find((c) => c.id === selectedColorId);

  // Variantes del color seleccionado (o todas si el producto no tiene colores)
  const variantsForColor = product.variants?.filter((v) => {
    if (product.colors.length > 0) {
      return v.productColor?.id === selectedColorId;
    }
    return true;
  }) || [];

  const availableVariants = variantsForColor.filter((v) => v.stock > 0);
  const allVariants = variantsForColor;
  const hasStock = availableVariants.length > 0;
  const currentVariant = selectedSize
    ? allVariants.find((v) => v.size?.name === selectedSize)
    : null;

  // Fase 2: precio dual. Mostramos efectivo/transferencia destacado
  // y MP al lado.
  const { priceCash, priceMercadoPago } = extractDualPrice(product);
  const cashNum = Number(priceCash);
  const mpNum = Number(priceMercadoPago);
  const formattedCash = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(cashNum);
  const formattedMp = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(mpNum);
  const showDual = mpNum > 0 && mpNum !== cashNum;

  // Imagen del color elegido (si hay) o fallback a la imagen del producto
  const currentImage = selectedColor?.images?.[0] ?? product.images?.[0];

  return (
    <>
      <div className='flex flex-col gap-6 w-full'>
        {/* Color selector (solo si el producto tiene colores) */}
        {product.colors.length > 0 && (
          <div className='space-y-3'>
            <p className='az-caption-bold text-az-steel uppercase tracking-widest'>
              Color: {selectedColor?.color?.name}
            </p>
            <div className='flex flex-wrap gap-2'>
              {product.colors.map((pc) => {
                const isSelected = selectedColorId === pc.id;
                return (
                    <button
                      key={pc.id}
                      type='button'
                      onClick={() => {
                        handleSelectColor(pc.id);
                        setSelectedSize(null); // reset talle al cambiar color
                      }}
                    className={cn(
                      'w-9 h-9 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-az-ink-deep scale-110'
                        : 'border-az-hairline hover:border-az-ink-deep/50'
                    )}
                    style={{ backgroundColor: pc.color?.hex ?? '#cccccc' }}
                    title={pc.color?.name}
                    aria-label={pc.color?.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Size selector */}
        {allVariants.length > 0 && (
          <div className='space-y-3'>
            <p className='az-caption-bold text-az-steel uppercase tracking-widest'>Talles</p>
            <div className='flex flex-wrap gap-2'>
              {allVariants.map((v) => {
                const inStock = v.stock > 0;
                const isSelected = selectedSize === v.size?.name;
                return (
                  <button
                    key={v.id}
                    type='button'
                    disabled={!inStock}
                    onClick={() => inStock && v.size && setSelectedSize(v.size.name)}
                    className={cn(
                      'min-w-[3rem] px-4 py-2 rounded-az-full border-2 az-button-md transition-colors duration-150',
                      isSelected
                        ? 'bg-az-ink-deep text-white border-az-ink-deep'
                        : inStock
                        ? 'bg-az-canvas text-az-ink-deep border-az-hairline hover:border-az-ink-deep'
                        : 'bg-az-canvas text-az-disabled-text border-az-hairline cursor-not-allowed line-through'
                    )}
                  >
                    {v.size?.name ?? '—'}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock status */}
        <div className='flex items-center gap-3'>
          {currentVariant ? (
            currentVariant.stock > 0 ? (
              <>
                <span className='inline-flex items-center gap-1.5 az-caption-bold bg-az-success/10 text-az-success px-3 py-1 rounded-az-full'>
                  <span className='w-1.5 h-1.5 rounded-full bg-az-success'></span>
                  En stock
                </span>
                <span className='az-body-sm text-az-stone'>
                  {currentVariant.stock} disponibles
                </span>
              </>
            ) : (
              <span className='az-caption-bold text-az-critical'>Sin stock en este talle</span>
            )
          ) : hasStock ? (
            <span className='az-body-sm text-az-stone'>
              {product.colors.length > 0
                ? 'Seleccioná un talle para continuar'
                : 'Seleccioná un talle para continuar'}
            </span>
          ) : (
            <span className='az-caption-bold bg-az-critical/10 text-az-critical px-3 py-1 rounded-az-full'>
              Sin stock
            </span>
          )}
        </div>

        {/* CTA — desktop */}
        <div className='hidden md:block border-t border-az-hairline-soft pt-6'>
          {hasStock ? (
            selectedSize ? (
              <AddToCart
                cart={cart}
                item={{
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  // Fase 2: el item del carrito arranca con CASH por default
                  // (el método final se elige en checkout).
                  priceUsed: priceCash,
                  paymentMethod: 'CASH',
                  qty: 1,
                  image: currentImage,
                  size: selectedSize,
                  productColorId: selectedColor?.id,
                  colorName: selectedColor?.color?.name,
                  colorHex: selectedColor?.color?.hex,
                }}
              />
            ) : (
              <button
                disabled
                className='w-full az-button-md bg-az-disabled-text text-white py-4 rounded-az-full cursor-not-allowed'
              >
                Elegí un talle para comprar
              </button>
            )
          ) : (
            <button
              disabled
              className='w-full az-button-md bg-az-disabled-text text-white py-4 rounded-az-full cursor-not-allowed'
            >
              Sin stock
            </button>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-az-canvas border-t border-az-hairline-soft px-4 py-3 flex items-center gap-3'>
        <div className='flex-1'>
          <p className='az-caption text-az-stone'>Precio</p>
          <p className='az-body-md-bold text-az-ink-deep'>{formattedCash}</p>
          {showDual && (
            <p className='az-caption text-az-stone line-through'>
              o {formattedMp} por MP
            </p>
          )}
        </div>
        {hasStock && selectedSize ? (
          <AddToCart
            cart={cart}
            item={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              priceUsed: priceCash,
              paymentMethod: 'CASH',
              qty: 1,
              image: currentImage,
              size: selectedSize,
              productColorId: selectedColor?.id,
              colorName: selectedColor?.color?.name,
              colorHex: selectedColor?.color?.hex,
            }}
          />
        ) : (
          <button
            disabled
            className='az-button-md bg-az-disabled-text text-white px-6 py-3 rounded-az-full cursor-not-allowed'
          >
            {hasStock ? 'Elegí un talle' : 'Sin stock'}
          </button>
        )}
      </div>
    </>
  );
}
