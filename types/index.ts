import { z } from 'zod';
import {
  insertProductSchema,
  insertCartSchema,
  cartItemSchema,
  shippingAddressSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  paymentResultSchema,
  insertReviewSchema,
  insertColorSchema,
  updateColorSchema,
} from '@/lib/validators';

// Fase 1: tipos de Color
export type Color = z.infer<typeof insertColorSchema> & {
  id: string;
  createdAt: Date;
};

export type ColorInput = z.infer<typeof insertColorSchema>;
export type ColorUpdate = z.infer<typeof updateColorSchema>;

// Fase 1: pivot producto-color con galería propia
export type ProductColor = {
  id: string;
  productId: string;
  colorId: string;
  color?: Color;
  images: string[];
  order: number;
  createdAt?: Date;
};

// Fase 2: enum interno de dual pricing (matches Prisma `PaymentMethod`)
export type PaymentMethod = 'CASH' | 'MERCADOPAGO';

// Fase 2: tabla de precios del producto (uno por método de pago)
export type Price = {
  id: string;
  productId: string;
  paymentMethod: PaymentMethod;
  value: string; // Decimal serializado
  createdAt: Date;
};

// Fase 1: ProductVariant con sizeId/colorId opcionales
export type ProductVariant = {
  id: string;
  productId: string;
  sizeId: string | null;
  colorId: string | null;       // referencia a ProductColor.id
  stock: number;
  size?: { id: string; name: string; categoryId: string } | null;
  productColor?: (ProductColor & { color: Color }) | null;
};

export type Product = Omit<z.infer<typeof insertProductSchema>, 'priceCash' | 'priceMercadoPago'> & {
  id: string;
  rating: string;
  numReviews: number;
  hasColorVariants: boolean;
  createdAt: Date;
  // Fase 2: `priceCash` y `priceMercadoPago` son opcionales en el tipo público
  // (la fuente de verdad es `prices: Price[]` con su `extractDualPrice`).
  // Se mantienen aquí solo porque el form de admin los usa como campos
  // separados, y `ProductFormValues` (z.infer de `insertProductSchema`) los
  // requiere. Si la query no los incluye (ej: `getFeaturedProducts` con
  // `prices` ya cargados), `extractDualPrice` los deriva.
  priceCash?: string;
  priceMercadoPago?: string;
  brand?: { name: string; id: string; createdAt: Date; slug: string } | null;
  category?: { name: string; id: string; createdAt: Date; slug: string } | null;
  subCategory?: { name: string; id: string; createdAt: Date; slug: string } | null;
  colors?: ProductColor[];
  variants?: ProductVariant[];
  prices?: Price[];
};

export type Cart = z.infer<typeof insertCartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema> & {
  contactEmail?: string;
};
export type OrderItem = Omit<z.infer<typeof insertOrderItemSchema>, 'size' | 'productColorId' | 'colorName' | 'colorHex' | 'paymentMethod'>
  & {
    size?: string | null;
    productColorId?: string | null;
    colorName?: string | null;
    colorHex?: string | null;
    paymentMethod: PaymentMethod;
  };
export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  createdAt: Date;
  isPaid: boolean;
  paidAt: Date | null;
  isDelivered: boolean;
  deliveredAt: Date | null;
  shippingStatus: string | null;
  shippingNotes: string | null;
  orderitems: OrderItem[];
  user: { name: string; email: string };
  paymentResult: PaymentResult;
  receiptUrl: string | null;
  expiresAt: Date | null;
  promoCode?: string | null;
  discountPrice?: string | null;
};
export type PaymentResult = z.infer<typeof paymentResultSchema>;
export type Review = z.infer<typeof insertReviewSchema> & {
  id: string;
  createdAt: Date;
  user?: { name: string };
};
