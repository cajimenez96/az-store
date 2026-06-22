'use server';
import { prisma } from '@/db/prisma';
import { convertToPlainObject, formatError } from '../utils';
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from '../constants';
import { revalidatePath, unstable_cache } from 'next/cache';
import { insertProductSchema, updateProductSchema } from '../validators';
import { deleteUTFiles } from '../uploadthing-helpers';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Includes default para queries de producto (Fase 1: con colors y variants.color)
// (Fase 2: agregamos `prices` para el dual pricing)
const productIncludes = {
  category: true,
  subCategory: true,
  brand: true,
  variants: {
    include: {
      size: true,
      productColor: { include: { color: true } },
    },
  },
  colors: {
    include: { color: true },
    orderBy: { order: 'asc' as const },
  },
  prices: true,
};

// Get latest products (cached for 1 hour during ISR window)
export const getLatestProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      take: LATEST_PRODUCTS_LIMIT,
      orderBy: { createdAt: 'desc' },
      include: productIncludes,
    });
    return convertToPlainObject(data);
  },
  ['latest-products'],
  { revalidate: 3600, tags: ['products'] }
);

// Get single product by it's slug
export async function getProductBySlug(slug: string) {
  const data = await prisma.product.findFirst({
    where: { slug: slug },
    include: productIncludes,
  });
  return convertToPlainObject(data);
}

