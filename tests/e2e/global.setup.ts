import { chromium, expect } from '@playwright/test';
import { prisma } from '@/db/prisma';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const authFile = 'tests/e2e/.auth/admin.json';

export default async function globalSetup() {
  console.log('\n🌱 Seeding test data...');

  // Create auth dir
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  try {
    // Create test admin user
    const adminId = uuidv4();
    const adminEmail = 'e2e-admin@example.com';
    const adminPassword = 'E2eTest@123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        id: adminId,
        email: adminEmail,
        name: 'E2E Admin',
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log('✓ Admin user created or already exists');

    // Create test brand
    const brandId = uuidv4();
    const brand = await prisma.brand.upsert({
      where: { slug: 'e2e-test-brand' },
      update: {},
      create: {
        id: brandId,
        name: 'E2E Test Brand',
        slug: 'e2e-test-brand',
      },
    });
    console.log('✓ Test brand created');

    // Create test category
    const categoryId = uuidv4();
    const category = await prisma.category.upsert({
      where: { slug: 'e2e-test-category' },
      update: {},
      create: {
        id: categoryId,
        name: 'E2E Test Category',
        slug: 'e2e-test-category',
      },
    });
    console.log('✓ Test category created');

    // Create test size
    const sizeId = uuidv4();
    const size = await prisma.size.upsert({
      where: { id: sizeId },
      update: {},
      create: {
        id: sizeId,
        name: 'M',
        categoryId: category.id,
      },
    });
    console.log('✓ Test size created');

    // Create test product
    const productId = uuidv4();
    const product = await prisma.product.upsert({
      where: { slug: 'e2e-test-product' },
      update: {
        stock: 100,
      },
      create: {
        id: productId,
        name: 'E2E Test Product',
        slug: 'e2e-test-product',
        description: 'Test product for E2E automation',
        price: '99.99',
        images: ['https://via.placeholder.com/500x500?text=Test+Product'],
        categoryId: category.id,
        brandId: brand.id,
        isFeatured: false,
        rating: 0,
        numReviews: 0,
      },
    });
    console.log('✓ Test product created');

    // Create product variant (size M with stock 10)
    const variantId = uuidv4();
    await prisma.productVariant.upsert({
      where: { id: variantId },
      update: { stock: 10 },
      create: {
        id: variantId,
        productId: product.id,
        sizeId: size.id,
        stock: 10,
      },
    });
    console.log('✓ Product variant created');

    // Login and save session
    const browser = await chromium.launch();
    const context = await browser.createContext();
    const page = await context.newPage();

    // Navigate to login
    await page.goto('http://localhost:3000/sign-in');

    // Fill login form with hardcoded credentials
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', '123456');

    // Submit form
    await page.click('button:has-text("Iniciar Sesión")');

    // Wait for redirect to home
    await page.waitForURL('http://localhost:3000/', { timeout: 10000 });

    // Save storage state
    await context.storageState({ path: authFile });
    console.log('✓ Session saved to', authFile);

    await browser.close();

    console.log('✅ Test data seeded successfully\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
