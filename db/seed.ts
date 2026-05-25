import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data';
import { hash } from '@/lib/encrypt';
import slugify from 'slugify';
import { DEFAULT_BRAND_ID, DEFAULT_CATEGORY_ID } from '../lib/constants';

async function main() {
  const prisma = new PrismaClient();
  
  // Wipe in reverse dependency order due to cascades/foreign keys
  await prisma.productVariant.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.product.deleteMany();
  await prisma.size.deleteMany();
  await prisma.subCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Create sentinel default records (must exist before any product references them)
  await prisma.brand.create({
    data: { id: DEFAULT_BRAND_ID, name: 'Sin marca', slug: 'sin-marca' },
  });
  await prisma.category.create({
    data: { id: DEFAULT_CATEGORY_ID, name: 'Sin categoría', slug: 'sin-categoria' },
  });

  // Create Categories and a default Size
  const categoryNames = Array.from(
    new Set(sampleData.products.map((p) => p.category))
  );
  
  const categories = [];
  for (const name of categoryNames) {
    const cat = await prisma.category.create({
      data: {
        name,
        slug: slugify(name, { lower: true }),
      },
    });
    categories.push(cat);

    // Create a default size for this category
    await prisma.size.create({
      data: {
        name: 'M',
        categoryId: cat.id,
      },
    });
  }

  // Create Brands
  const brandNames = Array.from(
    new Set(sampleData.products.map((p) => p.brand))
  );
  
  const brands = [];
  for (const name of brandNames) {
    const brand = await prisma.brand.create({
      data: {
        name,
        slug: slugify(name, { lower: true }),
      },
    });
    brands.push(brand);
  }

  // Insert Products and Variants
  for (const product of sampleData.products) {
    const cat = categories.find((c) => c.name === product.category);
    const brand = brands.find((b) => b.name === product.brand);
    if (!cat || !brand) continue;

    const size = await prisma.size.findFirst({ where: { categoryId: cat.id } });
    
    const dbProduct = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        categoryId: cat.id,
        description: product.description,
        images: product.images,
        price: product.price,
        brandId: brand.id,
        rating: product.rating,
        numReviews: product.numReviews,
        isFeatured: product.isFeatured,
        banner: product.banner,
      },
    });

    if (size) {
      await prisma.productVariant.create({
        data: {
          productId: dbProduct.id,
          sizeId: size.id,
          stock: product.stock,
        },
      });
    }
  }

  const users = [];
  for (let i = 0; i < sampleData.users.length; i++) {
    users.push({
      ...sampleData.users[i],
      password: await hash(sampleData.users[i].password),
    });
  }
  await prisma.user.createMany({ data: users });

  console.log('Database seeded successfully!');
}

main();
