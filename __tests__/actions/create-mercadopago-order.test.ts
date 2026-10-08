/**
 * Tests unitarios para createMercadoPagoOrder
 * Protecciones de sesión, titularidad, estado y cuadre de preferencia
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/mercadopago', () => ({
  getMercadoPagoClient: jest.fn().mockResolvedValue({}),
}));

const mockPreferenceCreate = jest.fn();
jest.mock('mercadopago', () => ({
  Preference: jest.fn().mockImplementation(() => ({
    create: mockPreferenceCreate,
  })),
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    order: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import { createMercadoPagoOrder } from '@/lib/actions/order.actions';

describe('createMercadoPagoOrder — Guardias de Seguridad y Cuadre', () => {
  const ORDER_ID = 'order-mp-test-123';
  const USER_ID = 'user-owner-456';

  const baseOrder = {
    id: ORDER_ID,
    userId: USER_ID,
    isPaid: false,
    shippingStatus: 'Pendiente',
    paymentMethod: 'MercadoPago',
    totalPrice: '15000.00',
    itemsPrice: '12000.00',
    shippingPrice: '3000.00',
    discountPrice: null,
    bannerDiscount: null,
    orderitems: [
      {
        productId: 'prod-1',
        name: 'Remera Negra',
        qty: 2,
        priceUsed: '6000.00',
      },
    ],
    user: {
      email: 'owner@test.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { id: USER_ID, role: 'user' },
    });
    (prisma.order.findFirst as jest.Mock).mockResolvedValue(baseOrder);
    (prisma.order.update as jest.Mock).mockResolvedValue({});
    mockPreferenceCreate.mockResolvedValue({
      id: 'pref-999',
      init_point: 'https://mercadopago.com/checkout/test',
    });
    process.env.NEXT_PUBLIC_SERVER_URL = 'http://localhost:3000';
  });

  it('retorna error si no hay sesión autenticada', async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no autorizado/i);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });

  it('retorna error si el usuario no es el dueño ni admin', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'other-user-789', role: 'user' },
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no autorizado/i);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });

  it('permite a un admin crear preferencia para orden de cualquier usuario', async () => {
    (auth as jest.Mock).mockResolvedValue({
      user: { id: 'admin-user', role: 'admin' },
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(true);
    expect(mockPreferenceCreate).toHaveBeenCalled();
  });

  it('retorna error si la orden ya está pagada y no sobreescribe paymentResult', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({
      ...baseOrder,
      isPaid: true,
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/ya está pagada/i);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('retorna error si la orden está cancelada', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({
      ...baseOrder,
      shippingStatus: 'Cancelado',
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/cancelada/i);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });

  it('retorna error si el método de pago no es Mercado Pago', async () => {
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({
      ...baseOrder,
      paymentMethod: 'TransferenciaBancaria',
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/método de pago/i);
    expect(mockPreferenceCreate).not.toHaveBeenCalled();
  });

  it('garantiza que la preferencia suma exactamente order.totalPrice con descuentos de cupón o banner', async () => {
    // Supongamos productos suman $12000, envío $3000, descuento cupón $2500 -> totalPrice = $12500
    (prisma.order.findFirst as jest.Mock).mockResolvedValue({
      ...baseOrder,
      totalPrice: '12500.00',
      discountPrice: '2500.00',
    });

    const result = await createMercadoPagoOrder(ORDER_ID);

    expect(result.success).toBe(true);
    expect(mockPreferenceCreate).toHaveBeenCalled();

    const callArgs = mockPreferenceCreate.mock.calls[0][0];
    const items = callArgs.body.items;

    // Calcular suma total enviada a MP
    const totalSent = items.reduce(
      (sum: number, it: { unit_price: number; quantity: number }) =>
        sum + it.unit_price * it.quantity,
      0
    );

    expect(totalSent).toBe(12500);
  });
});
