'use server';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Get latest products
export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: 'desc' },
    include: { category: true, subCategory: true, brand: true, variants: { include: { size: true } } },
  });

  return convertToPlainObject(data);
}

// Get single product by it's slug
export async function getProductBySlug(slug: string) {
  const data = await prisma.product.findFirst({
    where: { slug: slug },
    include: { category: true, subCategory: true, brand: true, variants: { include: { size: true } } },
  });
  return convertToPlainObject(data);
}

// Get single product by it's ID
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
    include: { category: true, subCategory: true, brand: true, variants: { include: { size: true } } },
  });

  return convertToPlainObject(data);
}

// Get all products
export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  subCategory,
  price,
  rating,
  sort,
  sellerId,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  subCategory?: string;
  price?: string;
  rating?: string;
  sort?: string;
  sellerId?: string;
}) {
  // Query filter
  const queryFilter: Prisma.ProductWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  // Category filter (now needs to filter by category slug or name via relation)
  // Let's assume category passed here is the slug
  const categoryFilter: Prisma.ProductWhereInput =
    category && category !== 'all'
      ? { category: { slug: category } }
      : {};

  // SubCategory filter
  const subCategoryFilter: Prisma.ProductWhereInput =
    subCategory && subCategory !== 'all'
      ? { subCategory: { slug: subCategory } }
      : {};

  // Price filter
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== 'all'
      ? {
          price: {
            gte: Number(price.split('-')[0]),
            lte: Number(price.split('-')[1]),
          },
        }
      : {};

  // Rating filter
  const ratingFilter =
    rating && rating !== 'all'
      ? {
          rating: {
            gte: Number(rating),
          },
        }
      : {};

  // Seller filter
  const sellerFilter: Prisma.ProductWhereInput = sellerId
    ? { sellerId }
    : {};

  const data = await prisma.product.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...subCategoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...sellerFilter,
    },
    include: { category: true, subCategory: true, brand: true, variants: { include: { size: true } } },
    orderBy:
      sort === 'lowest'
        ? { price: 'asc' }
        : sort === 'highest'
        ? { price: 'desc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...subCategoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...sellerFilter,
    }
  });

  return {
    data: convertToPlainObject(data),
    totalPages: Math.ceil(dataCount / limit),
  };
}

import { requireAdminOrSeller } from '@/lib/auth-guard';

// Delete a product
export async function deleteProduct(id: string) {
  try {
    await requireAdminOrSeller();
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) throw new Error('Producto no encontrado');

    await prisma.product.delete({ where: { id } });

    revalidatePath('/admin/products');

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Create a product
export async function createProduct(data: z.infer<typeof insertProductSchema>) {
  try {
    const session = await requireAdminOrSeller();
    const productData = insertProductSchema.parse(data);

    // We separate the variants from the product core data
    const { variants, ...coreData } = productData;

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...coreData,
          subCategoryId: coreData.subCategoryId || null,
          sellerId: session?.user?.role === 'seller' ? session.user.id : null,
        },
      });

      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map(v => ({
            productId: product.id,
            sizeId: v.sizeId,
            stock: v.stock
          }))
        });
      }
    });

    revalidatePath('/admin/products');
    revalidatePath('/');

    return {
      success: true,
      message: 'Producto creado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update a product
export async function updateProduct(data: z.infer<typeof updateProductSchema>) {
  try {
    const session = await requireAdminOrSeller();
    const productData = updateProductSchema.parse(data);
    const productExists = await prisma.product.findFirst({
      where: { id: productData.id },
    });

    if (!productExists) throw new Error('Producto no encontrado');

    const { variants, id, ...restData } = productData;
    let coreData = { ...restData };

    if (session?.user?.role === 'seller') {
      // Seller cannot change critical fields like price, category, name.
      // We override coreData with existing data, only allowing description to be updated.
      coreData = {
        ...coreData,
        name: productExists.name,
        slug: productExists.slug,
        categoryId: productExists.categoryId,
        subCategoryId: productExists.subCategoryId,
        images: productExists.images,
        brandId: productExists.brandId,
        price: productExists.price.toString(),
        isFeatured: productExists.isFeatured,
        banner: productExists.banner,
      };
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update core product info
      await tx.product.update({
        where: { id: id },
        data: {
          ...coreData,
          subCategoryId: coreData.subCategoryId || null,
        },
      });

      // 2. Clear existing variants
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // 3. Insert new variants
      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map(v => ({
            productId: id,
            sizeId: v.sizeId,
            stock: v.stock
          }))
        });
      }
    });

    revalidatePath('/admin/products');
    revalidatePath('/');

    return {
      success: true,
      message: 'Producto actualizado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get featured products
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: {
      isFeatured: true,
      banner: {
        not: null,
        notIn: [''],
      },
    },
    include: { category: true, brand: true, variants: { include: { size: true } } },
    orderBy: { createdAt: 'desc' },
    take: 4,
  });

  return convertToPlainObject(data);
}

import { getSetting } from './setting.actions';

// Get detailed inventory
export async function getInventory({
  limit = PAGE_SIZE,
  page,
  query,
  category,
  brand,
  stock,
}: {
  limit?: number;
  page: number;
  query?: string;
  category?: string;
  brand?: string;
  stock?: string;
}) {
  const queryFilter: Prisma.ProductVariantWhereInput =
    query && query !== 'all'
      ? {
          product: {
            name: {
              contains: query,
              mode: 'insensitive',
            } as Prisma.StringFilter,
          },
        }
      : {};

  const categoryFilter: Prisma.ProductVariantWhereInput =
    category && category !== 'all'
      ? { product: { category: { slug: category } } }
      : {};

  const brandFilter: Prisma.ProductVariantWhereInput =
    brand && brand !== 'all'
      ? { product: { brand: { slug: brand } } }
      : {};

  let stockFilter: Prisma.ProductVariantWhereInput = {};
  if (stock === 'critical') {
    const criticalStockThresholdStr = await getSetting('CRITICAL_STOCK_THRESHOLD', '2');
    const criticalStockThreshold = parseInt(criticalStockThresholdStr, 10);
    stockFilter = { stock: { lte: criticalStockThreshold } };
  }

  const data = await prisma.productVariant.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...brandFilter,
      ...stockFilter,
    },
    include: {
      product: {
        include: { category: true, brand: true, subCategory: true }
      },
      size: true,
    },
    orderBy: [
      { product: { name: 'asc' } },
      { size: { name: 'asc' } },
    ],
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.productVariant.count({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...brandFilter,
      ...stockFilter,
    }
  });

  return {
    data: convertToPlainObject(data),
    totalPages: Math.ceil(dataCount / limit),
  };
}
