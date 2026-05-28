import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';
import { DEFAULT_BRAND_ID, DEFAULT_CATEGORY_ID } from '../lib/constants';

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

async function main() {
  const prisma = new PrismaClient();

  console.log('\n🌱 Seeding database...\n');

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

  // Seed users
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

  console.log('\n✅ Seeding completed!\n');
  console.log('📝 Test Users:');
  console.log('─────────────────────────────────────────────');
  testUsers.forEach((user) => {
    console.log(`Role: ${user.role.toUpperCase()}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Seeding failed:', e);
  process.exit(1);
});
