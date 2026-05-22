import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const session = await auth()

  if (session?.user?.role !== 'admin') {
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
