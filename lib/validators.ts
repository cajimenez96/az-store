import { z } from 'zod';
import { formatNumberWithDecimal } from './utils';
import { PAYMENT_METHODS } from './constants';

const currency = z
  .string()
  .refine(
    (value) => /^\d+(\.\d{2})?$/.test(formatNumberWithDecimal(Number(value))),
    'El precio debe tener exactamente dos decimales'
  );

// Schema for inserting products
export const insertProductSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  slug: z.string().min(3, 'El slug debe tener al menos 3 caracteres'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  subCategoryId: z.string().nullable().optional(),
  brandId: z.string().min(1, 'La marca es requerida'),
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  variants: z.array(z.object({
    sizeId: z.string().nullable().optional(),
    colorId: z.string().nullable().optional(),
    stock: z.coerce.number(),
  })).optional(),
  // Colores disponibles para este producto (con sus imágenes por color).
  // colorId referencia a la tabla global `Color`.
  colors: z.array(z.object({
    colorId: z.string().min(1, 'Color requerido'),
    images: z.array(z.string()).min(1, 'Cada color requiere al menos una imagen'),
  })).optional(),
  // Opt-in para variantes de color. Si es false, los colors[] se ignoran.
  hasColorVariants: z.boolean().default(false),
  images: z.array(z.string()).min(1, 'El producto debe tener al menos una imagen'),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  // Fase 2: dual pricing. `priceCash` es el precio base
  // (efectivo/transferencia). `priceMercadoPago` es el precio para MP,
  // sugerido automáticamente como `priceCash * (1 + MP_SURCHARGE_PERCENT / 100)`
  // pero siempre editable por el vendedor.
  priceCash: currency,
  priceMercadoPago: currency,
});

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Color Schemas
export const insertColorSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex inválido (ej: #dc2626)'),
});

