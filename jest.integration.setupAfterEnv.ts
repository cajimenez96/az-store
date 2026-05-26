// Global mocks for all integration tests.
// These prevent ESM/Next.js-specific modules from breaking Jest
// while keeping @/db/prisma real (connected to az_store_test).

jest.mock('@/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'test-user-id', role: 'admin' } }),
}));

jest.mock('next/navigation', () => ({
  redirect: jest.fn().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  }),
}));

jest.mock('query-string', () => ({
  stringify: jest.fn(),
  parse: jest.fn(),
  parseUrl: jest.fn(),
  stringifyUrl: jest.fn(),
}));

jest.mock('@/email', () => ({
  sendPurchaseReceipt: jest.fn().mockResolvedValue(undefined),
  sendNewSaleNotification: jest.fn().mockResolvedValue(undefined),
  sendShippingUpdate: jest.fn().mockResolvedValue(undefined),
}));
