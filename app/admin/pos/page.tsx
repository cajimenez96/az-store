import React from 'react';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { prisma } from '@/db/prisma';
import PosForm from './pos-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Punto de Venta (POS) - Administración',
  description: 'Módulo de carga y registro de ventas físicas en el local.',
};

export default async function PosPage() {
  const session = await requireAdminOrSeller();
  const sellerName = session?.user?.name || 'Vendedor Local';

  // Fetch all products with their variants, brand and prices
  const products = await prisma.product.findMany({
    include: {
      brand: {
        select: {
          name: true,
        },
      },
      variants: {
        include: {
          size: {
            select: {
              name: true,
            },
          },
        },
      },
      prices: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  // Fetch all categories for filter
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc',
    },
  });

  // Serialize to plain JSON objects for Client Component
  const serializedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    images: product.images,
    // Fase 2: serializamos priceCash (precio base) como string para el POS.
    // El vendedor puede elegir el método de pago en el checkout del POS.
    price: product.prices.find((p) => p.paymentMethod === 'CASH')?.value.toString() ?? '0.00',
    prices: product.prices.map((p) => ({
      paymentMethod: p.paymentMethod,
      value: p.value.toString(),
    })),
    brand: product.brand,
    categoryId: product.categoryId,
    variants: product.variants.map((v) => ({
      id: v.id,
      stock: v.stock,
      size: v.size
        ? {
            name: v.size.name,
          }
        : null,
    })),
  }));

  const serializedCategories = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
  }));

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex flex-col gap-1 pb-4 border-b border-[#e5e5e5]'>
        <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
          Punto de Venta (POS)
        </h1>
        <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold'>
          Registrá ventas en el local, transferencias y pagos directos
        </p>
      </div>

      <PosForm
        products={serializedProducts}
        categories={serializedCategories}
        sellerName={sellerName}
      />
    </div>
  );
}
