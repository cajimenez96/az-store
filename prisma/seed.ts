import { prisma } from '@/db/prisma';
import { hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const testUsers = [
  {
    email: 'admin@qa.example.com',
    password: 'Admin@QA2026',
    name: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'seller@qa.example.com',
    password: 'Seller@QA2026',
    name: 'Seller User',
    role: 'seller' as const,
  },
  {
    email: 'user@qa.example.com',
    password: 'User@QA2026',
    name: 'Regular User',
    role: 'user' as const,
  },
];

// Placeholder served from /public: next.config only allows remote images from utfs.io.
const PLACEHOLDER_IMAGE = '/images/logo-m-negro.png';

const categories = [
  { name: 'Shirts', slug: 'shirts', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Sweatshirts', slug: 'sweatshirts', sizes: ['S', 'M', 'L', 'XL'] },
  { name: 'Pants', slug: 'pants', sizes: ['38', '40', '42', '44'] },
];

const subCategories = [
  { name: 'Dress Shirts', slug: 'dress-shirts', category: 'shirts' },
  { name: 'Polos', slug: 'polos', category: 'shirts' },
  { name: 'Hoodies', slug: 'hoodies', category: 'sweatshirts' },
  { name: 'Chinos', slug: 'chinos', category: 'pants' },
];

const brands = [
  { name: 'Polo', slug: 'polo' },
  { name: 'Brooks Brothers', slug: 'brooks-brothers' },
  { name: 'Calvin Klein', slug: 'calvin-klein' },
];

const colors = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Navy', hex: '#1F2A44' },
  { name: 'Pink', hex: '#F4A6B8' },
];

interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  subCategory: string;
  brand: string;
  description: string;
  cash: number;
  mercadopago: number;
  isFeatured: boolean;
  colors: string[];
  stockPerVariant: number;
}

const products: SeedProduct[] = [
  {
    name: 'Polo Sporting Stretch Shirt',
    slug: 'polo-sporting-stretch-shirt',
    category: 'shirts',
    subCategory: 'polos',
    brand: 'polo',
    description: 'Classic Polo style with modern comfort',
    cash: 54000,
    mercadopago: 59990,
    isFeatured: true,
    colors: ['Black', 'Navy'],
    stockPerVariant: 5,
  },
  {
    name: 'Brooks Brothers Long Sleeved Shirt',
    slug: 'brooks-brothers-long-sleeved-shirt',
    category: 'shirts',
    subCategory: 'dress-shirts',
    brand: 'brooks-brothers',
    description: 'Timeless style and premium comfort',
    cash: 77000,
    mercadopago: 85900,
    isFeatured: true,
    colors: ['White', 'Navy'],
    stockPerVariant: 10,
  },
  {
    name: 'Calvin Klein Slim Fit Stretch Shirt',
    slug: 'calvin-klein-slim-fit-stretch-shirt',
    category: 'shirts',
    subCategory: 'dress-shirts',
    brand: 'calvin-klein',
    description: 'Streamlined design with flexible stretch fabric',
    cash: 36000,
    mercadopago: 39950,
    isFeatured: false,
    colors: ['White'],
    stockPerVariant: 0, // out-of-stock case
  },
  {
    name: 'Polo Classic Pink Hoodie',
    slug: 'polo-classic-pink-hoodie',
    category: 'sweatshirts',
    subCategory: 'hoodies',
    brand: 'polo',
    description: 'Soft, stylish, and perfect for laid-back days',
    cash: 90000,
    mercadopago: 99990,
    isFeatured: true,
    colors: ['Pink', 'Black'],
    stockPerVariant: 8,
  },
  {
    name: 'Calvin Klein Slim Chinos',
    slug: 'calvin-klein-slim-chinos',
    category: 'pants',
    subCategory: 'chinos',
    brand: 'calvin-klein',
    description: 'Everyday slim-fit chinos',
    cash: 63000,
    mercadopago: 69900,
    isFeatured: false,
    colors: ['Navy', 'Black'],
    stockPerVariant: 6,
  },
];

function isLocalDatabase(): boolean {
  try {
    const { hostname } = new URL(process.env.DATABASE_URL ?? '');
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function seedUsers() {
  console.log('\n🌱 Seeding test users...\n');

  for (const userData of testUsers) {
    const hashedPassword = await hash(userData.password, 10);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: { password: hashedPassword },
      create: {
        id: uuidv4(),
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
      },
    });
    console.log(`✓ ${userData.role.toUpperCase()} created: ${userData.email}`);
  }
}

