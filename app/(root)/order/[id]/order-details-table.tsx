'use client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Order } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle } from 'lucide-react';
import { useTransition } from 'react';
import {
  updateOrderToPaidCOD,
  deliverOrder,
  updateOrderReceipt,
  approveBankTransfer,
  rejectBankTransfer,
  createMercadoPagoOrder,
} from '@/lib/actions/order.actions';
import { UploadButton } from '@/lib/uploadthing';
import ShippingStatusForm from './shipping-status-form';

interface BankInfo {
  bank: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cuit: string;
}

const OrderDetailsTable = ({
  order,
  isAdmin,
  isSeller,
  bankInfo,
}: {
  order: Omit<Order, 'paymentResult'>;
  isAdmin: boolean;
  isSeller?: boolean;
  bankInfo: BankInfo;
}) => {
  const { bank, accountHolder, cbu, alias, cuit } = bankInfo;

  const {
    id,
    shippingAddress,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod,
    isDelivered,
    isPaid,
    paidAt,
    deliveredAt,
    receiptUrl,
    expiresAt,
  } = order;

  const { toast } = useToast();

  // Button to mark order as delivered
  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type='button'
        variant='buyCta'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrder(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
        className="w-full"
      >
        {isPending ? 'Procesando...' : 'Marcar como Entregado'}
      </Button>
    );
  };

  // Button to pay with Mercado Pago
  const PayWithMercadoPagoButton = () => {
    const [isPending, startTransition] = useTransition();

    const handlePayment = () => {
      startTransition(async () => {
        const res = await createMercadoPagoOrder(id);
        if (res.success && res.initPoint) {
          window.location.href = res.initPoint;
        } else {
          toast({
            variant: 'destructive',
            description: res.message || 'Error al iniciar el pago con Mercado Pago',
          });
        }
      });
    };

    return (
      <Button
        type="button"
        variant="buyCta"
        disabled={isPending}
        onClick={handlePayment}
        className="w-full"
      >
        {isPending ? 'Generando Pago...' : 'Pagar con Mercado Pago'}
      </Button>
    );
  };

  // Admin Approve Button
  const ApprovePaymentButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type="button"
        variant="buyCta"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await approveBankTransfer(id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
        className="font-semibold"
      >
        {isPending ? 'Aprobando...' : 'Aprobar Pago'}
      </Button>
    );
  };

  // Admin Reject Button
  const RejectPaymentButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type="button"
        variant="outlineOnLight"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await rejectBankTransfer(id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
        className="font-semibold"
      >
        {isPending ? 'Rechazando...' : 'Rechazar Pago'}
      </Button>
    );
  };

  // Admin COD Payment Button
  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type='button'
        variant='buyCta'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidCOD(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
        className="w-full"
      >
        {isPending ? 'Procesando...' : 'Confirmar Pago'}
      </Button>
    );
  };

  return (
    <div className="bg-az-canvas min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className='az-heading-lg text-az-ink-deep tracking-wide'>Orden {formatId(id)}</h1>
          <div className="flex gap-4 print:hidden">
            {(isAdmin || isSeller) && (
              <button
                onClick={() => window.print()}
                className="az-body-sm font-medium text-az-primary hover:text-az-primary-deep transition-colors"
              >
                Imprimir Comprobante
              </button>
            )}
            <Link href={(isAdmin || isSeller) ? "/admin/orders" : "/user/orders"} className="az-body-sm-bold underline text-az-stone hover:text-az-ink transition-colors">
              {(isAdmin || isSeller) ? "Volver a los pedidos" : "Volver a mis pedidos"}
            </Link>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          <div className='col-span-2 space-y-6 overflow-x-auto'>
            {/* Payment Method Card */}
            <Card className="shadow-az-sticky border-az-hairline-soft bg-az-canvas rounded-az-xxxl">
              <CardContent className='p-6'>
                <h2 className='az-heading-sm text-az-ink-deep'>Método de Pago</h2>
                <div className='mt-2 flex items-center justify-between'>
                  <span className="text-az-charcoal font-medium">
                    {paymentMethod === 'TransferenciaBancaria'
                      ? 'Transferencia Bancaria'
                      : paymentMethod === 'MercadoPago'
                      ? 'Mercado Pago'
                      : paymentMethod}
                  </span>
                  {isPaid ? (
                    <Badge variant='secondary' className="bg-green-100 text-az-ink-deep border-transparent">
                      Pagado el {formatDateTime(paidAt!).dateTime}
                    </Badge>
                  ) : (
                    <Badge variant='destructive'>Pendiente de Pago</Badge>
                  )}
                </div>

                {/* Expiration Timer Warning for Bank Transfer */}
                {!isPaid && paymentMethod === 'TransferenciaBancaria' && expiresAt && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 border border-amber-200/60 p-3 rounded-md">
                    Tenés tiempo de subir tu comprobante de transferencia hasta el: <strong>{formatDateTime(expiresAt).dateTime}</strong>. Luego de este plazo, la orden expirará y el stock será liberado automáticamente.
                  </p>
                )}

                {/* Bank Details & Upload Section for Unpaid Bank Transfer */}
                {!isPaid && paymentMethod === 'TransferenciaBancaria' && (
                  <div className="mt-4 border-t border-az-hairline-soft pt-4 space-y-4">
                    {!receiptUrl ? (
                      <>
                        <div className="p-4 rounded-az-xl bg-az-surface-soft border border-az-hairline-soft space-y-2 text-sm text-az-charcoal">
                          <h3 className="az-body-sm-bold text-az-ink-deep">Datos para la Transferencia</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            <p><strong>Banco:</strong> {bank}</p>
                            <p><strong>Titular:</strong> {accountHolder}</p>
                            <p><strong>CBU:</strong> {cbu}</p>
                            <p><strong>Alias:</strong> {alias}</p>
                            <p><strong>CUIT:</strong> {cuit}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-az-hairline-soft rounded-az-xl bg-az-surface-soft/50 hover:bg-az-surface-soft transition-colors">
                          <p className="az-body-sm text-az-steel mb-3 text-center font-medium">Subí una foto o PDF de tu comprobante de transferencia:</p>
                          <UploadButton
                            endpoint="receiptUploader"
                            onClientUploadComplete={async (res) => {
                              if (res && res[0]) {
                                const result = await updateOrderReceipt(id, res[0].url);
                                toast({
                                  variant: result.success ? 'default' : 'destructive',
                                  description: result.message,
                                });
                              }
                            }}
                            onUploadError={(error: Error) => {
                              toast({
                                variant: 'destructive',
                                description: `Error al subir comprobante: ${error.message}`,
                              });
                            }}
                            appearance={{
                              button: "bg-az-ink text-white hover:bg-az-ink-deep text-sm font-medium rounded-az-full px-6 py-2 transition-colors duration-200 border-none cursor-pointer",
                              allowedContent: "text-xs text-az-stone mt-1",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="bg-az-surface-soft text-az-charcoal p-4 rounded-az-xl border border-az-hairline-soft">
                        <p className="az-body-sm-bold">¡Comprobante enviado!</p>
                        <p className="text-sm mt-1 text-az-charcoal">
                          Tu comprobante ha sido subido.{' '}
                          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline hover:text-az-ink-deep font-medium">
                            Ver comprobante enviado
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Approval view for TransferenciaBancaria with Receipt */}
                {isAdmin && !isPaid && paymentMethod === 'TransferenciaBancaria' && receiptUrl && (
                  <div className="mt-4 border-t border-az-hairline-soft pt-4 space-y-4">
                    <div className="bg-amber-50 border border-amber-200/60 p-4 rounded-az-xl text-az-ink space-y-3">
                      <div className="flex items-center gap-2 text-amber-700 font-semibold">
                        <AlertTriangle className="h-4 w-4" /> Comprobante en Revisión
                      </div>
                      <p className="text-sm text-az-charcoal">
                        El equipo de administración está revisando el comprobante. Una vez aprobado, el pago se marcará como confirmado.
                      </p>
                      <div className="relative aspect-[4/3] max-w-xs overflow-hidden rounded-md border border-az-hairline-soft bg-az-canvas">
                        <Image src={receiptUrl} alt="Comprobante" fill className="object-contain" />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2">
                        <ApprovePaymentButton />
                        <RejectPaymentButton />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card className="shadow-az-sticky border-az-hairline-soft bg-az-canvas rounded-az-xxxl">
              <CardContent className='p-6'>
                <h2 className='az-heading-sm text-az-ink-deep'>Dirección de Envío</h2>
                <div className="text-az-charcoal mt-4">
                  <p className="font-semibold">{shippingAddress.fullName}</p>
                  <p className='mt-1 text-az-steel'>
                    {shippingAddress.streetAddress}, {shippingAddress.city},{' '}
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                </div>
                <div className='mt-4'>
                  <div className="flex items-center gap-2">
                    <Badge variant='secondary' className="bg-az-surface-soft text-az-ink border-transparent">
                      Estado: {order.shippingStatus || 'Pendiente'}
                    </Badge>
                    {isDelivered ? (
                      <Badge variant='secondary' className="bg-green-100 text-green-800 border-transparent">
                        Entregado el {formatDateTime(deliveredAt!).dateTime}
                      </Badge>
                    ) : (
                      <Badge variant='destructive'>No Entregado</Badge>
                    )}
                  </div>
                  {order.shippingNotes && (
                    <p className="text-sm text-az-steel mt-2">
                      <span className="font-semibold">Notas:</span> {order.shippingNotes}
                    </p>
                  )}
                  {isAdmin && (
                    <ShippingStatusForm
                      orderId={order.id}
                      currentStatus={order.shippingStatus || 'Pendiente'}
                      currentNotes={order.shippingNotes || ''}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Products Card */}
            <Card className="shadow-az-sticky border-az-hairline-soft bg-az-canvas rounded-az-xxxl">
              <CardContent className='p-6'>
                <h2 className='az-heading-sm text-az-ink-deep'>Productos</h2>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow className="border-b border-az-hairline-soft hover:bg-transparent">
                      <TableHead className="text-az-stone font-medium">Producto</TableHead>
                      <TableHead className="text-az-stone font-medium text-center">Cantidad</TableHead>
                      <TableHead className="text-az-stone font-medium text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderitems.map((item) => (
                      <TableRow key={`${item.slug}-${item.size || ''}`} className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors duration-150'>
                        <TableCell className='py-4'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 py-1'
                          >
                            <div className="relative w-12 h-12 overflow-hidden rounded bg-az-surface-soft border border-az-hairline-soft">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className='font-medium text-az-ink-deep group-hover:underline transition duration-150'>
                                {item.name}
                              </span>
                              {item.size && (
                                <span className="text-sm text-az-steel">Talle: {item.size}</span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center font-medium text-az-charcoal">
                          {item.qty}
                        </TableCell>
                        <TableCell className='text-right font-medium text-az-ink-deep'>
                          ${item.price}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className="space-y-6">
            <Card className="shadow-az-sticky border-az-hairline-soft bg-az-canvas rounded-az-xxxl">
              <CardContent className='p-6'>
                <h2 className="az-heading-sm text-az-ink-deep pb-2 border-b border-az-hairline-soft">Resumen de Compra</h2>
                <div className='space-y-4 mt-4'>
                  <div className='flex justify-between'>
                    <div className="text-az-steel">Productos</div>
                    <div className="font-medium text-az-ink-deep">{formatCurrency(itemsPrice)}</div>
                  </div>
                  <div className='flex justify-between'>
                    <div className="text-az-steel">Impuestos</div>
                    <div className="font-medium text-az-ink-deep">{formatCurrency(taxPrice)}</div>
                  </div>
                  <div className='flex justify-between'>
                    <div className="text-az-steel">Envío</div>
                    <div className="font-medium text-az-ink-deep">{formatCurrency(shippingPrice)}</div>
                  </div>
                  <div className='flex justify-between text-base font-semibold pt-2 border-t border-az-hairline-soft'>
                    <div className="text-az-ink-deep font-medium">Total</div>
                    <div className="text-az-ink-deep font-semibold">{formatCurrency(totalPrice)}</div>
                  </div>
                </div>

                <div className="pt-6 space-y-2 print:hidden">
                  {/* Mercado Pago Payment Action */}
                  {!isPaid && paymentMethod === 'MercadoPago' && !isAdmin && (
                    <PayWithMercadoPagoButton />
                  )}

                  {/* Standard admin buttons for bank transfer fallback when no receipt is uploaded */}
                  {isAdmin && !isPaid && paymentMethod === 'TransferenciaBancaria' && !receiptUrl && (
                    <div className="space-y-2">
                      <p className="az-caption text-az-stone text-center">Falta comprobante del cliente</p>
                      <MarkAsPaidButton />
                    </div>
                  )}

                  {/* Mark as Delivered Action */}
                  {isAdmin && isPaid && !isDelivered && <MarkAsDeliveredButton />}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsTable;
