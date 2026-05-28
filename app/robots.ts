import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/product/', '/search', '/cart'],
        disallow: [
          '/admin/',
          '/api/',
          '/checkout',
          '/shipping-address',
          '/payment-method',
          '/place-order',
          '/order/',
          '/profile',
          '/user/',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
          '/reset-password',
          '/unauthorized',
        ],
      },
    ],
    sitemap: `${SERVER_URL}/sitemap.xml`,
  };
}
