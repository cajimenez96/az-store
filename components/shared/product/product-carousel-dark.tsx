'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Product } from '@/types';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

const ProductCarouselDark = ({ data }: { data: Product[] }) => {
  const featuredWithBanner = data.filter((product) => product.banner);

  if (featuredWithBanner.length === 0) {
    // Fallback hero when no featured products with banners exist
    return (
      <section className='relative flex items-center justify-center bg-canvas-night overflow-hidden pt-24 pb-32 md:pt-32 md:pb-48 min-h-[60vh]'>
        <div className='wrapper relative z-10 text-center'>
          <p className='eyebrow-cap text-link-cool-1 mb-6'>Nueva Colección</p>
          <h1 className='display-xxl text-white mb-8 max-w-4xl mx-auto'>
            Estilo que habla por vos
          </h1>
          <Button asChild variant='outlineOnDark' className='rounded-pill px-10 py-3 text-base'>
            <Link href='/search'>Explorar colección</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className='relative bg-canvas-night overflow-hidden'>
      <Carousel
        className='w-full'
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 8000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent>
          {featuredWithBanner.map((product: Product, index: number) => (
            <CarouselItem key={product.id}>
              <div className='relative w-full min-h-[70vh] md:min-h-[85vh] flex items-end'>
                {/* Full-bleed banner image */}
                <Image
                  src={product.banner!}
                  alt={product.name}
                  fill
                  className='object-cover object-center'
                  priority={index === 0}
                  sizes='100vw'
                />

                {/* Gradient overlay — text reads cleanly over the photo */}
                <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40' />

                {/* Text content — sits at bottom left, like a magazine spread */}
                <div className='relative z-10 wrapper pb-16 md:pb-24'>
                  <p className='eyebrow-cap text-link-cool-1 mb-4'>Destacado</p>
                  <h1 className='display-xl text-white mb-6 max-w-2xl'>
                    {product.name}
                  </h1>
                  <p className='text-white/70 text-base mb-8 max-w-md leading-relaxed'>
                    {product.description}
                  </p>
                  <div className='flex gap-4 flex-wrap'>
                    <Button
                      asChild
                      variant='outlineOnDark'
                      className='rounded-pill px-8 py-3 text-base'
                    >
                      <Link href={`/product/${product.slug}`}>Ver producto</Link>
                    </Button>
                    <Button
                      asChild
                      variant='ghost'
                      className='rounded-pill px-8 py-3 text-base text-white/70 hover:text-white hover:bg-white/10'
                    >
                      <Link href='/search'>Ver colección</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Nav arrows */}
        <CarouselPrevious className='left-4 md:left-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white' />
        <CarouselNext className='right-4 md:right-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white' />
      </Carousel>
    </section>
  );
};

export default ProductCarouselDark;
