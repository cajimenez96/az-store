'use client';

import { useState } from 'react';
import AddToCart from './add-to-cart';
import { Cart } from '@/types';
import { cn } from '@/lib/utils';

type ProductWithVariants = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  subCategoryId?: string | null;
  images: string[];
  brand: string | { name: string };
  description: string;
  price: string | number;
  rating: string | number;
  numReviews: number;
  isFeatured: boolean;
  banner?: string | null;
  createdAt: Date | string;
  variants: {
    id: string;
    productId: string;
    sizeId: string;
    stock: number;
    size: { id: string; name: string; categoryId: string };
  }[];
};

export default function ProductAction({
  product,
  cart,
}: {
  product: ProductWithVariants;
  cart: Cart | undefined;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const availableVariants = product.variants?.filter((v) => v.stock > 0) || [];
  const allVariants = product.variants || [];
  const hasStock = availableVariants.length > 0;
  const currentVariant = selectedSize
    ? allVariants.find((v) => v.size.name === selectedSize)
    : null;

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(Number(product.price));

  return (
    <>
      <div className='flex flex-col gap-6 w-full'>
        {/* Size selector */}
        {allVariants.length > 0 && (
          <div className='space-y-3'>
            <p className='az-caption-bold text-az-steel uppercase tracking-widest'>Talles</p>
            <div className='flex flex-wrap gap-2'>
              {allVariants.map((v) => {
                const inStock = v.stock > 0;
                const isSelected = selectedSize === v.size.name;
                return (
                  <button
                    key={v.id}
                    type='button'
                    disabled={!inStock}
                    onClick={() => inStock && setSelectedSize(v.size.name)}
                    className={cn(
                      'min-w-[3rem] px-4 py-2 rounded-az-full border-2 az-button-md transition-colors duration-150',
                      isSelected
                        ? 'bg-az-ink-deep text-white border-az-ink-deep'
                        : inStock
                        ? 'bg-az-canvas text-az-ink-deep border-az-hairline hover:border-az-ink-deep'
                        : 'bg-az-canvas text-az-disabled-text border-az-hairline cursor-not-allowed line-through'
                    )}
                  >
                    {v.size.name}
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
            <span className='az-body-sm text-az-stone'>Seleccioná un talle para continuar</span>
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
                  price: String(product.price),
                  qty: 1,
                  image: product.images![0],
                  size: selectedSize,
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
          <p className='az-body-md-bold text-az-ink-deep'>{formattedPrice}</p>
        </div>
        {hasStock && selectedSize ? (
          <AddToCart
            cart={cart}
            item={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: String(product.price),
              qty: 1,
              image: product.images![0],
              size: selectedSize,
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
