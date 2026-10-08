import { auth } from '@/auth';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getUserById } from '@/lib/actions/user.actions';
import { getShippingSettings } from '@/lib/actions/settings.actions';
import { getPromoBannerWithProducts } from '@/lib/actions/promo-banner.actions';
import { ShippingAddress } from '@/types';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import PlaceOrderContent from './place-order-content';
import { priceMethodFor } from '@/lib/pricing/price-method';
import { quoteItems } from '@/lib/pricing/quote';
import { calcTax } from '@/lib/pricing/totals';

export const metadata: Metadata = {
  title: 'Confirmar Compra',
};

const PlaceOrderPage = async () => {
  const cart = await getMyCart();
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) redirect('/sign-in');

  const user = await getUserById(userId);
  const shippingSettings = await getShippingSettings();

  if (!cart || cart.items.length === 0) redirect('/cart');
  if (!user.address) redirect('/shipping-address');
  if (!user.paymentMethod) redirect('/payment-method');

  const userAddress = user.address as ShippingAddress;

  // The server quote is the source of truth for what createOrder will charge:
  // only the identity and qty of the cart lines are used, never stored prices.
  let quote;
  try {
    quote = await quoteItems(
      cart.items.map((item) => ({
        productId: item.productId,
        size: item.size,
        productColorId: item.productColorId,
        qty: item.qty,
      })),
      priceMethodFor('web', user.paymentMethod)
    );
  } catch {
    // Stock shortage, inactive product, unknown variant or invalid payment method.
    redirect('/cart');
  }
  const quotedLines = quote.lines.map((line) => ({
    productId: line.productId,
    name: line.name,
    slug: line.slug,
    image: line.image,
    size: line.size,
    qty: line.qty,
    priceUsed: line.priceUsed,
  }));
  const quotedItemsPrice = quote.itemsPrice;
  const quotedTaxPrice = calcTax(quotedItemsPrice);

  // Read the activeBanner cookie (set client-side in the search page — not httpOnly)
  const cookieStore = await cookies();
  const activeBannerId = cookieStore.get('activeBanner')?.value;
  const activeBanner = activeBannerId
    ? await getPromoBannerWithProducts(activeBannerId)
    : null;

  const PAYMENT_LABELS: Record<string, string> = {
    MercadoPago: 'Mercado Pago (Online)',
    TransferenciaBancaria: 'Transferencia Bancaria',
    PuntoDeVenta_Efectivo: 'Punto de Venta — Efectivo',
    PuntoDeVenta_Transferencia: 'Punto de Venta — Transferencia',
    PuntoDeVenta_QR: 'Punto de Venta — QR',
    PuntoDeVenta_MercadoPago: 'Punto de Venta — Mercado Pago (Terminal)',
  };

  return (
    <PlaceOrderContent
      cart={cart}
      quotedLines={quotedLines}
      quotedItemsPrice={quotedItemsPrice}
      quotedTaxPrice={quotedTaxPrice}
      userAddress={userAddress}
      userEmail={user.email || ''}
      paymentMethod={user.paymentMethod}
      freeShippingThreshold={shippingSettings.freeShippingThreshold}
      PAYMENT_LABELS={PAYMENT_LABELS}
      activeBanner={
        activeBanner
          ? {
              id: activeBanner.id,
              title: activeBanner.title,
              discountPercent: activeBanner.discountPercent,
              products: activeBanner.products,
            }
          : null
      }
    />
  );
};

export default PlaceOrderPage;
