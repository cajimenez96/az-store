import { prisma } from '@/db/prisma';
import { mergeCart } from '@/lib/actions/cart.actions';
import type { CartItem } from '@/types';
import {
  createTestUser,
  createTestCategory,
  createTestBrand,
  createTestSize,
  createTestProduct,
  createTestVariant,
  createTestCart,
} from '../../factories';

describe('3.6 · Cart merge on login — integration', () => {
  let userId: string;
  let productId: string;
  let productName: string;
  let productSlug: string;

  const STOCK = 5;

  beforeAll(async () => {
    const user = await createTestUser();
    const category = await createTestCategory();
    const brand = await createTestBrand();
    const size = await createTestSize(category.id, 'M');
    const product = await createTestProduct(category.id, brand.id);
    await createTestVariant(product.id, size.id, STOCK);

    userId = user.id;
    productId = product.id;
    productName = product.name;
    productSlug = product.slug;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function makeCartItem(qty: number): CartItem {
    return {
      productId,
      name: productName,
      slug: productSlug,
      qty,
      image: '/images/test.jpg',
      priceUsed: '50.00',
      paymentMethod: 'CASH',
      size: 'M',
    };
  }

  it('assigns session cart to user when user has no existing cart', async () => {
    const sessionCart = await createTestCart(undefined);
    await prisma.cart.update({
      where: { id: sessionCart.id },
      data: { items: [makeCartItem(2)] as unknown as never },
    });

    await mergeCart(userId, sessionCart.sessionCartId);

    const merged = await prisma.cart.findFirst({ where: { userId } });
    expect(merged).not.toBeNull();
    expect(merged?.id).toBe(sessionCart.id);

    const items = merged?.items as CartItem[];
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(2);
  });

  it('merges non-overlapping items from session cart into existing user cart', async () => {
    const category2 = await createTestCategory();
    const brand2 = await createTestBrand();
    const size2 = await createTestSize(category2.id, 'L');
    const product2 = await createTestProduct(category2.id, brand2.id);
    await createTestVariant(product2.id, size2.id, 10);

    const user2 = await createTestUser();

    const userCart = await createTestCart(user2.id);
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { items: [makeCartItem(1)] as unknown as never },
    });

    const sessionCart = await createTestCart(undefined);
    const sessionItem: CartItem = {
      productId: product2.id,
      name: product2.name,
      slug: product2.slug,
      qty: 2,
      image: '/images/p2.jpg',
      priceUsed: '80.00',
      paymentMethod: 'CASH',
      size: 'L',
    };
    await prisma.cart.update({
      where: { id: sessionCart.id },
      data: { items: [sessionItem] as unknown as never },
    });

    await mergeCart(user2.id, sessionCart.sessionCartId);

    const merged = await prisma.cart.findFirst({ where: { userId: user2.id } });
    const items = merged?.items as CartItem[];
    expect(items).toHaveLength(2);

    // Session cart is deleted after merge
    const deletedSessionCart = await prisma.cart.findUnique({ where: { id: sessionCart.id } });
    expect(deletedSessionCart).toBeNull();
  });

  it('sums quantities when merging overlapping items', async () => {
    const user3 = await createTestUser();

    const userCart = await createTestCart(user3.id);
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { items: [makeCartItem(1)] as unknown as never },
    });

    const sessionCart = await createTestCart(undefined);
    await prisma.cart.update({
      where: { id: sessionCart.id },
      data: { items: [makeCartItem(2)] as unknown as never },
    });

    await mergeCart(user3.id, sessionCart.sessionCartId);

    const merged = await prisma.cart.findFirst({ where: { userId: user3.id } });
    const items = merged?.items as CartItem[];
    expect(items).toHaveLength(1);
    // 1 (user) + 2 (session) = 3, which is <= STOCK (5)
    expect(items[0].qty).toBe(3);
  });

  it('caps merged quantity at available stock when sum would exceed it', async () => {
    const user4 = await createTestUser();

    const userCart = await createTestCart(user4.id);
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { items: [makeCartItem(3)] as unknown as never }, // 3 in user cart
    });

    const sessionCart = await createTestCart(undefined);
    await prisma.cart.update({
      where: { id: sessionCart.id },
      data: { items: [makeCartItem(4)] as unknown as never }, // 4 in session cart → 3+4=7 > STOCK(5)
    });

    await mergeCart(user4.id, sessionCart.sessionCartId);

    const merged = await prisma.cart.findFirst({ where: { userId: user4.id } });
    const items = merged?.items as CartItem[];
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(STOCK); // capped at 5
  });

  it('does nothing when session cart does not exist', async () => {
    const user5 = await createTestUser();
    const userCart = await createTestCart(user5.id);
    await prisma.cart.update({
      where: { id: userCart.id },
      data: { items: [makeCartItem(1)] as unknown as never },
    });

    await expect(mergeCart(user5.id, 'non-existent-session-id')).resolves.not.toThrow();

    const unchanged = await prisma.cart.findFirst({ where: { userId: user5.id } });
    const items = unchanged?.items as CartItem[];
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(1);
  });

  describe('re-resolution from the database', () => {
    async function setupProduct(stock: number, size = 'M') {
      const category = await createTestCategory();
      const brand = await createTestBrand();
      const sz = await createTestSize(category.id, size);
      const product = await createTestProduct(category.id, brand.id);
      await createTestVariant(product.id, sz.id, stock);
      return product;
    }

    function tamperedItem(product: { id: string; name: string; slug: string }, qty: number): CartItem {
      return {
        productId: product.id,
        name: 'Forged name',
        slug: 'forged-slug',
        qty,
        image: '/forged.png',
        priceUsed: '0.01',
        paymentMethod: 'MERCADOPAGO',
        size: 'M',
      };
    }

    async function setItems(cartId: string, items: CartItem[]) {
      await prisma.cart.update({ where: { id: cartId }, data: { items: items as unknown as never } });
    }

    it('re-prices a tampered session cart from the database when user has a cart', async () => {
      const product = await setupProduct(10);
      const user = await createTestUser();
      await createTestCart(user.id);
      const sessionCart = await createTestCart(undefined);
      await setItems(sessionCart.id, [tamperedItem(product, 2)]);

      await mergeCart(user.id, sessionCart.sessionCartId);

      const merged = await prisma.cart.findFirst({ where: { userId: user.id } });
      const items = merged?.items as CartItem[];
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({
        name: product.name,
        slug: product.slug,
        paymentMethod: 'CASH',
        qty: 2,
      });
      expect(Number(items[0].priceUsed)).toBe(100);
      expect(Number(merged?.itemsPrice)).toBe(200);
    });

    it('re-prices a tampered session cart on the no-user-cart path', async () => {
      const product = await setupProduct(10);
      const user = await createTestUser();
      const sessionCart = await createTestCart(undefined);
      await setItems(sessionCart.id, [tamperedItem(product, 3)]);

      await mergeCart(user.id, sessionCart.sessionCartId);

      const merged = await prisma.cart.findFirst({ where: { userId: user.id } });
      expect(merged?.id).toBe(sessionCart.id);
      const items = merged?.items as CartItem[];
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ name: product.name, paymentMethod: 'CASH', qty: 3 });
      expect(Number(items[0].priceUsed)).toBe(100);
      expect(Number(merged?.itemsPrice)).toBe(300);
    });

    it('clamps to variant stock on the no-user-cart path', async () => {
      const product = await setupProduct(2);
      const user = await createTestUser();
      const sessionCart = await createTestCart(undefined);
      await setItems(sessionCart.id, [tamperedItem(product, 50)]);

      await mergeCart(user.id, sessionCart.sessionCartId);

      const merged = await prisma.cart.findFirst({ where: { userId: user.id } });
      expect((merged?.items as CartItem[])[0].qty).toBe(2);
    });

    it('drops items whose product is inactive', async () => {
      const active = await setupProduct(10);
      const inactive = await setupProduct(10);
      await prisma.product.update({ where: { id: inactive.id }, data: { isActive: false } });
      const user = await createTestUser();
      await createTestCart(user.id);
      const sessionCart = await createTestCart(undefined);
      await setItems(sessionCart.id, [tamperedItem(active, 1), tamperedItem(inactive, 1)]);

      await mergeCart(user.id, sessionCart.sessionCartId);

      const merged = await prisma.cart.findFirst({ where: { userId: user.id } });
      const items = merged?.items as CartItem[];
      expect(items.map((i) => i.productId)).toEqual([active.id]);
    });

    it('drops items whose variant has no stock left', async () => {
      const product = await setupProduct(0);
      const user = await createTestUser();
      await createTestCart(user.id);
      const sessionCart = await createTestCart(undefined);
      await setItems(sessionCart.id, [tamperedItem(product, 1)]);

      await mergeCart(user.id, sessionCart.sessionCartId);

      const merged = await prisma.cart.findFirst({ where: { userId: user.id } });
      expect(merged?.items as CartItem[]).toHaveLength(0);
      expect(Number(merged?.itemsPrice)).toBe(0);
    });
  });
});
