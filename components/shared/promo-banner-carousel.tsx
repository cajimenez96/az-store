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
    <section className="relative bg-az-ink-deep overflow-hidden">
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
              <div className="relative w-full min-h-[70vh] md:min-h-[85vh] flex items-end">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover object-center"
                  priority={index === 0}
                  sizes="100vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40" />

                <div className="relative z-10 az-wrapper pb-16 md:pb-24">
                  <h1 className="az-heading-md text-white mb-4 max-w-2xl">{banner.title}</h1>
                  {banner.subtitle && (
                    <p className="text-white/70 text-base mb-8 max-w-md leading-relaxed">
                      {banner.subtitle}
                    </p>
                  )}
                  <Link
                    href={`/search?banner=${banner.id}`}
                    className="inline-block bg-white text-az-ink-deep px-8 py-4 rounded-az-full az-button-md hover:bg-az-surface-soft transition-colors duration-150"
                  >
                    {banner.linkLabel || 'Ver más'}
                  </Link>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-4 md:left-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white" />
        <CarouselNext className="right-4 md:right-8 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white" />
      </Carousel>
    </section>
  );
}
