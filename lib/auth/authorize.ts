import { prisma } from '@/db/prisma';
import { compare } from 'bcryptjs';
import { signInFormSchema } from '@/lib/validators';

/**
 * Valida credenciales contra signInFormSchema y busca de forma unívoca en Prisma.
 * Previene bypass donde Prisma omite filtros ante valores undefined.
 */
export async function authorizeUser(credentials: unknown) {
  if (credentials == null) return null;

  const parsed = signInFormSchema.safeParse(credentials);
  if (!parsed.success) return null;

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      password: true,
      name: true,
      role: true,
    },
  });

  if (!user || !user.password) return null;

  const isMatch = await compare(password, user.password);
  if (!isMatch) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
