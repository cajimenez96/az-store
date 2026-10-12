import CartTable from './cart-table';
import { getMyCart } from '@/lib/actions/cart.actions';
import { getPriceComparison } from '@/lib/pricing/compare';
import { withListPrices } from '@/lib/pricing/cart-display';
import { quoteItems } from '@/lib/pricing/quote';

export const metadata = {
  title: 'Carrito de Compras',
};

const CartPage = async () => {
  const cart = await getMyCart();

  const inputs =
    cart?.items.map((item) => ({
      productId: item.productId,
      size: item.size,
      productColorId: item.productColorId,
      qty: item.qty,
    })) ?? [];

  // Show the CURRENT list price from the database instead of the price stored
  // when the item was added. If the quote fails (stock, inactive product...), fall
  // back to the stored cart: the real checks run again in checkout.
  let displayCart = cart;
  if (cart && inputs.length > 0) {
    try {
      displayCart = withListPrices(cart, await quoteItems(inputs, 'MERCADOPAGO'));
    } catch {
      displayCart = cart;
    }
  }

  // Informational only: never let a failed quote break the cart page.
  const comparison =
    inputs.length > 0 ? await getPriceComparison(inputs).catch(() => null) : null;

  return (
    <>
      <CartTable cart={displayCart} comparison={comparison} />
    </>
  );
};

export default CartPage;
