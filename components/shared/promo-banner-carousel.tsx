'use client';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { PromoBanner } from '@prisma/client';
import Autoplay from 'embla-carousel-autoplay';
import Link from 'next/link';
import Image from 'next/image';

export default function PromoBannerCarousel({ banners }: { banners: PromoBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <section className="relative bg-nike-ink overflow-hidden">
      <Carousel
        className="w-full"
        opts={{ loop: true }}
        plugins={[
          Autoplay({
            delay: 7000,
            stopOnInteraction: true,
            stopOnMouseEnter: true,
          }),
        ]}
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div className="relative w-full min-h-[75vh] md:min-h-[90vh] flex items-end">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />

                {/* Editorial gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />

                <div className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-8 lg:px-12 w-full pb-16 md:pb-24">
                  <h1 className="font-nike-display text-5xl sm:text-7xl md:text-8xl lg:text-[96px] leading-[0.9] uppercase tracking-tight text-white mb-3 max-w-4xl drop-shadow-md">
                    {banner.title}
                  </h1>
                  {banner.subtitle && (
                    <p className="font-sans text-white/90 text-base md:text-lg mb-8 max-w-xl leading-relaxed font-normal">
                      {banner.subtitle}
                    </p>
                  )}
                  <Link
                    href={`/search?banner=${banner.id}`}
                    className="inline-flex items-center justify-center bg-white text-nike-ink px-8 py-3.5 rounded-full text-base font-medium hover:bg-nike-soft-cloud active:scale-95 transition-all shadow-sm"
                  >
                    {banner.linkLabel || 'Comprar ahora'}
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-4 md:left-8 bg-white/80 hover:bg-white text-nike-ink border-0 h-11 w-11 shadow-md" />
        <CarouselNext className="right-4 md:right-8 bg-white/80 hover:bg-white text-nike-ink border-0 h-11 w-11 shadow-md" />
      </Carousel>
    </section>
  );
}
