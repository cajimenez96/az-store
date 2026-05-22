'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import Image from 'next/image';
import { useEffect, useState } from 'react';

const TARGET_DATE = new Date('2025-12-31T23:59:59');

const calculateTimeRemaining = (targetDate: Date) => {
  const currentTime = new Date();
  const timeDifference = Math.max(Number(targetDate) - Number(currentTime), 0);
  return {
    days: Math.floor(timeDifference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((timeDifference % (1000 * 60)) / 1000),
  };
};

const DealCountdownDark = () => {
  const [time, setTime] = useState<ReturnType<typeof calculateTimeRemaining>>();

  useEffect(() => {
    setTime(calculateTimeRemaining(TARGET_DATE));
    const interval = setInterval(() => {
      const newTime = calculateTimeRemaining(TARGET_DATE);
      setTime(newTime);
      if (
        newTime.days === 0 &&
        newTime.hours === 0 &&
        newTime.minutes === 0 &&
        newTime.seconds === 0
      ) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return null;

  const expired =
    time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0;

  return (
    <section className='bg-surface-elevated-dark section-cinematic'>
      <div className='wrapper'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-12 items-center'>
          {/* Content */}
          <div>
            <p className='eyebrow-cap text-link-mint mb-4'>Oferta Limitada</p>
            <h2 className='display-lg text-white mb-6'>
              {expired ? 'La oferta ha terminado' : 'Oferta del Mes'}
            </h2>
            {!expired && (
              <p className='text-shade-40 text-base leading-relaxed mb-10 max-w-sm'>
                Aprovechá nuestras ofertas exclusivas del mes. Calidad premium a precios inmejorables.
              </p>
            )}

            {/* Countdown */}
            {!expired && (
              <div className='grid grid-cols-4 gap-3 mb-10 max-w-xs'>
                {[
                  { label: 'Días', value: time.days },
                  { label: 'Hs', value: time.hours },
                  { label: 'Min', value: time.minutes },
                  { label: 'Seg', value: time.seconds },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className='bg-canvas-night-elevated border border-hairline-dark rounded-xl p-3 text-center'
                  >
                    <p className='display-md text-white leading-none mb-1'>{value}</p>
                    <p className='eyebrow-cap text-shade-40'>{label}</p>
                  </div>
                ))}
              </div>
            )}

            <Button asChild variant='outlineOnDark' className='rounded-pill px-8'>
              <Link href='/search'>
                {expired ? 'Ver promociones actuales' : 'Ver productos en oferta'}
              </Link>
            </Button>
          </div>

          {/* Image */}
          <div className='flex justify-center md:justify-end'>
            <div className='relative w-72 h-72 md:w-96 md:h-96 rounded-2xl overflow-hidden shadow-level-2-dark'>
              <Image
                src='/images/promo.jpg'
                alt='Oferta del mes'
                fill
                sizes="100vw"
                className='object-cover'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-black/40 to-transparent' />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DealCountdownDark;
