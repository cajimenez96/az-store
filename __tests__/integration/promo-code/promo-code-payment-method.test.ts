import { prisma } from '@/db/prisma';
import { auth } from '@/auth';
import { createOrder } from '@/lib/actions/order.actions';
import { createPromoCode } from '@/lib/actions/promo-code.actions';
import { Decimal } from '@prisma/client/runtime/library';
import {
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
} from '../../factories';

// Override the default `@/auth` mock (which returns id 'test-user-id') so the
// session id matches a real UUID. Otherwise cart.actions.ts blows up trying
// to query the User table with the string 'test-user-id'. Tests toggle the
// role between 'admin' (for createPromoCode) and 'user' (for createOrder).
jest.mock('@/auth', () => ({
  auth: jest
    .fn()
    .mockResolvedValue({
      user: { id: '00000000-0000-0000-0000-000000000001', role: 'user' },
    }),
}));

function setSessionRole(role: 'user' | 'admin') {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: TEST_USER_UUID, role },
  });
}

// cart.actions.getMyCart is the entry point for createOrder. It reads the
// session via @/auth (mocked in setupAfterEnv to return id 'test-user-id').
// We create a real user with that exact id so getMyCart can resolve a cart.
// The User.id column is a UUID, so we use a real UUID.
const TEST_SESSION_CART_ID = 'test-session-cart';
const TEST_USER_UUID = '00000000-0000-0000-0000-000000000001';

function makeCartItem(
  productId: string,
  name: string,
  slug: string,
  qty = 1,
  size = 'M'
) {
  return {
    productId,
    name,
    slug,
    qty,
    image: '/images/test.jpg',
    price: '100.00',
    size,
  };
}

let sharedProduct: { id: string; name: string; slug: string } | null = null;

async function setupUserWithPaymentMethod(paymentMethod: string) {
  // Wipe any leftover cart for this user (FK target) before recreating them.
  await prisma.cart.deleteMany({
    where: { userId: TEST_USER_UUID },
  });
  await prisma.user.deleteMany({ where: { id: TEST_USER_UUID } });
  return prisma.user.create({
    data: {
      id: TEST_USER_UUID,
      name: 'Promo Test User',
      email: `promo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`,
      role: 'user',
      paymentMethod,
      address: {
        fullName: 'Promo Test',
        streetAddress: 'Test 123',
        city: 'CABA',
        province: 'CABA',
        postalCode: '1000',
        country: 'Argentina',
        phone: '11111111',
        contactEmail: 'promo@test.com',
      },
    },
  });
}

async function setupCart(userId: string, itemsPrice = '100.00') {
  if (!sharedProduct) {
    throw new Error(
      'sharedProduct is not initialized — beforeAll did not run yet'
    );
  }
  const cart = await prisma.cart.create({
    data: {
      userId,
      sessionCartId: TEST_SESSION_CART_ID,
      items: [
        makeCartItem(
          sharedProduct.id,
          sharedProduct.name,
          sharedProduct.slug,
          1,
          'M'
        ),
      ],
      itemsPrice: new Decimal(itemsPrice),
      totalPrice: new Decimal(itemsPrice),
      shippingPrice: new Decimal(0),
      taxPrice: new Decimal(0),
    },
  });
  return cart;
}

