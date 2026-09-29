'use client';

import { useState } from 'react';
import { Cart, Product, ProductColor } from '@/types';
import ProductImages from './product-images';
import ProductAction from './product-action';
import DualPrice from './dual-price';

type ProductGalleryAndActionsProps = {
  product: Omit<Product, 'variants' | 'colors'> & {
    variants: NonNullable<Product['variants']>;
    colors: ProductColor[];
    prices?: Product['prices'];
  };
  cart?: Cart;
};

/**
 * Componente cliente que coordina la selección de color entre la galería
 * y el selector de talles. Renderiza gallery a la izquierda y la "purchase
 * rail" con info del producto + ProductAction a la derecha.
 */
export default function ProductGalleryAndActions({
  product,
  cart,
}: ProductGalleryAndActionsProps) {
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    product.colors[0]?.id ?? null
  );

  const selectedColor = product.colors.find((c) => c.id === selectedColorId);
  const galleryImages =
    selectedColor && selectedColor.images.length > 0
      ? selectedColor.images
      : product.images;

  const formattedPrice = (() => {
    const { priceCash, priceMercadoPago } = (() => {
      const c =
        product.prices?.find((p) => p.paymentMethod === 'CASH')?.value ?? '0';
      const m =
        product.prices?.find((p) => p.paymentMethod === 'MERCADOPAGO')?.value ?? '0';
      return { priceCash: c, priceMercadoPago: m };
    })();
    return {
      priceCash,
      priceMercadoPago,
      hasDual: Number(priceMercadoPago) > 0 && priceMercadoPago !== priceCash,
    };
  })();

  return (
    <div className='grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-8 lg:gap-14 items-start'>
      <ProductImages images={galleryImages} />
      <div className='lg:sticky lg:top-24'>
        <div className='bg-white p-0 sm:p-2'>
          {/* Brand + category eyebrow */}
          <p className='font-sans text-xs sm:text-sm font-semibold text-nike-mute uppercase tracking-widest mb-2'>
            {typeof product.brand === 'string'
              ? product.brand
              : product.brand?.name}
            {product.category?.name ? ` · ${product.category.name}` : ''}
            {product.subCategory?.name
              ? ` · ${product.subCategory.name}`
              : ''}
          </p>

          {/* Product name */}
          <h1 className='font-marder-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-nike-ink mb-4 leading-tight'>
            {product.name}
          </h1>

          {/* Price */}
          <div className='mb-6 pb-6 border-b border-nike-hairline-soft'>
            <p className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest mb-1.5'>
              Precio
            </p>
            <DualPrice product={product} className='font-sans text-xl sm:text-2xl font-semibold text-nike-ink' />
          </div>

          <ProductAction
            product={product}
            cart={cart}
            selectedColorId={selectedColorId}
            onSelectColor={setSelectedColorId}
          />
        </div>
      </div>
    </div>
  );
}
