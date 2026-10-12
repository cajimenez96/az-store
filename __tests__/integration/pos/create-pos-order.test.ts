import { prisma } from '@/db/prisma';
import { createPosOrder } from '@/lib/actions/order.actions';
import type { CartItem } from '@/types';
import {
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
} from '../../factories';

// Real UUID of an admin that exists in the DB: createPosOrder looks the seller up
// by id to read the commission rate. The factory creates CASH = 100.00 and
// MERCADOPAGO = 110.00 prices for every product.
const SELLER_ID = '00000000-0000-0000-0000-0000000000b4';
const COMMISSION_RATE = 0.1;

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({
    user: { id: '00000000-0000-0000-0000-0000000000b4', role: 'admin' },
  }),
}));

describe('3.2 · createPosOrder — integration', () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { id: SELLER_ID } });
    await prisma.user.create({
      data: {
        id: SELLER_ID,
        name: 'POS Test Admin',
        email: `pos-admin-${Date.now()}@test.com`,
        role: 'admin',
        commissionRate: COMMISSION_RATE,
      },
    });
  });

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { sellerId: SELLER_ID } });
    await prisma.user.deleteMany({ where: { id: SELLER_ID } });
    await prisma.$disconnect();
  });

  async function newProduct(stock = 10) {
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, stock);
    return { product, variant };
  }

  // Mirrors what a malicious POS client could send: fake name and price.
  function makeItem(
    product: { id: string; name: string; slug: string },
    qty: number,
    overrides: Partial<CartItem> = {}
  ): CartItem {
    return {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      qty,
      image: '/images/test.jpg',
      priceUsed: '50.00',
      paymentMethod: 'CASH',
      size: 'M',
      ...overrides,
    };
  }

  async function stockOf(variantId: string) {
    return (await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;
  }

  it('creates a paid, delivered order and decrements stock', async () => {
    const { product, variant } = await newProduct(10);

    const result = await createPosOrder({
      items: [makeItem(product, 2)],
      paymentMethod: 'PuntoDeVenta_Efectivo',
    });

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    expect(order?.isPaid).toBe(true);
    expect(order?.isDelivered).toBe(true);
    expect(order?.paidAt).not.toBeNull();
    expect(order?.deliveredAt).not.toBeNull();
    expect(order?.paymentMethod).toBe('PuntoDeVenta_Efectivo');

    expect(await stockOf(variant.id)).toBe(8);
  });

  it('rolls back entirely when stock is insufficient — no order, no stock change', async () => {
    const { product, variant } = await newProduct(3);
    const ordersBefore = await prisma.order.count({ where: { sellerId: SELLER_ID } });

    const result = await createPosOrder({
      items: [makeItem(product, 8)],
      paymentMethod: 'PuntoDeVenta_Efectivo',
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/stock/i);

    expect(await stockOf(variant.id)).toBe(3);
    expect(await prisma.order.count({ where: { sellerId: SELLER_ID } })).toBe(ordersBefore);
  });

  it('associates order to "Consumidor Final" when no customer data is provided', async () => {
    const { product } = await newProduct();

    const result = await createPosOrder({
      items: [makeItem(product, 1)],
      paymentMethod: 'PuntoDeVenta_Efectivo',
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    const customer = await prisma.user.findUnique({ where: { id: order!.userId } });

    expect(customer?.email).toBe('consumidorfinal@local.store');
    expect(customer?.name).toBe('Consumidor Final');
  });

  it('creates a new customer user when provided email does not exist in DB', async () => {
    const { product } = await newProduct();
    const uniqueEmail = `newcustomer-${Date.now()}@test.com`;
    const customerName = 'Juan Pérez';

    const result = await createPosOrder({
      items: [makeItem(product, 1)],
      paymentMethod: 'PuntoDeVenta_Efectivo',
      customerEmail: uniqueEmail,
      customerName,
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    const customer = await prisma.user.findUnique({ where: { id: order!.userId } });

    expect(customer?.email).toBe(uniqueEmail);
    expect(customer?.name).toBe(customerName);
    expect(customer?.role).toBe('user');
  });

  it('finds existing customer by DNI and associates order without creating a duplicate', async () => {
    const { product } = await newProduct();
    const uniqueDni = `DNI-${Date.now()}`;
    const existingUser = await prisma.user.create({
      data: {
        name: 'Cliente Existente',
        email: `existing-${Date.now()}@test.com`,
        dni: uniqueDni,
        role: 'user',
      },
    });

    const result = await createPosOrder({
      items: [makeItem(product, 1)],
      paymentMethod: 'PuntoDeVenta_Efectivo',
      customerDni: uniqueDni,
    });

    expect(result.success).toBe(true);

    const order = await prisma.order.findUnique({ where: { id: result.orderId! } });
    expect(order?.userId).toBe(existingUser.id);

    const duplicates = await prisma.user.findMany({ where: { dni: uniqueDni } });
    expect(duplicates.length).toBe(1);
  });

  describe('server-side pricing', () => {
    it('ignores the client price, name and image and uses the DB CASH price', async () => {
      const { product } = await newProduct();

      const result = await createPosOrder({
        items: [
          makeItem(product, 2, {
            priceUsed: '0.01',
            name: 'FAKE NAME',
            slug: 'fake-slug',
            image: '/fake.jpg',
            paymentMethod: 'MERCADOPAGO',
          }),
        ],
        paymentMethod: 'PuntoDeVenta_Efectivo',
      });

      expect(result.success).toBe(true);
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: result.orderId! },
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

    it.each([
      ['PuntoDeVenta_Efectivo', 100, 'CASH'],
      ['PuntoDeVenta_Transferencia', 100, 'CASH'],
      ['PuntoDeVenta_MercadoPago', 110, 'MERCADOPAGO'],
      ['PuntoDeVenta_QR', 110, 'MERCADOPAGO'],
    ])('%s charges the %s list price (%s)', async (method, expectedPrice, expectedList) => {
      const { product } = await newProduct();

      const result = await createPosOrder({
        items: [makeItem(product, 1, { priceUsed: '0.01' })],
        paymentMethod: method,
      });

      expect(result.success).toBe(true);
      const order = await prisma.order.findUniqueOrThrow({
        where: { id: result.orderId! },
        include: { orderitems: true },
      });
      expect(order.paymentMethod).toBe(method);
      expect(Number(order.orderitems[0].priceUsed)).toBe(expectedPrice);
      expect(order.orderitems[0].paymentMethod).toBe(expectedList);
      expect(Number(order.totalPrice)).toBe(expectedPrice);
    });

    it('computes the seller commission on the server total, not on the client price', async () => {
      const { product } = await newProduct();

      const result = await createPosOrder({
        items: [makeItem(product, 2, { priceUsed: '0.01' })],
        paymentMethod: 'PuntoDeVenta_Efectivo',
      });

      expect(result.success).toBe(true);
      const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId! } });
      expect(order.sellerId).toBe(SELLER_ID);
      expect(Number(order.totalPrice)).toBe(200);
      expect(Number(order.commissionAmount)).toBe(200 * COMMISSION_RATE);
    });

    it('rejects an invalid POS payment method without creating an order', async () => {
      const { product, variant } = await newProduct(10);
      const ordersBefore = await prisma.order.count({ where: { sellerId: SELLER_ID } });

      const result = await createPosOrder({
        items: [makeItem(product, 1)],
        paymentMethod: 'Efectivo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/Método de pago no válido/);
      expect(await stockOf(variant.id)).toBe(10);
      expect(await prisma.order.count({ where: { sellerId: SELLER_ID } })).toBe(ordersBefore);
    });

    it('rejects two lines of the same variant whose combined qty exceeds stock', async () => {
      const { product, variant } = await newProduct(5);
      const ordersBefore = await prisma.order.count({ where: { sellerId: SELLER_ID } });

      const result = await createPosOrder({
        items: [makeItem(product, 3), makeItem(product, 3)],
        paymentMethod: 'PuntoDeVenta_Efectivo',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/stock/i);
      expect(await stockOf(variant.id)).toBe(5);
      expect(await prisma.order.count({ where: { sellerId: SELLER_ID } })).toBe(ordersBefore);
    });

    it('rejects a non-positive qty', async () => {
      const { product, variant } = await newProduct(5);

      const result = await createPosOrder({
        items: [makeItem(product, -2)],
        paymentMethod: 'PuntoDeVenta_Efectivo',
      });

      expect(result.success).toBe(false);
      expect(await stockOf(variant.id)).toBe(5);
    });

    it('decrements the exact variant that the quote validated, even for a sizeless line', async () => {
      // The sized variant is created first, so a lookup without a size filter would hit it.
      const { product, variant: sizedVariant } = await newProduct(5);
      const sizelessVariant = await prisma.productVariant.create({
        data: { productId: product.id, sizeId: null, stock: 3 },
      });

      const result = await createPosOrder({
        items: [makeItem(product, 1, { size: undefined })],
        paymentMethod: 'PuntoDeVenta_Efectivo',
      });

      expect(result.success).toBe(true);
      expect(await stockOf(sizedVariant.id)).toBe(5);
      expect(await stockOf(sizelessVariant.id)).toBe(2);
    });
  });
});