export const updateColorSchema = insertColorSchema.extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Schema for signing users in
export const signInFormSchema = z.object({
  email: z.string().email('Dirección de correo electrónico inválida'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

// Schema for signing up a user
export const signUpFormSchema = z
  .object({
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Dirección de correo electrónico inválida'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
    confirmPassword: z
      .string()
      .min(8, 'La confirmación de contraseña debe tener al menos 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Cart Schemas
export const cartItemSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  slug: z.string().min(1, 'El slug es requerido'),
  qty: z.number().int().nonnegative('La cantidad debe ser un número positivo'),
  image: z.string().min(1, 'La imagen es requerida'),
  // Fase 2: precio final + método de pago asociado (snapshoteo en cart)
  priceUsed: currency,
  paymentMethod: z.enum(['CASH', 'MERCADOPAGO']),
  size: z.string().optional(),
  // Fase 1: color seleccionado (ProductColor.id en el form, o nombre+hex en el cart snapshot)
  productColorId: z.string().optional(),
  colorName: z.string().optional(),
  colorHex: z.string().optional(),
});

export const insertCartSchema = z.object({
  items: z.array(cartItemSchema),
  itemsPrice: currency,
  totalPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  sessionCartId: z.string().min(1, 'El ID del carrito de sesión es requerido'),
  userId: z.string().optional().nullable(),
});

// Schema for the shipping address
export const shippingAddressSchema = z.object({
  fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  streetAddress: z.string().min(3, 'La dirección debe tener al menos 3 caracteres'),
  city: z.string().min(3, 'La ciudad debe tener al menos 3 caracteres'),
  province: z.string().min(2, 'La provincia es requerida'),
  postalCode: z.string().regex(/^[a-zA-Z0-9\s]+$/, 'Solo caracteres alfanuméricos').min(3, 'El código postal debe tener al menos 3 caracteres'),
  country: z.string().min(3, 'El país debe tener al menos 3 caracteres'),
  phone: z.string().regex(/^[0-9+ -]+$/, 'Solo números y símbolos de marcación (+, -)').min(8, 'El teléfono debe tener al menos 8 caracteres'),
  contactEmail: z.string().email('Dirección de correo electrónico inválida'),
  floor: z.string().regex(/^[a-zA-Z0-9]*$/, 'No se permiten símbolos especiales').optional(),
  apartment: z.string().regex(/^[a-zA-Z0-9]*$/, 'No se permiten símbolos especiales').optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

// Schema for payment method
export const paymentMethodSchema = z
  .object({
    type: z.string().min(1, 'El método de pago es requerido'),
  })
  .refine((data) => PAYMENT_METHODS.includes(data.type), {
    path: ['type'],
    message: 'Método de pago inválido',
  })
  .transform((data) => {
    // Fase 2: mapping del método de pago de UI (MercadoPago, TransferenciaBancaria)
    // al enum interno de dual pricing (MERCADOPAGO, CASH).
    const internalMethod: 'CASH' | 'MERCADOPAGO' =
      data.type === 'MercadoPago' ? 'MERCADOPAGO' : 'CASH';
    return { type: data.type, internalMethod };
  });

// Schema for inserting order
export const insertOrderSchema = z.object({
  userId: z.string().min(1, 'El usuario es requerido'),
  itemsPrice: currency,
  shippingPrice: currency,
  taxPrice: currency,
  totalPrice: currency,
  paymentMethod: z.string().refine((data) => PAYMENT_METHODS.includes(data), {
    message: 'Método de pago inválido',
  }),
  shippingAddress: shippingAddressSchema,
});

// Schema for inserting an order item
export const insertOrderItemSchema = z.object({
  productId: z.string(),
  slug: z.string(),
  image: z.string(),
  name: z.string(),
  // Fase 2: precio final aplicado al item (según método de pago)
  priceUsed: currency,
  paymentMethod: z.enum(['CASH', 'MERCADOPAGO']),
  qty: z.number(),
  size: z.string().nullish().transform((v) => v ?? undefined),
  // Fase 1: snapshot del color al momento de la compra
  productColorId: z.string().nullish().transform((v) => v ?? undefined),
  colorName: z.string().nullish().transform((v) => v ?? undefined),
  colorHex: z.string().nullish().transform((v) => v ?? undefined),
});

// Schema for the PayPal paymentResult
export const paymentResultSchema = z.object({
  id: z.string(),
  status: z.string(),
  email_address: z.string(),
  pricePaid: z.string(),
});

// Schema for updating the user profile
export const updateProfileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().min(3, 'El correo debe tener al menos 3 caracteres'),
});

// Schema to update users
export const updateUserSchema = updateProfileSchema.extend({
  id: z.string().min(1, 'El ID es requerido'),
  role: z.string().min(1, 'El rol es requerido'),
});

// Schema to insert reviews
export const insertReviewSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  productId: z.string().min(1, 'El producto es requerido'),
  userId: z.string().min(1, 'El usuario es requerido'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'La calificación debe ser al menos 1')
    .max(5, 'La calificación debe ser como máximo 5'),
});

// Category Schemas
export const insertCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
});

export const updateCategorySchema = insertCategorySchema.extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Size Schemas
export const insertSizeSchema = z.object({
  name: z.string().min(1, 'El nombre debe tener al menos 1 caracter'),
  categoryId: z.string().min(1, 'La categoría es requerida'),
});

// Brand Schemas
export const insertBrandSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().min(2, 'El slug debe tener al menos 2 caracteres'),
});

export const updateBrandSchema = insertBrandSchema.extend({
  id: z.string().min(1, 'El ID es requerido'),
});

// Password reset schemas
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una mayúscula')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
    confirmPassword: z
      .string()
      .min(8, 'La confirmación debe tener al menos 8 caracteres'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// Order schemas
export const updateShippingStatusSchema = z.object({
  status: z.enum(
    ['Pendiente', 'En Preparacion', 'En Camino', 'Entregado'],
    {
      errorMap: () => ({ message: 'Estado de envío inválido' }),
    }
  ),
  notes: z
    .string()
    .max(500, 'Las notas no pueden exceder 500 caracteres')
    .optional()
    .default(''),
});

// Promotion Schemas

export const insertPromoBannerSchema = z.object({
  image: z.string().min(1, 'La imagen es requerida'),
  title: z.string().min(1, 'El título es requerido'),
  subtitle: z.string().optional(),
  linkLabel: z.string().optional(),
  discountPercent: z.coerce.number().min(0).max(100).optional(),
  productIds: z.array(z.string().uuid()).default([]),
  order: z.coerce.number().int().default(0),
  isActive: z.boolean().default(true),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export const updatePromoBannerSchema = insertPromoBannerSchema.extend({
  id: z.string().uuid('ID inválido'),
});

