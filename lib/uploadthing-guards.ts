import type { Session } from 'next-auth';
import { prisma } from '@/db/prisma';

/**
 * Authorization rules for UploadThing endpoints (AZ-005). Kept out of the
 * route file so they can be unit tested without the UploadThing runtime.
 * They throw plain Errors with Spanish messages.
 */

type MaybeSession = Session | null | undefined;

function isStaff(role: string | undefined): boolean {
  return role === 'admin' || role === 'seller';
}

/** Product/banner images: admin or seller only. */
export function authorizeImageUpload(session: MaybeSession): { userId: string } {
  const user = session?.user;
  if (!user?.id || !isStaff(user.role)) throw new Error('No autorizado');
  return { userId: user.id };
}

/**
 * Receipts: the order must exist, belong to the caller (admin/seller may act on
 * any order), be a bank transfer, unpaid and not cancelled.
 */
export async function authorizeReceiptUpload(
  session: MaybeSession,
  orderId: string
): Promise<{ userId: string; orderId: string }> {
  const user = session?.user;
  if (!user?.id) throw new Error('No autorizado');

  const order = await prisma.order.findFirst({ where: { id: orderId } });
  if (!order) throw new Error('Orden no encontrada');

  if (order.userId !== user.id && !isStaff(user.role)) throw new Error('No autorizado');

  if (order.paymentMethod !== 'TransferenciaBancaria') {
    throw new Error('El método de pago no es transferencia bancaria');
  }
  if (order.isPaid) throw new Error('La orden ya fue pagada');

  // Cancellation is stored as paymentResult.status === 'CANCELLED' (rejectBankTransfer).
  const status = (order.paymentResult as { status?: string } | null)?.status;
  if (status === 'CANCELLED') throw new Error('La orden fue cancelada');

  return { userId: user.id, orderId: order.id };
}
