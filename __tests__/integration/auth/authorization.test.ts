import { prisma } from '@/db/prisma';
import {
  deleteOrder,
  deliverOrder,
  approveBankTransfer,
  rejectBankTransfer,
} from '@/lib/actions/order.actions';
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

// auth is globally mocked in setupAfterEnv — we control it per test here
import { auth } from '@/auth';
const mockAuth = auth as jest.MockedFunction<typeof auth>;

function asAdmin() {
  mockAuth.mockResolvedValue({ user: { id: 'test-admin-id', role: 'admin' } } as never);
}
function asSeller() {
  mockAuth.mockResolvedValue({ user: { id: 'test-seller-id', role: 'seller' } } as never);
}
function asUser() {
  mockAuth.mockResolvedValue({ user: { id: 'test-user-id', role: 'user' } } as never);
}
function asUnauthenticated() {
  mockAuth.mockResolvedValue(null as never);
}

describe('3.5 · Authorization — integration', () => {
  let userId: string;
  let productId: string;
  let variantId: string;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    const variant = await createTestVariant(product.id, size.id, 20);

    userId = user.id;
    productId = product.id;
    variantId = variant.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('deleteOrder — requires admin', () => {
    it('admin can delete an order and it is removed from DB', async () => {
      asAdmin();
      const order = await createTestOrder(userId);

      const result = await deleteOrder(order.id);

      expect(result.success).toBe(true);
      const deletedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(deletedOrder).toBeNull();
    });

    it('seller cannot delete an order — order remains in DB', async () => {
      asSeller();
      const order = await createTestOrder(userId);

      const result = await deleteOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/NEXT_REDIRECT/);
      const existingOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(existingOrder).not.toBeNull();
    });

    it('regular user cannot delete an order — order remains in DB', async () => {
      asUser();
      const order = await createTestOrder(userId);

      const result = await deleteOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/NEXT_REDIRECT/);
      const existingOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(existingOrder).not.toBeNull();
    });

    it('unauthenticated user cannot delete an order', async () => {
      asUnauthenticated();
      const order = await createTestOrder(userId);

      const result = await deleteOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/NEXT_REDIRECT/);
    });
  });

  describe('deliverOrder — requires admin or seller', () => {
    it('admin can mark an order as delivered', async () => {
      asAdmin();
      const order = await createTestOrder(userId, { isPaid: true, paidAt: new Date() });

      const result = await deliverOrder(order.id);

      expect(result.success).toBe(true);
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.isDelivered).toBe(true);
    });

    it('seller can mark an order as delivered', async () => {
      asSeller();
      const order = await createTestOrder(userId, { isPaid: true, paidAt: new Date() });

      const result = await deliverOrder(order.id);

      expect(result.success).toBe(true);
      const updatedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(updatedOrder?.isDelivered).toBe(true);
    });

    it('regular user cannot mark an order as delivered', async () => {
      asUser();
      const order = await createTestOrder(userId, { isPaid: true, paidAt: new Date() });

      const result = await deliverOrder(order.id);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/NEXT_REDIRECT/);
      const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(unchangedOrder?.isDelivered).toBe(false);
    });
  });

  describe('approveBankTransfer — requires admin or seller', () => {
    it('admin can approve a bank transfer', async () => {
      asAdmin();
      const order = await createTestOrder(userId, {
        paymentMethod: 'TransferenciaBancaria',
        receiptUrl: 'https://cdn.example.com/receipt.jpg',
      });
      await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

      const result = await approveBankTransfer(order.id);

      expect(result.success).toBe(true);
    });

    it('regular user cannot approve a bank transfer', async () => {
      asUser();
      const order = await createTestOrder(userId, {
        paymentMethod: 'TransferenciaBancaria',
        receiptUrl: 'https://cdn.example.com/receipt.jpg',
      });
      await createTestOrderItem(order.id, productId, { size: 'M', qty: 1 });

      const result = await approveBankTransfer(order.id);

      expect(result.success).toBe(false);
      const unchangedOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(unchangedOrder?.isPaid).toBe(false);
    });
  });
});
