import Link from 'next/link';
import { getActivePromotion } from '@/lib/actions/promotion.actions';
import { unstable_noStore } from 'next/cache';

export default async function PromoBanner() {
  unstable_noStore();
  const promotion = await getActivePromotion();

  if (!promotion) return null;

  return (
    <div
      className="w-full py-3 px-4 flex items-center justify-between gap-4"
      style={{
        backgroundColor: promotion.bgColor,
        color: promotion.textColor,
      }}
    >
      <div className="flex-1 text-center">
        <p className="font-semibold text-sm md:text-base">{promotion.title}</p>
        {promotion.subtitle && (
          <p className="text-xs md:text-sm opacity-90">{promotion.subtitle}</p>
        )}
      </div>
      {promotion.linkUrl && promotion.linkLabel && (
        <Link
          href={promotion.linkUrl}
          className="px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap"
          style={{
            backgroundColor: promotion.textColor,
            color: promotion.bgColor,
          }}
        >
          {promotion.linkLabel}
        </Link>
      )}
    </div>
  );
}
