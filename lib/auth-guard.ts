import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export class UnauthorizedError extends Error {
  constructor(message = 'No autorizado: permisos insuficientes') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

/**
 * For Server Components (Pages/Layouts): redirects unauthenticated/unauthorized users to /unauthorized
 */
export async function requireAdmin() {
  const session = await auth()

  if (session?.user?.role !== 'admin') {
    redirect('/unauthorized')
  }

  return session
}

export async function requireSeller() {
  const session = await auth()

  if (session?.user?.role !== 'seller') {
    redirect('/unauthorized')
  }

  return session
}

export async function requireAdminOrSeller() {
  const session = await auth()

  if (session?.user?.role !== 'admin' && session?.user?.role !== 'seller') {
    redirect('/unauthorized')
  }

  return session
}

/**
 * For Server Actions / API Handlers: throws an UnauthorizedError instead of HTTP redirect
 */
export async function assertAdmin() {
  const session = await auth()

  if (session?.user?.role !== 'admin') {
    throw new UnauthorizedError('Acceso denegado: se requieren permisos de administrador')
  }

  return session
}

export async function assertSeller() {
  const session = await auth()

  if (session?.user?.role !== 'seller') {
    throw new UnauthorizedError('Acceso denegado: se requieren permisos de vendedor')
  }

  return session
}

export async function assertAdminOrSeller() {
  const session = await auth()

  if (session?.user?.role !== 'admin' && session?.user?.role !== 'seller') {
    throw new UnauthorizedError('Acceso denegado: se requieren permisos administrativos')
  }

  return session
}

