'use client';

import { useState } from 'react';
import AddToCart from './add-to-cart';
import { Cart, Product, ProductColor, ProductVariant } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
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

  // Dual price: the LIST price (MercadoPago) is the main price and the
  // cash/transfer price is always shown as an emphasized secondary line.
  const { priceCash, priceMercadoPago } = extractDualPrice(product);
  const cashNum = Number(priceCash);
  const mpNum = Number(priceMercadoPago);
  const formattedCash = formatCurrency(cashNum);
  const formattedMp = formatCurrency(mpNum);
  const showDual = mpNum > 0 && mpNum !== cashNum;
  const mainPrice = showDual ? formattedMp : formattedCash;

  return (
    <>
      <div className='flex flex-col gap-6 w-full'>
        {/* Color selector (solo si el producto tiene colores) */}
        {product.colors.length > 0 && (
          <div className='space-y-3'>
            <p className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest'>
              Color: <span className='text-nike-ink font-medium normal-case tracking-normal'>{selectedColor?.color?.name}</span>
            </p>
            <div className='flex flex-wrap gap-2.5'>
              {product.colors.map((pc) => {
                const isSelected = selectedColorId === pc.id;
                return (
                  <button
                    key={pc.id}
                    type='button'
                    onClick={() => {
                      handleSelectColor(pc.id);
                      setSelectedSize(null);
                    }}
                    className={cn(
                      'w-11 h-11 rounded-full border-2 transition-all active:scale-95',
                      isSelected
                        ? 'border-nike-ink ring-2 ring-nike-ink ring-offset-2 scale-105'
                        : 'border-nike-hairline hover:border-nike-ink/60'
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
            <p className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest'>
              Seleccionar Talle
            </p>
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
                      'min-w-[3.5rem] min-h-11 px-5 py-2.5 rounded-nike-lg font-sans text-base font-medium border transition-all active:scale-95',
                      isSelected
                        ? 'bg-nike-ink text-white border-nike-ink'
                        : inStock
                        ? 'bg-nike-soft-cloud text-nike-ink border-transparent hover:border-nike-ink'
                        : 'bg-nike-soft-cloud/40 text-nike-mute border-transparent cursor-not-allowed line-through opacity-40'
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
        <div className='flex items-center gap-2 pt-1'>
          {currentVariant ? (
            currentVariant.stock > 0 ? (
              <span className='inline-flex items-center gap-1.5 font-sans text-sm font-medium text-nike-success'>
                <span className='w-2 h-2 rounded-full bg-nike-success'></span>
                En stock ({currentVariant.stock} disponibles)
              </span>
            ) : (
              <span className='font-sans text-sm font-medium text-nike-ink'>
                Sin stock en este talle
              </span>
            )
          ) : hasStock ? (
            <span className='font-sans text-sm text-nike-mute'>
              Seleccioná tu talle para ver disponibilidad
            </span>
          ) : (
            <span className='font-sans text-sm font-medium text-nike-ink'>
              Sin stock disponible
            </span>
          )}
        </div>

        {/* CTA — desktop */}
        <div className='hidden md:block border-t border-nike-hairline-soft pt-6'>
          {hasStock ? (
            selectedSize ? (
              <AddToCart
                cart={cart}
                item={{
                  productId: product.id,
                  size: selectedSize,
                  productColorId: selectedColor?.id,
                }}
              />
            ) : (
              <button
                disabled
                className='w-full min-h-12 font-sans text-base font-medium bg-nike-soft-cloud text-nike-mute py-3 rounded-nike-lg cursor-not-allowed'
              >
                Seleccioná un talle para comprar
              </button>
            )
          ) : (
            <button
              disabled
              className='w-full min-h-12 font-sans text-base font-medium bg-nike-soft-cloud text-nike-mute py-3 rounded-nike-lg cursor-not-allowed'
            >
              Agotado
            </button>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      <div className='md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white shadow-nike-hairline-inset border-t border-nike-hairline-soft px-4 py-3 flex items-center justify-between gap-4'>
        <div className='flex-1 min-w-0'>
          <p className='font-sans text-xs text-nike-mute font-medium'>Precio</p>
          <p className='font-sans text-lg font-medium text-nike-ink leading-tight'>{mainPrice}</p>
          {showDual && (
            <p className='whitespace-nowrap font-sans text-[11px] font-medium text-nike-success leading-tight'>
              Transf./efectivo {formattedCash}
            </p>
          )}
        </div>
        <div className='flex-1 max-w-[180px]'>
          {hasStock && selectedSize ? (
            <AddToCart
              cart={cart}
              item={{
                productId: product.id,
                size: selectedSize,
                productColorId: selectedColor?.id,
              }}
            />
          ) : (
            <button
              disabled
              className='w-full min-h-12 font-sans text-sm font-medium bg-nike-soft-cloud text-nike-mute px-4 py-3 rounded-nike-lg cursor-not-allowed'
            >
              {hasStock ? 'Elegí talle' : 'Agotado'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
