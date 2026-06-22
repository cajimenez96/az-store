export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AZ Store';
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  'A modern ecommerce store built with Next.js';
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: '',
  password: '',
};

export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const shippingAddressDefaultValues = {
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ')
  : ['MercadoPago', 'TransferenciaBancaria'];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || 'MercadoPago';

// Fase 2: enum interno para dual pricing. El string del enum coincide con
// el enum Prisma `PaymentMethod` y se persiste en Price.paymentMethod y
// OrderItem.paymentMethod.
export const PaymentMethod = {
  CASH: 'CASH',
  MERCADOPAGO: 'MERCADOPAGO',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo / Transferencia',
  MERCADOPAGO: 'MercadoPago',
};

export const MP_SURCHARGE_PERCENT_DEFAULT = 10;

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

export const productDefaultValues = {
  name: '',
  slug: '',
  category: '',
  images: [],
  brand: '',
  description: '',
  // Fase 2: dual pricing. El form va a tener dos inputs:
  //   - priceCash (precio efectivo/transferencia)
  //   - priceMercadoPago (precio MP, sugerido desde priceCash + recargo)
  priceCash: '0',
  priceMercadoPago: '0',
  stock: 0,
  rating: '0',
  numReviews: '0',
  isFeatured: false,
  banner: null,
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(', ')
  : ['admin', 'seller', 'user'];

export const reviewFormDefaultValues = {
  title: '',
  comment: '',
  rating: 0,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';

export const DEFAULT_BRAND_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_CATEGORY_ID = '00000000-0000-0000-0000-000000000002';
