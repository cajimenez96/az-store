/**
 * AZ-002 · Verificación de validación de credenciales en authorize()
 * Valida con signInFormSchema antes de consultar la base de datos
 * y previene consultas findFirst con email indefinido.
 */

jest.mock('@/db/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

import { prisma } from '@/db/prisma';
import { compare } from 'bcryptjs';
import { authorizeUser } from '@/lib/auth/authorize';

const mockPrismaUser = prisma.user as unknown as {
  findFirst: jest.Mock;
  findUnique: jest.Mock;
};
const mockCompare = compare as unknown as jest.Mock;

describe('AZ-002 · Autenticación de credenciales (authorizeUser)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna null sin consultar prisma si credentials es null o undefined', async () => {
    const resNull = await authorizeUser(null);
    const resUndef = await authorizeUser(undefined);

    expect(resNull).toBeNull();
    expect(resUndef).toBeNull();
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
  });

  it('retorna null sin consultar prisma si falta el campo email', async () => {
    const result = await authorizeUser({ password: 'password123' });

    expect(result).toBeNull();
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
  });

  it('retorna null sin consultar prisma si el email tiene formato inválido', async () => {
    const result = await authorizeUser({
      email: 'not-an-email',
      password: 'password123',
    });

    expect(result).toBeNull();
    expect(mockPrismaUser.findUnique).not.toHaveBeenCalled();
    expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
  });

  it('retorna null si el usuario no existe en la base de datos', async () => {
    mockPrismaUser.findUnique.mockResolvedValue(null);

    const result = await authorizeUser({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result).toBeNull();
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: expect.any(Object),
    });
  });

  it('retorna null si la contraseña no coincide', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'usr-1',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'User One',
      role: 'user',
    });
    mockCompare.mockResolvedValue(false);

    const result = await authorizeUser({
      email: 'user@example.com',
      password: 'wrongpassword',
    });

    expect(result).toBeNull();
    expect(mockCompare).toHaveBeenCalledWith('wrongpassword', 'hashed-password');
  });

  it('retorna el usuario autenticado con findUnique cuando las credenciales son válidas', async () => {
    mockPrismaUser.findUnique.mockResolvedValue({
      id: 'usr-1',
      email: 'user@example.com',
      password: 'hashed-password',
      name: 'User One',
      role: 'user',
    });
    mockCompare.mockResolvedValue(true);

    const result = await authorizeUser({
      email: 'USER@EXAMPLE.COM',
      password: 'validpassword123',
    });

    expect(result).toEqual({
      id: 'usr-1',
      name: 'User One',
      email: 'user@example.com',
      role: 'user',
    });
    expect(mockPrismaUser.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
      },
    });
    expect(mockPrismaUser.findFirst).not.toHaveBeenCalled();
  });
});
