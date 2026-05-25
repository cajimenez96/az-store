import { authConfig } from '../../auth.config';

const authorized = authConfig.callbacks.authorized!;

function makeRequest(pathname: string, hasCookie = true) {
  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    cookies: {
      get: (name: string) =>
        hasCookie && name === 'sessionCartId'
          ? { name: 'sessionCartId', value: 'test-cart-id' }
          : undefined,
    },
    headers: new Headers(),
  } as any;
}

function makeSession(role: string) {
  return {
    user: {
      id: 'test-id',
      role,
      name: 'Test User',
      email: 'test@example.com',
    },
    expires: '2099-12-31T23:59:59.000Z',
  } as any;
}

describe('AZ-001 · Middleware: role check para /admin/*', () => {
  describe('sin sesión (unauthenticated)', () => {
    it('deniega /admin y delega redirect a sign-in (retorna false)', () => {
      const result = authorized({
        request: makeRequest('/admin/overview'),
        auth: null,
      });
      expect(result).toBe(false);
    });

    it('permite rutas públicas', () => {
      const result = authorized({
        request: makeRequest('/'),
        auth: null,
      });
      expect(result).toBe(true);
    });
  });

  describe('role: user', () => {
    it('redirige a /unauthorized al intentar acceder a /admin/*', () => {
      const result = authorized({
        request: makeRequest('/admin/overview'),
        auth: makeSession('user'),
      }) as Response;

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(307);
      expect(result.headers.get('location')).toBe('http://localhost/unauthorized');
    });

    it('permite acceso a rutas protegidas no-admin como /profile', () => {
      const result = authorized({
        request: makeRequest('/profile'),
        auth: makeSession('user'),
      });
      expect(result).toBe(true);
    });
  });

  describe('role: seller', () => {
    it('redirige a /unauthorized al intentar acceder a /admin/*', () => {
      const result = authorized({
        request: makeRequest('/admin/orders'),
        auth: makeSession('seller'),
      }) as Response;

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(307);
      expect(result.headers.get('location')).toBe('http://localhost/unauthorized');
    });
  });

  describe('role: admin', () => {
    it('permite acceso a /admin/overview', () => {
      const result = authorized({
        request: makeRequest('/admin/overview'),
        auth: makeSession('admin'),
      });
      expect(result).toBe(true);
    });

    it('permite acceso a /admin/orders', () => {
      const result = authorized({
        request: makeRequest('/admin/orders'),
        auth: makeSession('admin'),
      });
      expect(result).toBe(true);
    });
  });
});
