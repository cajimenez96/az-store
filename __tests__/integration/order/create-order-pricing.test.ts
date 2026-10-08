import { prisma } from '@/db/prisma';
import { createOrder } from '@/lib/actions/order.actions';
import { Decimal } from '@prisma/client/runtime/library';
import {
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
} from '../../factories';

// Real UUID so cart.actions can query the User table. The factory creates
// CASH = 100.00 and MERCADOPAGO = 110.00 prices for every product.
jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: '00000000-0000-0000-0000-0000000000a3', role: 'user' },
  }),
}));

const USER_ID = '00000000-0000-0000-0000-0000000000a3';
const SESSION_CART_ID = 'create-order-pricing-cart';

// Mirrors what a malicious client could persist in the Cart row.
function tamperedItem(
  product: { id: string },
  overrides: Record<string, unknown> = {}
) {
  return {
    productId: product.id,
    name: 'FAKE NAME',
    slug: 'fake-slug',
    image: '/fake.jpg',
    qty: 1,
    size: 'M',
    priceUsed: '0.01',
    paymentMethod: 'MERCADOPAGO',
    ...overrides,
  };
}

async function setupUser(paymentMethod: string) {
  await prisma.cart.deleteMany({ where: { userId: USER_ID } });
  await prisma.user.deleteMany({ where: { id: USER_ID } });
  return prisma.user.create({
    data: {
      id: USER_ID,
      name: 'Pricing Test User',
      email: `pricing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
      role: 'user',
      paymentMethod,
      address: {
        fullName: 'Pricing Test',
        streetAddress: 'Test 123',
        city: 'CABA',
        province: 'CABA',
        postalCode: '1000',
        country: 'Argentina',
        phone: '11111111',
        contactEmail: 'pricing@test.com',
      },
    },
  });
}

async function setupCart(items: unknown[], itemsPrice = '1.00') {
  return prisma.cart.create({
    data: {
      userId: USER_ID,
      sessionCartId: SESSION_CART_ID,
      items: items as any,
      itemsPrice: new Decimal(itemsPrice),
      totalPrice: new Decimal(itemsPrice),
      shippingPrice: new Decimal(0),
      taxPrice: new Decimal(0),
    },
  });
}

async function newProduct(stock = 10, overrides: Record<string, unknown> = {}) {
  const category = await createTestCategory();
  const brand = await createTestBrand();
  const size = await createTestSize(category.id, 'M');
  const product = await createTestProduct(category.id, brand.id, overrides);
  const variant = await createTestVariant(product.id, size.id, stock);
  return { product, variant };
}

describe('createOrder — everything is recomputed from the database', () => {
  afterEach(async () => {
    await prisma.promoCodeUsage.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({ where: { userId: USER_ID } });
    await prisma.cart.deleteMany({ where: { userId: USER_ID } });
    await prisma.promoCode.deleteMany({ where: { code: { startsWith: 'COP' } } });
    await prisma.promoBanner.deleteMany({ where: { title: 'COP banner' } });
    await prisma.user.deleteMany({ where: { id: USER_ID } });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('uses DB name and CASH price for a transfer order even if the cart row is tampered', async () => {
    const { product } = await newProduct();
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(product, { qty: 2 })]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(true);
    const order = await prisma.order.findFirstOrThrow({
      where: { userId: USER_ID },
      include: { orderitems: true },
    });
    expect(order.orderitems).toHaveLength(1);
    expect(order.orderitems[0].name).toBe(product.name);
    expect(order.orderitems[0].slug).toBe(product.slug);
    expect(Number(order.orderitems[0].priceUsed)).toBe(100);
    expect(order.orderitems[0].paymentMethod).toBe('CASH');
    expect(Number(order.itemsPrice)).toBe(200);
    expect(Number(order.totalPrice)).toBe(200);
  });

  it('uses the MERCADOPAGO list price for a MercadoPago order', async () => {
    const { product } = await newProduct();
    await setupUser('MercadoPago');
    await setupCart([tamperedItem(product, { paymentMethod: 'CASH' })]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(true);
    const order = await prisma.order.findFirstOrThrow({
      where: { userId: USER_ID },
      include: { orderitems: true },
    });
    expect(Number(order.orderitems[0].priceUsed)).toBe(110);
    expect(order.orderitems[0].paymentMethod).toBe('MERCADOPAGO');
    expect(Number(order.itemsPrice)).toBe(110);
    expect(Number(order.totalPrice)).toBe(110);
  });

  it('rejects the whole order and leaves the cart untouched when qty exceeds stock', async () => {
    const { product } = await newProduct(2);
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(product, { qty: 5 })]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(false);
    expect(result.redirectTo).toBe('/cart');
    expect(await prisma.order.count({ where: { userId: USER_ID } })).toBe(0);
    const cart = await prisma.cart.findFirstOrThrow({ where: { userId: USER_ID } });
    expect(cart.items as any[]).toHaveLength(1);
  });

  it('rejects the whole order when a product is inactive', async () => {
    const { product } = await newProduct(10, { isActive: false });
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(product)]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(false);
    expect(result.redirectTo).toBe('/cart');
    expect(await prisma.order.count({ where: { userId: USER_ID } })).toBe(0);
    const cart = await prisma.cart.findFirstOrThrow({ where: { userId: USER_ID } });
    expect(cart.items as any[]).toHaveLength(1);
  });

  it('applies the promo percent on the server items price, not on cart.itemsPrice', async () => {
    const { product } = await newProduct();
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(product)], '1.00');
    await prisma.promoCode.create({
      data: {
        code: 'COP-TAMPER',
        isActive: true,
        discountPercentTransferencia: 10,
        discountPercentMercadoPago: 10,
      },
    });

    const result = await createOrder({
      shippingMethod: 'retiro',
      promoCode: 'COP-TAMPER',
    });

    expect(result.success).toBe(true);
    const order = await prisma.order.findFirstOrThrow({ where: { userId: USER_ID } });
    expect(Number(order.itemsPrice)).toBe(100);
    expect(Number(order.discountPrice)).toBe(10);
    expect(Number(order.totalPrice)).toBe(90);
  });

  it('computes the banner discount from server prices of banner products only', async () => {
    const inBanner = await newProduct();
    const outOfBanner = await newProduct();
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(inBanner.product), tamperedItem(outOfBanner.product)]);
    const banner = await prisma.promoBanner.create({
      data: {
        image: '/b.jpg',
        title: 'COP banner',
        discountPercent: 20,
        isActive: true,
        products: { connect: [{ id: inBanner.product.id }] },
      },
    });

    const result = await createOrder({
      shippingMethod: 'retiro',
      bannerId: banner.id,
      bannerDiscount: 99999, // ignored: the client value is never trusted
    });

    expect(result.success).toBe(true);
    const order = await prisma.order.findFirstOrThrow({ where: { userId: USER_ID } });
    expect(Number(order.itemsPrice)).toBe(200);
    expect(Number(order.bannerDiscount)).toBe(20); // 20% of 100 (banner product only)
    expect(Number(order.totalPrice)).toBe(180);
  });

  it('decrements stock exactly once for a transfer order', async () => {
    const { product, variant } = await newProduct(10);
    await setupUser('TransferenciaBancaria');
    await setupCart([tamperedItem(product, { qty: 3 })]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(true);
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(after.stock).toBe(7);
  });

  it('decrements the exact variant that the quote validated, even for a sizeless line', async () => {
    // The sized variant is created first, so a lookup without a size filter would hit it.
    const { product, variant: sizedVariant } = await newProduct(5);
    const sizelessVariant = await prisma.productVariant.create({
      data: { productId: product.id, sizeId: null, stock: 3 },
    });
    await setupUser('TransferenciaBancaria');
    await setupCart([{ ...tamperedItem(product, { qty: 1 }), size: undefined }]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(true);
    const sized = await prisma.productVariant.findUniqueOrThrow({ where: { id: sizedVariant.id } });
    const sizeless = await prisma.productVariant.findUniqueOrThrow({ where: { id: sizelessVariant.id } });
    expect(sized.stock).toBe(5);
    expect(sizeless.stock).toBe(2);
  });

  it('does not decrement stock at creation for a MercadoPago order', async () => {
    const { product, variant } = await newProduct(10);
    await setupUser('MercadoPago');
    await setupCart([tamperedItem(product, { qty: 3 })]);

    const result = await createOrder({ shippingMethod: 'retiro' });

    expect(result.success).toBe(true);
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(after.stock).toBe(10);
  });
});
