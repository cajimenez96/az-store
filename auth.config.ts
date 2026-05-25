import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
  providers: [], // Required by NextAuthConfig type
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  callbacks: {
    session({ session, token }) {
      session.user.role = token.role;
      return session;
    },
    authorized({ request, auth }) {
      const protectedPaths = [
        /\/shipping-address/,
        /\/payment-method/,
        /\/place-order/,
        /\/profile/,
        /\/user\/(.*)/,
        /\/order\/(.*)/,
        /\/admin/,
      ];

      const { pathname } = request.nextUrl;

      if (!auth && protectedPaths.some((p) => p.test(pathname))) return false;

      if (auth && /\/admin/.test(pathname) && auth.user?.role !== 'admin') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      if (!request.cookies.get('sessionCartId')) {
        const sessionCartId = crypto.randomUUID();
        const response = NextResponse.next({
          request: {
            headers: new Headers(request.headers),
          },
        });
        response.cookies.set('sessionCartId', sessionCartId);
        return response;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