// Get single product by it's ID
export async function getProductById(productId: string) {
  const data = await prisma.product.findFirst({
    where: { id: productId },
    include: productIncludes,
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
  color,
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
  color?: string;
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

  // Price filter (Fase 2: filtra por `priceCash` — el precio base — porque es
  // el que se muestra como "desde" en la UI del storefront).
  const priceFilter: Prisma.ProductWhereInput =
    price && price !== 'all'
      ? {
          prices: {
            some: {
              paymentMethod: 'CASH',
              value: {
                gte: Number(price.split('-')[0]),
                lte: Number(price.split('-')[1]),
              },
            },
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

  // Color filter (Fase 1): filtra productos que tengan al menos un ProductColor
  // cuyo Color.name coincida con el slug recibido (case-insensitive).
  const colorFilter: Prisma.ProductWhereInput =
    color && color !== 'all'
      ? {
          colors: {
            some: {
              color: {
                name: { equals: color.replace(/-/g, ' '), mode: 'insensitive' },
              },
            },
          },
        }
      : {};

  const data = await prisma.product.findMany({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...subCategoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...sellerFilter,
      ...colorFilter,
    },
    include: productIncludes,
    // Fase 2: el orden por precio (`priceCash`) se hace en memoria abajo,
    // porque `Product.price` ya no existe y Prisma no soporta `orderBy` por
    // relación anidada (`prices.paymentMethod = 'CASH'`).
    orderBy:
      sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Sort en memoria por priceCash (solo aplica si sort === 'lowest' | 'highest')
  if (sort === 'lowest' || sort === 'highest') {
    const dir = sort === 'lowest' ? 1 : -1;
    data.sort((a, b) => {
      const pa = Number(
        a.prices.find((p) => p.paymentMethod === 'CASH')?.value ?? 0,
      );
      const pb = Number(
        b.prices.find((p) => p.paymentMethod === 'CASH')?.value ?? 0,
      );
      return (pa - pb) * dir;
    });
  }

  const dataCount = await prisma.product.count({
    where: {
      ...queryFilter,
      ...categoryFilter,
      ...subCategoryFilter,
      ...priceFilter,
      ...ratingFilter,
      ...sellerFilter,
      ...colorFilter,
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
      include: { colors: true },
    });

    if (!productExists) throw new Error('Producto no encontrado');

    // Capturamos las URLs antes de borrar el registro para liberar espacio
    // en UploadThing. Se hace DESPUÉS de la transacción de DB para no borrar
    // un asset que la DB aún referencia si la operación falla.
    const urlsToCleanup: Array<string | null | undefined> = [
      productExists.banner,
      ...productExists.images,
      ...productExists.colors.flatMap((c) => c.images),
    ];

    await prisma.product.delete({ where: { id } });

    await deleteUTFiles(urlsToCleanup);

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

    // Separamos del core: variants (stock), colors (ProductColor pivot),
    // images (fallback) y los dos precios (van a la tabla Price).
    const { variants, colors, images, priceCash, priceMercadoPago, ...coreData } = productData;

    await prisma.$transaction(async (tx) => {
      // 1) Crear el Product core. Si hasColorVariants = false, las colors[] del form
      //    se ignoran; si es true, son obligatorias.
      const product = await tx.product.create({
        data: {
          ...coreData,
          images: images ?? [],
          subCategoryId: coreData.subCategoryId || null,
          sellerId: session?.user?.role === 'seller' ? session.user.id : null,
        },
      });

      // 2) Fase 2: crear las filas de Price (CASH + MERCADOPAGO).
      //    Usamos upsert para ser idempotentes frente a reintentos.
      await tx.price.createMany({
        data: [
          {
            productId: product.id,
            paymentMethod: 'CASH',
            value: priceCash,
          },
          {
            productId: product.id,
            paymentMethod: 'MERCADOPAGO',
            value: priceMercadoPago,
          },
        ],
      });

      // 3) Crear ProductColor solo si hasColorVariants = true
      let productColorIdMap = new Map<string, string>(); // colorId (Color.id) -> productColorId
      if (coreData.hasColorVariants && colors && colors.length > 0) {
        for (let i = 0; i < colors.length; i++) {
          const c = colors[i];
          const pc = await tx.productColor.create({
            data: {
              productId: product.id,
              colorId: c.colorId,
              images: c.images,
              order: i,
            },
          });
          productColorIdMap.set(c.colorId, pc.id);
        }
      }

      // 4) Crear ProductVariant
      //    - El form envía `colorId` con el `Color.id` global; mapeamos al `ProductColor.id`.
      //    - Si hasColorVariants = false, el `colorId` del form debe ser null/undefined.
      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants
            .filter((v) => Number(v.stock) > 0)
            .map((v) => ({
              productId: product.id,
              sizeId: v.sizeId || null,
              colorId: v.colorId
                ? (productColorIdMap.get(v.colorId) ?? null)
                : null,
              stock: Number(v.stock),
            })),
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

    // Traemos el producto viejo CON sus imágenes para poder calcular el diff
    // y limpiar los assets que el usuario quitó del form.
    const productExists = await prisma.product.findFirst({
      where: { id: productData.id },
      include: { colors: true },
    });

    if (!productExists) throw new Error('Producto no encontrado');

    const { variants, colors, images, id, priceCash, priceMercadoPago, ...restData } = productData;
    let coreData = { ...restData };

    // Decisión confirmada: seller puede editar todo. (No hay override restrictivo)

    // Diff de imágenes para limpieza en UploadThing:
    // - banner: si la URL cambió (incluye el caso de vaciarla), se borra la anterior.
    // - images: las URLs que estaban antes y ya no están en el nuevo array.
    // - colors[].images: igual, mirando todos los colores viejos vs. nuevos.
    const newImageSet = new Set(images ?? []);
    const oldImagesRemoved = productExists.images.filter(
      (url) => !newImageSet.has(url)
    );
    const oldBannerRemoved =
      productExists.banner &&
      productExists.banner !== coreData.banner &&
      productExists.banner !== ''
        ? productExists.banner
        : null;

    const newColorImages = new Set((colors ?? []).flatMap((c) => c.images));
    const oldColorImagesRemoved = productExists.colors
      .flatMap((c) => c.images)
      .filter((url) => !newColorImages.has(url));

    await prisma.$transaction(async (tx) => {
      // 1. Update core product info (sin los precios, que viven en `Price`)
      await tx.product.update({
        where: { id: id },
        data: {
          ...coreData,
          images: images ?? [],
          subCategoryId: coreData.subCategoryId || null,
        },
      });

      // 2. Fase 2: re-crear las dos filas de Price (CASH + MERCADOPAGO).
      await tx.price.deleteMany({ where: { productId: id } });
      await tx.price.createMany({
        data: [
          { productId: id, paymentMethod: 'CASH', value: priceCash },
          { productId: id, paymentMethod: 'MERCADOPAGO', value: priceMercadoPago },
        ],
      });

      // 3. Limpiar variants (van a referenciar nuevos ProductColor, así que cascadea)
      await tx.productVariant.deleteMany({
        where: { productId: id }
      });

      // 4. Limpiar ProductColor (los anteriores ya no aplican)
      await tx.productColor.deleteMany({
        where: { productId: id }
      });

      // 5. Re-crear ProductColor si hasColorVariants = true
      let productColorIdMap = new Map<string, string>();
      if (coreData.hasColorVariants && colors && colors.length > 0) {
        for (let i = 0; i < colors.length; i++) {
          const c = colors[i];
          const pc = await tx.productColor.create({
            data: {
              productId: id,
              colorId: c.colorId,
              images: c.images,
              order: i,
            },
          });
          productColorIdMap.set(c.colorId, pc.id);
        }
      }

      // 6. Re-crear ProductVariant con el colorId mapeado
      if (variants && variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants
            .filter((v) => Number(v.stock) > 0)
            .map((v) => ({
              productId: id,
              sizeId: v.sizeId || null,
              colorId: v.colorId
                ? (productColorIdMap.get(v.colorId) ?? null)
                : null,
              stock: Number(v.stock),
            })),
        });
      }
    });

    // Limpieza de UploadThing. Se hace DESPUÉS de commit para no borrar
    // un asset que la DB aún referencia si la transacción falla.
    await deleteUTFiles([
      oldBannerRemoved,
      ...oldImagesRemoved,
      ...oldColorImagesRemoved,
    ]);

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
export const getFeaturedProducts = unstable_cache(
  async () => {
    const data = await prisma.product.findMany({
      where: {
        isFeatured: true,
        banner: {
          not: null,
          notIn: [''],
        },
      },
      include: productIncludes,
      orderBy: { createdAt: 'desc' },
      take: 4,
    });
    return convertToPlainObject(data);
  },
  ['featured-products'],
  { revalidate: 3600, tags: ['products'] }
);

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
      productColor: { include: { color: true } },
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

// Search products for the banner product picker in admin
export async function searchProductsForPicker({
  query,
  categorySlug,
  brandId,
}: {
  query?: string;
  categorySlug?: string;
  brandId?: string;
}) {
  const results = await prisma.product.findMany({
    where: {
      ...(query ? { name: { contains: query, mode: 'insensitive' } } : {}),
      ...(categorySlug && categorySlug !== 'all' ? { category: { slug: categorySlug } } : {}),
      ...(brandId && brandId !== 'all' ? { brandId } : {}),
    },
    select: {
      id: true,
      name: true,
      images: true,
      prices: { where: { paymentMethod: 'CASH' }, select: { value: true } },
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
    orderBy: { name: 'asc' },
    take: 50,
  });

  // JSON round-trip strips Prisma Symbol properties (needed for RSC → Client serialization)
  return JSON.parse(
    JSON.stringify(
      results.map((p) => ({
        id: p.id,
        name: p.name,
        images: p.images,
        // Fase 2: el picker usa priceCash como referencia de precio.
        price: p.prices[0]?.value.toString() ?? '0.00',
        category: { name: p.category.name },
        brand: { name: p.brand.name },
      }))
    )
  ) as { id: string; name: string; images: string[]; price: string; category: { name: string }; brand: { name: string } }[];
}

// Get banner with its products for the search/catalog page
export async function getProductsByBanner(bannerId: string) {
  const now = new Date();
  return prisma.promoBanner.findFirst({
    where: {
      id: bannerId,
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    select: {
      title: true,
      discountPercent: true,
      products: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: true,
          // Fase 2: el banner trae los precios por método
          prices: { where: { paymentMethod: 'CASH' }, select: { value: true } },
          hasColorVariants: true,
          brand: { select: { name: true } },
          category: { select: { name: true, slug: true } },
          variants: { include: { size: true, productColor: { include: { color: true } } } },
          colors: { include: { color: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  });
}
