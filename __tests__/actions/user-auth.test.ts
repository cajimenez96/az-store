/**
 * AZ-002 · Protección de mutación de usuario contra peticiones no autorizadas
 * Verifica que updateUserAddress, updateUserPaymentMethod y updateProfile
 * exijan sesión activa con user.id y no muten ningún usuario en caso anónimo.
 */

jest.mock('@/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('@/lib/email', () => ({
  sendWelcomeEmail: jest.fn(),
}));

jest.mock('@/lib/rate-limiter', () => ({
  loginLimiter: {
    limit: jest.fn().mockResolvedValue({ success: true }),
  },
}));

jest.mock('@/db/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { auth } from '@/auth';
import { prisma } from '@/db/prisma';
import {
  updateUserAddress,
  updateUserPaymentMethod,
  updateProfile,
  getUserById,
} from '../../lib/actions/user.actions';

const mockAuth = auth as unknown as jest.Mock;
const mockPrismaUser = prisma.user as unknown as {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
};

const validAddress = {
  fullName: 'Juan Perez',
  streetAddress: 'Av. Corrientes 1234',
  city: 'CABA',
  province: 'Buenos Aires',
  postalCode: '1000',
  country: 'Argentina',
  phone: '+541112345678',
  contactEmail: 'juan@example.com',
  lat: 0,
  lng: 0,
};

describe('AZ-002 · Bypass de autenticación en actualización de perfil (Server Actions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserAddress', () => {
    it('retorna error de no autorizado y NO llama a prisma.user.update cuando no hay sesión', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUserAddress(validAddress);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no autorizado/i);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
      expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
    });

    it('retorna error de no autorizado cuando session existe pero user.id es undefined', async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await updateUserAddress(validAddress);

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no autorizado/i);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
    });

    it('actualiza la dirección del usuario autenticado buscando con findUnique por su id', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'usr-authenticated-1', name: 'Test' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-authenticated-1',
        name: 'Test',
      });
      mockPrismaUser.update.mockResolvedValue({ id: 'usr-authenticated-1' });

      const result = await updateUserAddress(validAddress);

      expect(result.success).toBe(true);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'usr-authenticated-1' },
      });
      expect(mockPrismaUser.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'usr-authenticated-1' },
        })
      );
    });
  });

  describe('updateUserPaymentMethod', () => {
    it('retorna error de no autorizado y NO llama a prisma.user.update cuando no hay sesión', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateUserPaymentMethod({
        type: 'CashOnDelivery',
        internalMethod: 'CASH',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no autorizado/i);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
      expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
    });

    it('actualiza el método de pago del usuario autenticado usando findUnique', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'usr-authenticated-2', name: 'Test' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-authenticated-2',
        name: 'Test',
      });
      mockPrismaUser.update.mockResolvedValue({ id: 'usr-authenticated-2' });

      const result = await updateUserPaymentMethod({
        type: 'MercadoPago',
        internalMethod: 'MERCADOPAGO',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'usr-authenticated-2' },
      });
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'usr-authenticated-2' },
        data: { paymentMethod: 'MercadoPago' },
      });
    });
  });

  describe('updateProfile', () => {
    it('retorna error de no autorizado y NO llama a prisma.user.update cuando no hay sesión', async () => {
      mockAuth.mockResolvedValue(null);

      const result = await updateProfile({
        name: 'Hacker Name',
        email: 'hacker@test.com',
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/no autorizado/i);
      expect(mockPrismaUser.update).not.toHaveBeenCalled();
      expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
    });

    it('actualiza el perfil del usuario autenticado usando findUnique', async () => {
      mockAuth.mockResolvedValue({
        user: { id: 'usr-authenticated-3', name: 'Original Name' },
      });
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-authenticated-3',
        name: 'Original Name',
      });
      mockPrismaUser.update.mockResolvedValue({ id: 'usr-authenticated-3' });

      const result = await updateProfile({
        name: 'Updated Name',
        email: 'updated@test.com',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'usr-authenticated-3' },
      });
      expect(mockPrismaUser.update).toHaveBeenCalledWith({
        where: { id: 'usr-authenticated-3' },
        data: { name: 'Updated Name' },
      });
    });
  });

  describe('getUserById', () => {
    it('lanza error si userId es una cadena vacía o falsy sin consultar findUnique', async () => {
      await expect(getUserById('')).rejects.toThrow(/usuario no encontrado/i);
      expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    });

    it('busca el usuario usando findUnique por id', async () => {
      mockPrismaUser.findUnique.mockResolvedValue({
        id: 'usr-123',
        name: 'John',
      });

      const user = await getUserById('usr-123');

      expect(user).toEqual({ id: 'usr-123', name: 'John' });
      expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
        where: { id: 'usr-123' },
      });
    });
  });
});
