import { prisma } from '@/db/prisma';

export default async function globalTeardown() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete orders created during E2E tests
    await prisma.orderItem.deleteMany({
      where: {
        product: {
          slug: 'e2e-test-product',
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'e2e-',
          },
        },
      },
    });
    console.log('✓ Test orders cleaned up');

    // Delete carts
    await prisma.cart.deleteMany({
      where: {
        user: {
          email: {
            startsWith: 'e2e-',
          },
        },
      },
    });
    console.log('✓ Test carts cleaned up');

    // Delete product variants
    await prisma.productVariant.deleteMany({
      where: {
        product: {
          slug: 'e2e-test-product',
        },
      },
    });
    console.log('✓ Product variants cleaned up');

    // Delete test product
    await prisma.product.deleteMany({
      where: {
        slug: 'e2e-test-product',
      },
    });
    console.log('✓ Test product deleted');

    // Delete test size
    await prisma.size.deleteMany({
      where: {
        name: 'M',
        category: {
          slug: 'e2e-test-category',
        },
      },
    });
    console.log('✓ Test size deleted');

    // Delete test category
    await prisma.category.deleteMany({
      where: {
        slug: 'e2e-test-category',
      },
    });
    console.log('✓ Test category deleted');

    // Delete test brand
    await prisma.brand.deleteMany({
      where: {
        slug: 'e2e-test-brand',
      },
    });
    console.log('✓ Test brand deleted');

    // Delete test admin user
    await prisma.user.deleteMany({
      where: {
        email: 'e2e-admin@example.com',
      },
    });
    console.log('✓ Test admin user deleted');

    console.log('✅ Test data cleaned up successfully\n');
  } catch (error) {
    console.error('❌ Teardown failed:', error);
    // Don't throw - we want tests to complete even if cleanup fails
  } finally {
    await prisma.$disconnect();
  }
}
