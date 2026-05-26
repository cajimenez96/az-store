import { prisma } from '@/db/prisma';
import { updateOrderToPaid } from '@/lib/actions/order.actions';
import {
  createTestUser,
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
  createTestOrder,
  createTestOrderItem,
} from '../../factories';

describe('updateOrderToPaid — integration', () => {
  let userId: string;
  let productId: string;
  let variantId: string;
  let sizeId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, 10);

    userId = user.id;
    productId = product.id;
    variantId = variant.id;
    sizeId = size.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('marks a MercadoPago order as paid and decrements stock', async () => {
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 2 });

    await updateOrderToPaid({ orderId: order.id, mpPaymentId: 'mp-test-001' });

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.isPaid).toBe(true);
    expect(updatedOrder?.mpPaymentId).toBe('mp-test-001');
    expect(updatedOrder?.paidAt).not.toBeNull();

    const updatedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(updatedVariant?.stock).toBe(8); // 10 - 2
  });

  it('rejects a duplicate mpPaymentId (idempotency)', async () => {
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    await expect(
      updateOrderToPaid({ orderId: order.id, mpPaymentId: 'mp-test-001' })
    ).rejects.toThrow('La orden ya está pagada');

    const order2 = await prisma.order.findUnique({ where: { id: order.id } });
    expect(order2?.isPaid).toBe(false);
  });

  it('rejects if order is already paid', async () => {
    const order = await createTestOrder(userId, {
      paymentMethod: 'MercadoPago',
      isPaid: true,
      paidAt: new Date(),
    });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    await expect(
      updateOrderToPaid({ orderId: order.id, mpPaymentId: 'mp-test-already-paid' })
    ).rejects.toThrow('La orden ya está pagada');
  });

  it('rolls back and throws when stock is insufficient', async () => {
    const stockBefore = await prisma.productVariant.findUnique({ where: { id: variantId } });
    const currentStock = stockBefore!.stock;

    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    // Request more than available stock
    await createTestOrderItem(order.id, productId, { size: 'M', qty: currentStock + 5 });

    await expect(
      updateOrderToPaid({ orderId: order.id, mpPaymentId: 'mp-test-overflow' })
    ).rejects.toThrow('Stock insuficiente');

    // Order must remain unpaid
    const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(unchangedOrder?.isPaid).toBe(false);

    // Stock must be untouched
    const unchangedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(unchangedVariant?.stock).toBe(currentStock);
  });

  it('marks a TransferenciaBancaria order as paid without touching stock', async () => {
    const stockBefore = await prisma.productVariant.findUnique({ where: { id: variantId } });
    const stockSnapshot = stockBefore!.stock;

    const order = await createTestOrder(userId, { paymentMethod: 'TransferenciaBancaria' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 3 });

    await updateOrderToPaid({ orderId: order.id });

    const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.isPaid).toBe(true);

    // Stock must NOT be decremented (was already reserved at order creation)
    const unchangedVariant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    expect(unchangedVariant?.stock).toBe(stockSnapshot);
  });
});
