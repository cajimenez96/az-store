import { MetadataRoute } from 'next';
import { prisma } from '@/db/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        select: { slug: true, updatedAt: true },
        where: { isFeatured: true }, // Only featured products for sitemap (not featured don't appear in storefront)
      }),
      prisma.category.findMany({
        select: { slug: true },
      }),
    ]);

    const staticPages: MetadataRoute.Sitemap = [
      {
        url: SERVER_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${SERVER_URL}/search`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      },
    ];

    const categoryPages: MetadataRoute.Sitemap = categories.map(category => ({
      url: `${SERVER_URL}/search?category=${category.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const productPages: MetadataRoute.Sitemap = products.map(product => ({
      url: `${SERVER_URL}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    // Fallback to static sitemap if DB query fails
    return [
      {
        url: SERVER_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
  }
}
