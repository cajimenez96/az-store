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
import { useTransition } from 'react';
import {
  updateOrderToPaidCOD,
  deliverOrder,
  updateOrderReceipt,
  approveBankTransfer,
  rejectBankTransfer,
  createMercadoPagoOrder,
} from '@/lib/actions/order.actions';
import { BANK_TRANSFER_INFO } from '@/lib/constants';
import { UploadButton } from '@/lib/uploadthing';
import ShippingStatusForm from './shipping-status-form';

const OrderDetailsTable = ({
  order,
  isAdmin,
}: {
  order: Omit<Order, 'paymentResult'>;
  isAdmin: boolean;
}) => {
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
        variant='primaryPill'
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
        className="w-full font-semibold"
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
        variant="aloePill"
        disabled={isPending}
        onClick={handlePayment}
        className="w-full font-semibold"
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
        variant="primaryPill"
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
        variant='primaryPill'
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
        className="w-full font-semibold"
      >
        {isPending ? 'Procesando...' : 'Confirmar Pago'}
      </Button>
    );
  };

  return (
    <div className="bg-canvas-cream min-h-screen py-8 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className='text-2xl font-light tracking-wide text-zinc-900'>Orden {formatId(id)}</h1>
          <div className="flex gap-4">
            <button
              onClick={() => window.print()}
              className="text-sm font-medium text-aloe-500 hover:text-aloe-600 transition-colors"
            >
              Imprimir Comprobante
            </button>
            <Link href="/user/orders" className="text-sm font-medium underline text-zinc-600 hover:text-zinc-900 transition-colors">
              Volver a mis pedidos
            </Link>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          <div className='col-span-2 space-y-6 overflow-x-auto'>
            {/* Payment Method Card */}
            <Card className="shadow-level-3 border-zinc-200/50 bg-white rounded-lg">
              <CardContent className='p-6 space-y-4'>
                <h2 className='text-xl font-light text-zinc-900'>Método de Pago</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-zinc-700 font-medium">
                    {paymentMethod === 'TransferenciaBancaria'
                      ? 'Transferencia Bancaria'
                      : paymentMethod === 'MercadoPago'
                      ? 'Mercado Pago'
                      : paymentMethod}
                  </span>
                  {isPaid ? (
                    <Badge variant='secondary' className="bg-zinc-100 text-zinc-800 border-transparent">
                      Pagado el {formatDateTime(paidAt!).dateTime}
                    </Badge>
                  ) : (
                    <Badge variant='destructive'>Pendiente de Pago</Badge>
                  )}
                </div>

                {/* Expiration Timer Warning for Bank Transfer */}
                {!isPaid && paymentMethod === 'TransferenciaBancaria' && expiresAt && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200/60 p-3 rounded-md">
                    Tenés tiempo de subir tu comprobante de transferencia hasta el: <strong>{formatDateTime(expiresAt).dateTime}</strong>. Luego de este plazo, la orden expirará y el stock será liberado automáticamente.
                  </p>
                )}

                {/* Bank Details & Upload Section for Unpaid Bank Transfer */}
                {!isPaid && paymentMethod === 'TransferenciaBancaria' && (
                  <div className="mt-4 border-t border-zinc-100 pt-4 space-y-4">
                    {!receiptUrl ? (
                      <>
                        <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 space-y-2 text-sm text-zinc-700">
                          <h3 className="font-semibold text-zinc-900">Datos para la Transferencia</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            <p><strong>Banco:</strong> {BANK_TRANSFER_INFO.bank}</p>
                            <p><strong>Titular:</strong> {BANK_TRANSFER_INFO.accountHolder}</p>
                            <p><strong>CBU:</strong> {BANK_TRANSFER_INFO.cbu}</p>
                            <p><strong>Alias:</strong> {BANK_TRANSFER_INFO.alias}</p>
                            <p><strong>CUIT:</strong> {BANK_TRANSFER_INFO.cuit}</p>
                          </div>
                        </div>

                        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-zinc-200 rounded-lg bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                          <p className="text-sm text-zinc-500 mb-3 text-center font-medium">Subí una foto o PDF de tu comprobante de transferencia:</p>
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
                              button: "bg-black text-white hover:bg-zinc-800 text-sm font-medium rounded-full px-6 py-2 transition-colors duration-200 border-none cursor-pointer",
                              allowedContent: "text-xs text-zinc-400 mt-1",
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="bg-pistachio-10 text-black p-4 rounded-lg border border-aloe-10">
                        <p className="font-semibold">¡Comprobante enviado!</p>
                        <p className="text-sm mt-1 text-zinc-700">
                          El comprobante está siendo revisado por nuestro equipo administrativo para confirmar la acreditación de la transferencia.
                        </p>
                        <div className="mt-3">
                          <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline hover:text-zinc-950 font-medium">
                            Ver comprobante enviado
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Approval view for TransferenciaBancaria with Receipt */}
                {isAdmin && !isPaid && paymentMethod === 'TransferenciaBancaria' && receiptUrl && (
                  <div className="mt-4 border-t border-zinc-100 pt-4 space-y-4">
                    <div className="bg-amber-50/60 border border-amber-200/60 p-4 rounded-lg text-zinc-800 space-y-3">
                      <h3 className="font-semibold text-amber-800">Verificación Administrativa</h3>
                      <p className="text-sm text-zinc-600">
                        Un usuario subió un comprobante de transferencia bancaria. Por favor verifica si el dinero ingresó a la cuenta del banco antes de aprobar el pago.
                      </p>
                      <div className="relative aspect-[4/3] max-w-xs overflow-hidden rounded-md border border-zinc-200 bg-white">
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
            <Card className="shadow-level-3 border-zinc-200/50 bg-white rounded-lg">
              <CardContent className='p-6 space-y-4'>
                <h2 className='text-xl font-light text-zinc-900'>Dirección de Envío</h2>
                <div className="text-zinc-700">
                  <p className="font-semibold">{shippingAddress.fullName}</p>
                  <p className='mt-1 text-zinc-600'>
                    {shippingAddress.streetAddress}, {shippingAddress.city},{' '}
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant='secondary' className="bg-zinc-100 text-zinc-800 border-transparent">
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
                    <p className="text-sm text-zinc-600 mt-2">
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
            <Card className="shadow-level-3 border-zinc-200/50 bg-white rounded-lg">
              <CardContent className='p-6 space-y-4'>
                <h2 className='text-xl font-light text-zinc-900'>Productos</h2>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-zinc-100 hover:bg-transparent">
                      <TableHead className="text-zinc-500 font-medium">Producto</TableHead>
                      <TableHead className="text-zinc-500 font-medium text-center">Cantidad</TableHead>
                      <TableHead className="text-zinc-500 font-medium text-right">Precio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderitems.map((item) => (
                      <TableRow key={`${item.slug}-${item.size || ''}`} className='border-b border-hairline-light last:border-0 hover:bg-zinc-50/50 transition-colors duration-150'>
                        <TableCell className='py-4'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 py-1'
                          >
                            <div className="relative w-12 h-12 overflow-hidden rounded bg-zinc-50 border border-zinc-100">
                              <Image
                                src={item.image}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className='font-medium text-black group-hover:underline transition duration-150'>
                                {item.name}
                              </span>
                              {item.size && (
                                <span className="text-sm text-zinc-500">Talle: {item.size}</span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className="text-center font-medium text-zinc-600">
                          {item.qty}
                        </TableCell>
                        <TableCell className='text-right font-medium text-zinc-900'>
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
            <Card className="shadow-level-3 border-zinc-200/50 bg-white rounded-lg">
              <CardContent className='p-6 space-y-4'>
                <h2 className="text-xl font-light text-zinc-900 pb-2 border-b border-zinc-100">Resumen de Compra</h2>
                <div className='flex justify-between text-sm'>
                  <div className="text-zinc-500">Productos</div>
                  <div className="font-medium text-zinc-900">{formatCurrency(itemsPrice)}</div>
                </div>
                <div className='flex justify-between text-sm'>
                  <div className="text-zinc-500">Impuestos</div>
                  <div className="font-medium text-zinc-900">{formatCurrency(taxPrice)}</div>
                </div>
                <div className='flex justify-between text-sm'>
                  <div className="text-zinc-500">Envío</div>
                  <div className="font-medium text-zinc-900">{formatCurrency(shippingPrice)}</div>
                </div>
                <div className='flex justify-between text-base font-semibold pt-2 border-t border-zinc-100'>
                  <div className="text-zinc-900 font-medium">Total</div>
                  <div className="text-zinc-950 font-semibold">{formatCurrency(totalPrice)}</div>
                </div>

                <div className="pt-2 space-y-2">
                  {/* Mercado Pago Payment Action */}
                  {!isPaid && paymentMethod === 'MercadoPago' && (
                    <PayWithMercadoPagoButton />
                  )}

                  {/* COD Payment action (or transfer fallback without receipt for admin) */}
                  {isAdmin && !isPaid && paymentMethod !== 'TransferenciaBancaria' && (
                    <MarkAsPaidButton />
                  )}

                  {/* Standard admin buttons for bank transfer fallback when no receipt is uploaded */}
                  {isAdmin && !isPaid && paymentMethod === 'TransferenciaBancaria' && !receiptUrl && (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 text-center">Falta comprobante del cliente</p>
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
