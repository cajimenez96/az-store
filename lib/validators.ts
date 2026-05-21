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
  category: z.string().min(3, 'La categoría debe tener al menos 3 caracteres'),
  brand: z.string().min(3, 'La marca debe tener al menos 3 caracteres'),
  description: z.string().min(3, 'La descripción debe tener al menos 3 caracteres'),
  stock: z.coerce.number(),
  images: z.array(z.string()).min(1, 'El producto debe tener al menos una imagen'),
  isFeatured: z.boolean(),
  banner: z.string().nullable(),
  price: currency,
});

// Schema for updating products
export const updateProductSchema = insertProductSchema.extend({
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
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z
      .string()
      .min(6, 'La confirmación de contraseña debe tener al menos 6 caracteres'),
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
  price: currency,
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
  postalCode: z.string().min(3, 'El código postal debe tener al menos 3 caracteres'),
  country: z.string().min(3, 'El país debe tener al menos 3 caracteres'),
  phone: z.string().optional(),
  floor: z.string().optional(),
  apartment: z.string().optional(),
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
  price: currency,
  qty: z.number(),
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
