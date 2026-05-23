'use client';

import { useState } from 'react';
import AddToCart from './add-to-cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cart } from '@/types';

// Type that matches the plain object returned by convertToPlainObject(getProductBySlug(...))
// Decimal fields become strings after serialization
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

  // Filter variants with stock
  const availableVariants = product.variants?.filter((v) => v.stock > 0) || [];
  const hasStock = availableVariants.length > 0;

  // Selected variant
  const currentVariant = selectedSize
    ? availableVariants.find((v) => v.size.name === selectedSize)
    : null;

  return (
    <div className='flex flex-col gap-6 w-full'>
      {/* Talles */}
      {availableVariants.length > 0 && (
        <div className='space-y-3'>
          <p className='eyebrow-cap text-shade-50'>Talles disponibles</p>
          <div className='flex flex-wrap gap-2'>
            {availableVariants.map((v) => (
              <Button
                key={v.id}
                type='button'
                variant={selectedSize === v.size.name ? 'primaryPill' : 'outlineOnDark'}
                className={`rounded-pill min-w-[3rem] ${
                  selectedSize === v.size.name ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedSize(v.size.name)}
              >
                {v.size.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Stock status - dynamic based on selection */}
      <div className='flex items-center gap-3'>
        {currentVariant ? (
          <>
            <Badge className='bg-aloe-10/10 text-aloe-10 border border-aloe-10/20 rounded-pill px-4 py-1 text-xs font-medium'>
              Con stock
            </Badge>
            <span className='text-shade-40 text-sm'>
              {currentVariant.stock} disponibles
            </span>
          </>
        ) : hasStock ? (
          <span className='text-shade-40 text-sm'>Selecciona un talle</span>
        ) : (
          <Badge className='bg-red-500/10 text-red-400 border border-red-500/20 rounded-pill px-4 py-1 text-xs font-medium'>
            Sin stock
          </Badge>
        )}
      </div>

      {/* CTA */}
      <div className='border-t border-hairline-dark pt-8 flex flex-col sm:flex-row gap-3'>
        {hasStock ? (
          <div className='w-full'>
            {selectedSize ? (
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
              <Button
                variant='outlineOnDark'
                disabled
                className='rounded-pill w-full opacity-40 cursor-not-allowed'
              >
                Elige un talle para comprar
              </Button>
            )}
          </div>
        ) : (
          <Button
            variant='outlineOnDark'
            disabled
            className='rounded-pill w-full opacity-40 cursor-not-allowed'
          >
            Sin stock
          </Button>
        )}
      </div>
    </div>
  );
}