describe('createOrder — promo code split by payment method', () => {
  beforeAll(async () => {
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    await createTestVariant(product.id, size.id, 10);
    sharedProduct = { id: product.id, name: product.name, slug: product.slug };
  });

  afterAll(async () => {
    // Cleanup any carts/users we created in this suite.
    await prisma.cart.deleteMany({
      where: { sessionCartId: TEST_SESSION_CART_ID },
    });
    await prisma.user.deleteMany({ where: { id: TEST_USER_UUID } });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Make sure the createOrder tests run with the user role session.
    (auth as jest.Mock).mockResolvedValue({
      user: { id: TEST_USER_UUID, role: 'user' },
    });
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cart.deleteMany({
      where: { sessionCartId: TEST_SESSION_CART_ID },
    });
    await prisma.promoCodeUsage.deleteMany({});
    await prisma.promoCode.deleteMany({
      where: { code: { startsWith: 'PMT' } },
    });
    // Wipe the test user between tests so each setup creates a fresh row.
    await prisma.user.deleteMany({ where: { id: TEST_USER_UUID } });
  });

  it('applies the MercadoPago percent when the user pays with MercadoPago', async () => {
    await setupUserWithPaymentMethod('MercadoPago');
    await setupCart(TEST_USER_UUID);
    setSessionRole('admin');
    const code = await createPromoCode({
      code: 'PMT-MP-TRANSF',
      description: 'Test',
      discountPercentMercadoPago: 10,
      discountPercentTransferencia: 20,
      isActive: true,
    });
    expect(code.success).toBe(true);
    setSessionRole('user');

    const result = await createOrder({
      shippingMethod: 'envio',
      promoCode: 'PMT-MP-TRANSF',
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findFirst({
      where: { userId: TEST_USER_UUID },
    });
    expect(order).not.toBeNull();
    expect(Number(order!.discountPrice)).toBe(10); // 10% of 100
    expect(order!.promoCode).toBe('PMT-MP-TRANSF');
    expect(order!.paymentMethod).toBe('MercadoPago');
  });

  it('applies the Transferencia percent when the user pays with TransferenciaBancaria', async () => {
    await setupUserWithPaymentMethod('TransferenciaBancaria');
    await setupCart(TEST_USER_UUID);
    setSessionRole('admin');
    await createPromoCode({
      code: 'PMT-MP-TRANSF2',
      description: 'Test',
      discountPercentMercadoPago: 10,
      discountPercentTransferencia: 20,
      isActive: true,
    });
    setSessionRole('user');

    const result = await createOrder({
      shippingMethod: 'envio',
      promoCode: 'PMT-MP-TRANSF2',
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findFirst({
      where: { userId: TEST_USER_UUID },
    });
    expect(order).not.toBeNull();
    expect(Number(order!.discountPrice)).toBe(20); // 20% of 100
    expect(order!.promoCode).toBe('PMT-MP-TRANSF2');
    expect(order!.paymentMethod).toBe('TransferenciaBancaria');
  });

  it('rejects the order when the code only has a MercadoPago percent and the user chose Transferencia', async () => {
    await setupUserWithPaymentMethod('TransferenciaBancaria');
    await setupCart(TEST_USER_UUID);
    setSessionRole('admin');
    await createPromoCode({
      code: 'PMT-ONLY-MP',
      description: 'Test',
      discountPercentMercadoPago: 15,
      discountPercentTransferencia: null,
      isActive: true,
    });
    setSessionRole('user');

    const result = await createOrder({
      shippingMethod: 'envio',
      promoCode: 'PMT-ONLY-MP',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no aplica/i);
  });

  it('rejects the order when the payment method is POS, regardless of code', async () => {
    await setupUserWithPaymentMethod('PuntoDeVenta_Efectivo');
    await setupCart(TEST_USER_UUID);
    setSessionRole('admin');
    await createPromoCode({
      code: 'PMT-POS',
      description: 'Test',
      discountPercentMercadoPago: 10,
      discountPercentTransferencia: 20,
      isActive: true,
    });
    setSessionRole('user');

    const result = await createOrder({
      shippingMethod: 'retiro',
      promoCode: 'PMT-POS',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/punto de venta/i);
  });
});

describe('createPromoCode — split by payment method validation', () => {
  beforeAll(async () => {
    // Stub admin user for requireAdmin. The first describe block deletes this
    // id in its afterAll, so we re-create it here.
    await prisma.user.deleteMany({ where: { id: TEST_USER_UUID } });
    await prisma.user.create({
      data: {
        id: TEST_USER_UUID,
        name: 'Admin',
        email: 'admin-promo-test@test.com',
        role: 'admin',
      },
    });
  });

  afterAll(async () => {
    await prisma.promoCode.deleteMany({
      where: { code: { startsWith: 'PMT-V' } },
    });
    await prisma.user.deleteMany({ where: { id: TEST_USER_UUID } });
    await prisma.$disconnect();
  });

  afterEach(async () => {
    // Make sure the validation tests run with the admin session.
    (auth as jest.Mock).mockResolvedValue({
      user: { id: TEST_USER_UUID, role: 'admin' },
    });
    await prisma.promoCode.deleteMany({
      where: { code: { startsWith: 'PMT-V' } },
    });
  });

  it('rejects when both discount fields are null/zero', async () => {
    setSessionRole('admin');
    const result = await createPromoCode({
      code: 'PMT-V-EMPTY',
      description: 'Empty',
      discountPercentMercadoPago: null,
      discountPercentTransferencia: null,
      isActive: true,
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/al menos un descuento/i);
  });

  it('accepts when only MercadoPago percent is set', async () => {
    setSessionRole('admin');
    const result = await createPromoCode({
      code: 'PMT-V-MP',
      description: 'MP only',
      discountPercentMercadoPago: 12,
      discountPercentTransferencia: null,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });

  it('accepts when only Transferencia percent is set', async () => {
    setSessionRole('admin');
    const result = await createPromoCode({
      code: 'PMT-V-TR',
      description: 'Transf only',
      discountPercentMercadoPago: null,
      discountPercentTransferencia: 25,
      isActive: true,
    });
    expect(result.success).toBe(true);
  });
});
