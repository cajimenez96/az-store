'use client';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Loader } from 'lucide-react';
import { Cart } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { addItemToCart, removeItemFromCart } from '@/lib/actions/cart.actions';
import { useTransition } from 'react';

// The server resolves price, name, image and qty; the client only picks the variant.
type AddToCartItem = {
  productId: string;
  size?: string;
  productColorId?: string;
};

const AddToCart = ({ cart, item }: { cart?: Cart; item: AddToCartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addItemToCart({
        productId: item.productId,
        size: item.size,
        productColorId: item.productColorId,
      });

      if (!res.success) {
        toast({
          variant: 'destructive',
          description: res.message,
        });
        return;
      }

      // Handle success add to cart
      toast({
        description: res.message,
        duration: 3000,
        action: (
          <ToastAction
            altText='Ir al Carrito'
            onClick={() => router.push('/cart')}
          >
            Ver Carrito
          </ToastAction>
        ),
      });
    });
  };

  // Handle remove from cart
  const handleRemoveFromCart = async () => {
    startTransition(async () => {
      const res = await removeItemFromCart(
        item.productId,
        item.size,
        item.productColorId
      );

      toast({
        variant: res.success ? 'default' : 'destructive',
        description: res.message,
        duration: 3000,
      });

      return;
    });
  };

  // Check if item is in cart
  const existItem =
    cart &&
    cart.items.find(
      (x) =>
        x.productId === item.productId &&
        x.size === item.size &&
        x.productColorId === item.productColorId
    );

  return existItem ? (
    <div className='flex items-center justify-between w-full bg-nike-soft-cloud rounded-nike-lg p-1'>
      <button
        type='button'
        onClick={handleRemoveFromCart}
        disabled={isPending}
        className='w-11 h-11 rounded-full bg-white text-nike-ink flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50'
        aria-label='Reducir cantidad'
      >
        {isPending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Minus className='w-4 h-4' />
        )}
      </button>
      <span className='font-sans text-base font-medium text-nike-ink px-3'>{existItem.qty} en carrito</span>
      <button
        type='button'
        onClick={handleAddToCart}
        disabled={isPending}
        className='w-11 h-11 rounded-full bg-nike-ink text-white flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50'
        aria-label='Aumentar cantidad'
      >
        {isPending ? (
          <Loader className='w-4 h-4 animate-spin' />
        ) : (
          <Plus className='w-4 h-4' />
        )}
      </button>
    </div>
  ) : (
    <button
      className='w-full inline-flex items-center justify-center gap-2 bg-nike-ink hover:bg-nike-charcoal text-white min-h-12 py-3 px-8 rounded-nike-lg font-sans text-base font-medium transition-all active:scale-95 disabled:opacity-50'
      type='button'
      disabled={isPending}
      onClick={handleAddToCart}
    >
      {isPending ? (
        <Loader className='w-4 h-4 animate-spin' />
      ) : (
        <Plus className='w-4 h-4' />
      )}
      Agregar al Carrito
    </button>
  );
};

export default AddToCart;