async function seedCatalog() {
  console.log('\n🛍️  Seeding catalog...\n');

  const categoryIds = new Map<string, string>();
  const sizeIds = new Map<string, string[]>();

  for (const { name, slug, sizes } of categories) {
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    categoryIds.set(slug, category.id);

    // Size has no unique key, so create only the missing names to stay idempotent.
    const existing = await prisma.size.findMany({ where: { categoryId: category.id } });
    const existingNames = new Set(existing.map((size) => size.name));
    for (const sizeName of sizes) {
      if (!existingNames.has(sizeName)) {
        await prisma.size.create({ data: { name: sizeName, categoryId: category.id } });
      }
    }
    const all = await prisma.size.findMany({
      where: { categoryId: category.id, name: { in: sizes } },
    });
    sizeIds.set(slug, sizes.map((s) => all.find((size) => size.name === s)!.id));
  }

  const subCategoryIds = new Map<string, string>();
  for (const { name, slug, category } of subCategories) {
    const sub = await prisma.subCategory.upsert({
      where: { slug },
      update: { name, categoryId: categoryIds.get(category)! },
      create: { name, slug, categoryId: categoryIds.get(category)! },
    });
    subCategoryIds.set(slug, sub.id);
  }

  const brandIds = new Map<string, string>();
  for (const { name, slug } of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug },
      update: { name },
      create: { name, slug },
    });
    brandIds.set(slug, brand.id);
  }

  const colorIds = new Map<string, string>();
  for (const { name, hex } of colors) {
    const color = await prisma.color.upsert({
      where: { name },
      update: { hex },
      create: { name, hex },
    });
    colorIds.set(name, color.id);
  }

  for (const product of products) {
    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        isFeatured: product.isFeatured,
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        images: [PLACEHOLDER_IMAGE],
        isFeatured: product.isFeatured,
        hasColorVariants: true,
        categoryId: categoryIds.get(product.category)!,
        subCategoryId: subCategoryIds.get(product.subCategory)!,
        brandId: brandIds.get(product.brand)!,
      },
    });

    const prices = [
      { paymentMethod: 'CASH' as const, value: product.cash },
      { paymentMethod: 'MERCADOPAGO' as const, value: product.mercadopago },
    ];
    for (const { paymentMethod, value } of prices) {
      await prisma.price.upsert({
        where: { productId_paymentMethod: { productId: saved.id, paymentMethod } },
        update: { value },
        create: { productId: saved.id, paymentMethod, value },
      });
    }

    for (const [order, colorName] of product.colors.entries()) {
      const productColor = await prisma.productColor.upsert({
        where: {
          productId_colorId: { productId: saved.id, colorId: colorIds.get(colorName)! },
        },
        update: { order },
        create: {
          productId: saved.id,
          colorId: colorIds.get(colorName)!,
          order,
          images: [PLACEHOLDER_IMAGE],
        },
      });

      for (const sizeId of sizeIds.get(product.category)!) {
        const existing = await prisma.productVariant.findFirst({
          where: { productId: saved.id, sizeId, colorId: productColor.id },
        });
        if (existing) {
          await prisma.productVariant.update({
            where: { id: existing.id },
            data: { stock: product.stockPerVariant },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: saved.id,
              sizeId,
              colorId: productColor.id,
              stock: product.stockPerVariant,
            },
          });
        }
      }
    }
    console.log(`✓ Product: ${product.name}`);
  }

  await prisma.promoCode.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      description: 'Local dev promo code',
      discountPercentMercadoPago: 10,
      discountPercentTransferencia: 10,
      isActive: true,
    },
  });
  console.log('✓ Promo code: WELCOME10');

  await prisma.promoBanner.deleteMany({ where: { title: 'Local dev banner' } });
  await prisma.promoBanner.create({
    data: {
      title: 'Local dev banner',
      subtitle: 'Seeded for local development',
      linkLabel: 'Shop now',
      image: PLACEHOLDER_IMAGE,
      discountPercent: 10,
      isActive: true,
    },
  });
  console.log('✓ Promo banner');
}

async function main() {
  try {
    await seedUsers();

    if (isLocalDatabase() || process.env.SEED_CATALOG === '1') {
      await seedCatalog();
    } else {
      console.log('\n⏭️  Skipping catalog: DATABASE_URL is not local (set SEED_CATALOG=1 to force).');
    }

    console.log('\n✅ Seeding completed!\n');
    console.log('📝 Test Users:');
    console.log('─────────────────────────────────────────────');
    testUsers.forEach((user) => {
      console.log(`Role: ${user.role.toUpperCase()}`);
      console.log(`  Email:    ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
