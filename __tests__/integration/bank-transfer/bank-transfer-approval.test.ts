import { prisma } from '@/db/prisma';
import { approveBankTransfer, rejectBankTransfer } from '@/lib/actions/order.actions';
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

describe('3.3 · TransferenciaBancaria — integration', () => {
  let userId: string;
  let productId: string;
  let variantId: string;
  const INITIAL_STOCK = 20;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, INITIAL_STOCK);

    userId = user.id;
    productId = product.id;
    variantId = variant.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  async function setupTbOrder(qty: number) {
    const order = await createTestOrder(userId, { paymentMethod: 'TransferenciaBancaria' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty });

    // Simulate stock reservation that createOrder() performs for TB
    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { decrement: qty } },
    });

    return order;
  }

  it('approving TB order marks it as paid without decrementing stock again', async () => {
    const qty = 2;
    const order = await setupTbOrder(qty);

    const stockAfterCreation = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    // Set receiptUrl to satisfy the guard in approveBankTransfer
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptUrl: 'https://cdn.example.com/receipts/test-receipt.jpg' },
    });

    const result = await approveBankTransfer(order.id);

    expect(result.success).toBe(true);

    const approvedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(approvedOrder?.isPaid).toBe(true);
    expect(approvedOrder?.paidAt).not.toBeNull();

    // Stock must NOT be decremented again — was already reserved at order creation
    const stockAfterApproval = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfterApproval).toBe(stockAfterCreation);
  });

  it('rejecting TB order marks it as cancelled and restores stock', async () => {
    const qty = 3;
    const order = await setupTbOrder(qty);

    const stockAfterCreation = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;

    const result = await rejectBankTransfer(order.id);

    expect(result.success).toBe(true);

    const rejectedOrder = await prisma.order.findUnique({ where: { id: order.id } });
    expect(rejectedOrder?.receiptUrl).toBeNull();
    expect(rejectedOrder?.isPaid).toBe(false);

    // Stock must be restored
    const stockAfterRejection = (await prisma.productVariant.findUnique({ where: { id: variantId } }))!.stock;
    expect(stockAfterRejection).toBe(stockAfterCreation + qty);
  });

  it('rejects approval when order has no receipt uploaded', async () => {
    const order = await createTestOrder(userId, { paymentMethod: 'TransferenciaBancaria' });
    await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

    const result = await approveBankTransfer(order.id);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/comprobante/i);
  });

  it('rejects approval when order is not a TB order', async () => {
    const order = await createTestOrder(userId, { paymentMethod: 'MercadoPago' });
    await prisma.order.update({
      where: { id: order.id },
      data: { receiptUrl: 'https://cdn.example.com/receipts/test.jpg' },
    });

    const result = await approveBankTransfer(order.id);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/transferencia bancaria/i);
  });
});
