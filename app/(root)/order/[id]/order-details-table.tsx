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
import ShippingStatusForm from './shipping-status-form';
import { FileUploadField } from '@/components/shared/file-upload-field';

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
    totalPrice,
    paymentMethod,
    isDelivered,
    isPaid,
    paidAt,
    deliveredAt,
    receiptUrl,
    expiresAt,
    promoCode,
    discountPrice,
  } = order;

  const { toast } = useToast();

  // Button to mark order as delivered
  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();

    return (
      <Button
        type='button'
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
        className='w-full h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
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
            description:
              res.message || 'Error al iniciar el pago con Mercado Pago',
          });
        }
      });
    };

    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={handlePayment}
        className='w-full h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
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
        type='button'
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
        className='h-10 px-5 rounded-full bg-nike-ink text-white hover:bg-black font-medium text-xs transition-colors'
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
        type='button'
        variant='outline'
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
        className='h-10 px-5 rounded-full border-[#cacacb] text-nike-ink hover:bg-[#f5f5f5] font-medium text-xs transition-colors'
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
        className='w-full h-12 rounded-full bg-nike-ink text-white hover:bg-black font-medium transition-colors'
      >
        {isPending ? 'Procesando...' : 'Confirmar Pago'}
      </Button>
    );
  };

  return (
    <div className='bg-white min-h-screen py-8 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto space-y-6'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#e5e5e5] pb-5'>
          <h1 className='font-marder-display font-medium text-3xl sm:text-4xl tracking-tight text-nike-ink'>
            Orden {formatId(id)}
          </h1>
          <div className='flex items-center gap-4 print:hidden'>
            {(isAdmin || isSeller) && (
              <button
                onClick={() => window.print()}
                className='text-xs font-semibold uppercase tracking-wider text-nike-ink underline hover:opacity-70 transition-opacity'
              >
                Imprimir Comprobante
              </button>
            )}
            <Link
              href={isAdmin || isSeller ? '/admin/orders' : '/user/orders'}
              className='text-xs font-semibold uppercase tracking-wider text-[#757575] hover:text-nike-ink transition-colors'
            >
              {isAdmin || isSeller
                ? '← Volver a los pedidos'
                : '← Volver a mis pedidos'}
            </Link>
          </div>
        </div>

        <div className='grid md:grid-cols-3 gap-6'>
          <div className='col-span-2 space-y-6 overflow-x-auto'>
            {/* Payment Method Card */}
            <Card className='border border-[#e5e5e5] bg-white rounded-2xl shadow-sm'>
              <CardContent className='p-6'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-nike-ink'>
                  Método de Pago
                </h2>
                <div className='mt-3 flex items-center justify-between'>
                  <span className='text-sm font-medium text-nike-ink'>
                    {paymentMethod === 'TransferenciaBancaria'
                      ? 'Transferencia Bancaria'
                      : paymentMethod === 'MercadoPago'
                        ? 'Mercado Pago'
                        : paymentMethod}
                  </span>
                  {isPaid ? (
                    <span className='inline-flex items-center text-xs font-semibold bg-green-50 text-green-700 border border-green-200/60 px-3 py-1 rounded-full'>
                      Pagado el {formatDateTime(paidAt!).dateTime}
                    </span>
                  ) : (
                    <span className='inline-flex items-center text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 px-3 py-1 rounded-full'>
                      Pendiente de Pago
                    </span>
                  )}
                </div>

                {/* Expiration Timer Warning for Bank Transfer */}
                {!isPaid &&
                  paymentMethod === 'TransferenciaBancaria' &&
                  expiresAt && (
                    <p className='mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl'>
                      Tenés tiempo de subir tu comprobante de transferencia
                      hasta el:{' '}
                      <strong>{formatDateTime(expiresAt).dateTime}</strong>.
                      Luego de este plazo, la orden expirará y el stock será
                      liberado automáticamente.
                    </p>
                  )}

                {/* Bank Details & Upload Section for Unpaid Bank Transfer */}
                {!isPaid && paymentMethod === 'TransferenciaBancaria' && (
                  <div className='mt-4 border-t border-[#e5e5e5] pt-4 space-y-4'>
                    {!receiptUrl ? (
                      <>
                        <div className='p-4 rounded-xl bg-[#f5f5f5] border border-[#e5e5e5] space-y-2 text-xs text-[#484848]'>
                          <h3 className='font-bold uppercase tracking-wider text-nike-ink text-xs'>
                            Datos para la Transferencia
                          </h3>
                          <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1'>
                            <p>
                              <strong>Banco:</strong> {bank}
                            </p>
                            <p>
                              <strong>Titular:</strong> {accountHolder}
                            </p>
                            <p>
                              <strong>CBU:</strong> {cbu}
                            </p>
                            <p>
                              <strong>Alias:</strong> {alias}
                            </p>
                            <p>
                              <strong>CUIT:</strong> {cuit}
                            </p>
                          </div>
                        </div>

                        <div className='p-6 border border-[#e5e5e5] rounded-xl bg-[#fafafa]'>
                          <FileUploadField
                            files={receiptUrl ? [receiptUrl] : []}
                            onChange={async (files) => {
                              if (files && files[0]) {
                                const result = await updateOrderReceipt(
                                  id,
                                  files[0]
                                );
                                toast({
                                  variant: result.success
                                    ? 'default'
                                    : 'destructive',
                                  description: result.message,
                                });
                              }
                            }}
                            endpoint='receiptUploader'
                            accept='image/*,.pdf'
                            multiple={false}
                            maxFiles={1}
                            placeholder='Arrastrá tu comprobante o hacé clic para seleccionar'
                            description='PNG, JPG, WEBP o PDF — máximo 8MB'
                            fileType='document'
                          />
                        </div>
                      </>
                    ) : (
                      <div className='bg-[#f5f5f5] text-nike-ink p-4 rounded-xl border border-[#e5e5e5]'>
                        <p className='text-sm font-semibold text-nike-ink'>¡Comprobante enviado!</p>
                        <p className='text-xs mt-1 text-[#757575]'>
                          Tu comprobante ha sido subido.{' '}
                          <a
                            href={receiptUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-block underline text-nike-ink font-semibold'
                          >
                            Ver comprobante enviado
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin/Seller Approval view for TransferenciaBancaria with Receipt */}
                {(isAdmin || isSeller) &&
                  !isPaid &&
                  paymentMethod === 'TransferenciaBancaria' &&
                  receiptUrl && (
                    <div className='mt-4 border-t border-[#e5e5e5] pt-4 space-y-4'>
                      <div className='bg-amber-50 border border-amber-200/60 p-4 rounded-xl text-nike-ink space-y-3'>
                        <div className='flex items-center gap-2 text-amber-800 font-semibold text-sm'>
                          <AlertTriangle className='h-4 w-4' /> Comprobante en
                          Revisión
                        </div>
                        <p className='text-xs text-amber-900'>
                          El equipo de administración está revisando el
                          comprobante. Una vez aprobado, el pago se marcará como
                          confirmado.
                        </p>
                        <div className='relative aspect-[4/3] max-w-xs overflow-hidden rounded-xl border border-[#e5e5e5] bg-white'>
                          <Image
                            src={receiptUrl}
                            alt='Comprobante'
                            fill
                            className='object-contain'
                          />
                        </div>
                        <div className='flex flex-wrap gap-2 pt-2'>
                          <ApprovePaymentButton />
                          <RejectPaymentButton />
                        </div>
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {/* Shipping Address Card */}
            <Card className='border border-[#e5e5e5] bg-white rounded-2xl shadow-sm'>
              <CardContent className='p-6'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-nike-ink'>
                  Dirección de Envío
                </h2>
                <div className='text-[#484848] text-sm mt-3 space-y-0.5'>
                  <p className='font-semibold text-nike-ink'>{shippingAddress.fullName}</p>
                  <p className='text-[#757575]'>
                    {shippingAddress.streetAddress}, {shippingAddress.city},{' '}
                    {shippingAddress.postalCode}, {shippingAddress.country}
                  </p>
                </div>
                <div className='mt-4'>
                  <div className='flex items-center gap-2'>
                    <span className='inline-flex items-center text-xs font-semibold bg-[#f5f5f5] text-nike-ink border border-[#e5e5e5] px-3 py-1 rounded-full'>
                      Estado: {order.shippingStatus || 'Pendiente'}
                    </span>
                    {isDelivered ? (
                      <span className='inline-flex items-center text-xs font-semibold bg-green-50 text-green-700 border border-green-200/60 px-3 py-1 rounded-full'>
                        Entregado el {formatDateTime(deliveredAt!).dateTime}
                      </span>
                    ) : (
                      <span className='inline-flex items-center text-xs font-semibold bg-red-50 text-red-700 border border-red-200/60 px-3 py-1 rounded-full'>
                        No Entregado
                      </span>
                    )}
                  </div>
                  {order.shippingNotes && (
                    <p className='text-xs text-[#757575] mt-2'>
                      <span className='font-semibold text-nike-ink'>Notas:</span>{' '}
                      {order.shippingNotes}
                    </p>
                  )}
                  {(isAdmin || isSeller) && (
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
            <Card className='border border-[#e5e5e5] bg-white rounded-2xl shadow-sm'>
              <CardContent className='p-6'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-nike-ink'>
                  Productos
                </h2>
                <Table className='mt-3'>
                  <TableHeader>
                    <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] pl-0'>
                        Producto
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] text-center'>
                        Cantidad
                      </TableHead>
                      <TableHead className='text-xs uppercase font-semibold text-[#757575] text-right pr-0'>
                        Precio
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.orderitems.map((item) => (
                      <TableRow
                        key={`${item.slug}-${item.size || ''}`}
                        className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors duration-150'
                      >
                        <TableCell className='py-3 pl-0'>
                          <Link
                            href={`/product/${item.slug}`}
                            className='flex items-center gap-3 group'
                          >
                            <div className='w-12 h-12 rounded-lg bg-[#f5f5f5] p-1 flex-shrink-0 flex items-center justify-center'>
                              <Image
                                src={item.image}
                                alt={item.name}
                                width={44}
                                height={44}
                                className='object-contain'
                              />
                            </div>
                            <div className='flex flex-col gap-0.5'>
                              <span className='text-sm font-medium text-nike-ink group-hover:underline transition duration-150'>
                                {item.name}
                              </span>
                              {item.size && (
                                <span className='text-xs text-[#757575]'>
                                  Talle: {item.size}
                                </span>
                              )}
                            </div>
                          </Link>
                        </TableCell>
                        <TableCell className='text-center text-sm font-semibold text-nike-ink tabular-nums'>
                          {item.qty}
                        </TableCell>
                        <TableCell className='text-right text-sm font-semibold text-nike-ink tabular-nums pr-0'>
                          ${item.priceUsed}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Order Summary & Actions */}
          <div className='space-y-6'>
            <Card className='border border-[#e5e5e5] bg-white rounded-2xl shadow-sm'>
              <CardContent className='p-6'>
                <h2 className='text-xs font-bold uppercase tracking-wider text-nike-ink pb-3 border-b border-[#e5e5e5]'>
                  Resumen de Compra
                </h2>
                <div className='space-y-3 mt-4'>
                  <div className='flex justify-between text-sm text-[#757575]'>
                    <div>Productos</div>
                    <div className='font-semibold text-nike-ink tabular-nums'>
                      {formatCurrency(itemsPrice)}
                    </div>
                  </div>
                  {Number(discountPrice || 0) > 0 && (
                    <div className='flex justify-between text-sm text-green-700 font-medium'>
                      <div>
                        Descuento ({promoCode}
                        {paymentMethod === 'TransferenciaBancaria'
                          ? ' con Transferencia'
                          : paymentMethod === 'MercadoPago'
                            ? ' con MercadoPago'
                            : ''}
                        )
                      </div>
                      <div className='font-semibold text-green-700 tabular-nums'>
                        -{formatCurrency(discountPrice || '0')}
                      </div>
                    </div>
                  )}
                  <div className='flex justify-between text-sm text-[#757575]'>
                    <div>Envío</div>
                    <div className='font-semibold text-nike-ink tabular-nums'>
                      {formatCurrency(shippingPrice)}
                    </div>
                  </div>
                  <div className='flex justify-between items-baseline pt-3 border-t border-[#e5e5e5]'>
                    <div className='font-bold text-base text-nike-ink'>Total</div>
                    <div className='text-2xl font-bold tracking-tight text-nike-ink tabular-nums'>
                      {formatCurrency(totalPrice)}
                    </div>
                  </div>
                </div>

                <div className='pt-6 space-y-2 print:hidden'>
                  {/* Mercado Pago Payment Action */}
                  {!isPaid && paymentMethod === 'MercadoPago' && !isAdmin && (
                    <PayWithMercadoPagoButton />
                  )}

                  {/* Standard admin buttons for bank transfer fallback when no receipt is uploaded */}
                  {(isAdmin || isSeller) &&
                    !isPaid &&
                    paymentMethod === 'TransferenciaBancaria' &&
                    !receiptUrl && (
                      <div className='space-y-2'>
                        <p className='text-xs text-[#757575] text-center'>
                          Falta comprobante del cliente
                        </p>
                        <MarkAsPaidButton />
                      </div>
                    )}

                  {/* Mark as Delivered Action */}
                  {(isAdmin || isSeller) && isPaid && !isDelivered && (
                    <MarkAsDeliveredButton />
                  )}
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
