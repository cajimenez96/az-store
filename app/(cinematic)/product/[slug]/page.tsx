import { getProductBySlug } from '@/lib/actions/product.actions';
import { notFound } from 'next/navigation';
import { getMyCart } from '@/lib/actions/cart.actions';
import ProductGalleryAndActions from '@/components/shared/product/product-gallery-and-actions';
import Link from 'next/link';
import { Metadata } from 'next';
import { prisma } from '@/db/prisma';
import { SERVER_URL } from '@/lib/constants';
import { extractDualPrice } from '@/lib/duo-pricing';

// ISR: regenerate every 1 hour
export const revalidate = 3600;

// Pre-generate PDPs for all products at build time
export async function generateStaticParams() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return products.map((product) => ({
      slug: product.slug,
    }));
  } catch (error) {
    console.error('Error generating static params for products:', error);
    return [];
  }
}

// Dynamic metadata for SEO
export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return { title: 'Producto no encontrado' };
  }

  const description = product.description || `Compra ${product.name} en AZ Store`;
  const imageUrl = product.images[0] || '/opengraph-image.png';

  return {
    title: product.name,
    description,
    openGraph: {
      type: 'website',
      title: product.name,
      description,
      url: `${SERVER_URL}/product/${product.slug}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: [imageUrl],
    },
  };
}

const ProductDetailsPage = async (props: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const cart = await getMyCart();

  const totalStock = (product.variants ?? []).reduce(
    (sum, v) => sum + v.stock,
    0
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    brand: {
      '@type': 'Brand',
      name: product.brand?.name || 'AZ Store',
    },
    offers: {
      '@type': 'Offer',
      // Fase 2: para SEO/Schema.org usamos el precio base (CASH) como referencia
      price: extractDualPrice(product).priceCash,
      priceCurrency: 'ARS',
      availability:
        totalStock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className='bg-white min-h-screen'>
        <div className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10'>
          {/* Breadcrumb */}
          <nav className='flex items-center gap-2 font-sans text-xs sm:text-sm text-nike-mute mb-8'>
            <Link href='/' className='hover:text-nike-ink transition-colors'>
              Inicio
            </Link>
            <span>/</span>
            <Link href='/search' className='hover:text-nike-ink transition-colors'>
              Productos
            </Link>
            <span>/</span>
            <Link
              href={`/search?category=${product.category.slug}`}
              className='hover:text-nike-ink transition-colors'
            >
              {product.category.name}
            </Link>
            <span>/</span>
            <span className='text-nike-ink font-medium truncate max-w-[200px] sm:max-w-none'>
              {product.name}
            </span>
          </nav>

          {/* Product grid: gallery + purchase rail */}
          <div className='space-y-12'>
            <ProductGalleryAndActions product={product} cart={cart} />

            {/* Description & Specs Section */}
            <div className='border-t border-nike-hairline-soft pt-8 grid grid-cols-1 md:grid-cols-2 gap-8'>
              <div>
                <h3 className='font-sans text-xs font-semibold text-nike-mute uppercase tracking-widest mb-3'>
                  Detalles del Producto
                </h3>
                <p className='font-sans text-sm sm:text-base text-nike-charcoal leading-relaxed'>
                  {product.description}
                </p>
              </div>
              <div className='bg-nike-soft-cloud p-6 rounded-none flex flex-col justify-center'>
                <h4 className='font-sans text-sm font-semibold text-nike-ink mb-2'>
                  Envíos y Devoluciones
                </h4>
                <p className='font-sans text-xs sm:text-sm text-nike-mute leading-relaxed'>
                  Despachamos a todo el país. Pagos 100% seguros con Mercado Pago y transferencia bancaria.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom padding on mobile to account for sticky bar */}
        <div className='h-24 md:hidden' />
      </div>
    </>
  );
};

export default ProductDetailsPage;
