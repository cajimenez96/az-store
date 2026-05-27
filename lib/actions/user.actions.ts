'use server';

import {
  shippingAddressSchema,
  signInFormSchema,
  signUpFormSchema,
  paymentMethodSchema,
  updateUserSchema,
} from '../validators';
import { auth, signIn, signOut } from '@/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { hash } from '../encrypt';
import { prisma } from '@/db/prisma';
import { formatError } from '../utils';
import { PAGE_SIZE } from '../constants';
import { ShippingAddress } from '@/types';
import { z } from 'zod';
import { requireAdmin, requireAdminOrSeller } from '@/lib/auth-guard';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

// Sign in the user with credentials
export async function signInWithCredentials(
  prevState: unknown,
  formData: FormData
) {
  try {
    const user = signInFormSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    await signIn('credentials', user);

    return { success: true, message: 'Sesión iniciada exitosamente' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: 'Correo o contraseña incorrectos' };
  }
}

// Sign user out
export async function signOutUser() {
  await signOut({ redirectTo: '/sign-in' });
}

// Sign up user
export async function signUpUser(prevState: unknown, formData: FormData) {
  try {
    const user = signUpFormSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    const plainPassword = user.password;

    user.password = await hash(user.password);

    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password,
      },
    });

    await signIn('credentials', {
      email: user.email,
      password: plainPassword,
    });

    return { success: true, message: 'Usuario registrado exitosamente' };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { success: false, message: formatError(error) };
  }
}

// Get user by the ID
export async function getUserById(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });
  if (!user) throw new Error('Usuario no encontrado');
  return user;
}

// Update the user's address
export async function updateUserAddress(data: ShippingAddress) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('Usuario no encontrado');

    const address = shippingAddressSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { address },
    });

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update user's payment method
export async function updateUserPaymentMethod(
  data: z.infer<typeof paymentMethodSchema>
) {
  try {
    const session = await auth();
    const currentUser = await prisma.user.findFirst({
      where: { id: session?.user?.id },
    });

    if (!currentUser) throw new Error('Usuario no encontrado');

    const paymentMethod = paymentMethodSchema.parse(data);

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { paymentMethod: paymentMethod.type },
    });

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update the user profile
export async function updateProfile(user: { name: string; email: string }) {
  try {
    const session = await auth();

    const currentUser = await prisma.user.findFirst({
      where: {
        id: session?.user?.id,
      },
    });

    if (!currentUser) throw new Error('Usuario no encontrado');

    await prisma.user.update({
      where: {
        id: currentUser.id,
      },
      data: {
        name: user.name,
      },
    });

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Get all the users
export async function getAllUsers({
  limit = PAGE_SIZE,
  page,
  query,
  role,
}: {
  limit?: number;
  page: number;
  query: string;
  role?: string;
}) {
  await requireAdmin();
  const queryFilter: Prisma.UserWhereInput =
    query && query !== 'all'
      ? {
          name: {
            contains: query,
            mode: 'insensitive',
          } as Prisma.StringFilter,
        }
      : {};

  if (role && role !== 'all') {
    queryFilter.role = role;
  }

  const data = await prisma.user.findMany({
    where: {
      ...queryFilter,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.user.count({
    where: queryFilter,
  });

  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a user
export async function deleteUser(id: string) {
  try {
    await requireAdmin();
    await prisma.user.delete({ where: { id } });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Usuario eliminado exitosamente',
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Update a user
export async function updateUser(user: z.infer<typeof updateUserSchema>) {
  try {
    await requireAdmin();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        role: user.role,
      },
    });

    revalidatePath('/admin/users');

    return {
      success: true,
      message: 'Usuario actualizado exitosamente',
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Search registered customers for POS autocomplete
export async function searchPosCustomers(query: string) {
  try {
    await requireAdminOrSeller();

    if (!query || query.trim() === '') {
      return { success: true, data: [] };
    }

    const cleanQuery = query.trim();

    const customers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { email: { contains: cleanQuery, mode: 'insensitive' } },
          { dni: { contains: cleanQuery, mode: 'insensitive' } },
          { phone: { contains: cleanQuery, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return { success: true, data: customers };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Update the commission rate for a seller (admin only)
export async function updateSellerCommission(userId: string, percentage: number) {
  await requireAdmin();
  if (percentage < 0 || percentage > 100) {
    return { success: false, message: 'La comisión debe ser un valor entre 0 y 100' };
  }
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== 'seller') {
    return { success: false, message: 'El usuario no es un vendedor' };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { commissionRate: percentage / 100 },
  });
  revalidatePath('/admin/users');
  revalidatePath('/admin/overview');
  return { success: true, message: 'Comisión actualizada' };
}

// Get commission summary for all sellers (admin only)
export async function getSellerCommissionSummary() {
  const sellers = await prisma.user.findMany({
    where: { role: 'seller' },
    select: {
      id: true,
      name: true,
      email: true,
      commissionRate: true,
    },
    orderBy: { name: 'asc' },
  });

  const summaries = await Promise.all(
    sellers.map(async (seller) => {
      const result = await prisma.order.aggregate({
        where: { sellerId: seller.id, isPaid: true },
        _sum: { commissionAmount: true, totalPrice: true },
        _count: { id: true },
      });
      return {
        ...seller,
        totalCommission: Number(result._sum.commissionAmount ?? 0),
        totalSales: Number(result._sum.totalPrice ?? 0),
        orderCount: result._count.id,
      };
    })
  );

  return summaries;
}

// Get the commission rate for a specific user (for seller self-view)
export async function getMyCommissionRate(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { commissionRate: true },
  });
  return user?.commissionRate ?? null;
}

// Create a new customer directly from the POS interface
export async function createPosCustomer(data: {
  name: string;
  email: string;
  phone?: string;
  dni?: string;
  streetAddress?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}) {
  try {
    await requireAdminOrSeller();

    const { name, email, phone, dni, streetAddress, city, province, postalCode } = data;

    if (!name || name.trim() === '') {
      throw new Error('El nombre del cliente es obligatorio');
    }
    if (!email || email.trim() === '') {
      throw new Error('El email del cliente es obligatorio');
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.trim() }
    });
    if (existingEmail) {
      throw new Error('Ya existe un usuario registrado con este correo electrónico');
    }

    // Check if DNI already exists (if provided)
    if (dni && dni.trim() !== '') {
      const existingDni = await prisma.user.findUnique({
        where: { dni: dni.trim() }
      });
      if (existingDni) {
        throw new Error('Ya existe un usuario registrado con este DNI');
      }
    }

    // Construct address JSON if provided
    let addressObj = null;
    if (streetAddress && streetAddress.trim() !== '') {
      addressObj = {
        fullName: name.trim(),
        streetAddress: streetAddress.trim(),
        city: city?.trim() || 'Tucumán',
        province: province?.trim() || 'Tucumán',
        postalCode: postalCode?.trim() || '4000',
        country: 'Argentina',
        phone: phone?.trim() || '00000000',
        contactEmail: email.trim(),
      };
    }

    const newCustomer = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        dni: dni?.trim() || null,
        address: addressObj ? addressObj : undefined,
        role: 'user',
      }
    });

    return {
      success: true,
      message: 'Cliente creado con éxito',
      customer: newCustomer,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
