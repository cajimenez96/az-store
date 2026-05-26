import { prisma } from '@/db/prisma';

export async function createTestUser(overrides: Record<string, unknown> = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${suffix}@test.com`,
      role: 'user',
      ...overrides,
    },
  });
}

export function createTestAdmin(overrides: Record<string, unknown> = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return createTestUser({ role: 'admin', email: `admin-${suffix}@test.com`, ...overrides });
}

export function createTestSeller(overrides: Record<string, unknown> = {}) {
  const suffix = Date.now() + Math.random().toString(36).slice(2, 7);
  return createTestUser({ role: 'seller', email: `seller-${suffix}@test.com`, ...overrides });
}
