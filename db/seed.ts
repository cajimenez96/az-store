import { PrismaClient } from '@prisma/client';
import sampleData from './sample-data';
import { hash } from '@/lib/encrypt';
import slugify from 'slugify';

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

  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

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

  // Insert Products and Variants
  for (const product of sampleData.products) {
    const cat = categories.find((c) => c.name === product.category);
    if (!cat) continue;

    const size = await prisma.size.findFirst({ where: { categoryId: cat.id } });
    
    const dbProduct = await prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        categoryId: cat.id,
        description: product.description,
        images: product.images,
        price: product.price,
        brand: product.brand,
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
