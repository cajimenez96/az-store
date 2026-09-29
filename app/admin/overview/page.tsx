import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getOrderSummary,
  getAbandonedCartMetrics,
} from '@/lib/actions/order.actions';
import {
  getSellerCommissionSummary,
  getMyCommissionRate,
} from '@/lib/actions/user.actions';
import { formatCurrency, formatDateTime, formatNumber, cn } from '@/lib/utils';
import {
  BadgeDollarSign,
  Barcode,
  CreditCard,
  Users,
  AlertTriangle,
  Truck,
  Clock,
  Percent,
  ShoppingCart,
  RotateCcw,
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { auth } from '@/auth';
import SettingForm from './setting-form';
import CommissionEditor from './commission-editor';
import { Button } from '@/components/ui/button';

const Charts = dynamic(() => import('./charts'), { ssr: true });

export const metadata: Metadata = {
  title: 'Panel de Control',
};

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  sublabel,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  accent?: 'warning' | 'primary' | 'critical' | 'default';
  sublabel?: string;
}) {
  const accentMap = {
    default: {
      icon: 'text-[#111111]',
      bg: 'bg-[#f5f5f5]',
      value: 'text-[#111111]',
    },
    primary: {
      icon: 'text-[#111111]',
      bg: 'bg-[#f5f5f5]',
      value: 'text-[#111111]',
    },
    warning: {
      icon: 'text-[#d97706]',
      bg: 'bg-[#fef3c7]',
      value: 'text-[#111111]',
    },
    critical: {
      icon: 'text-[#d30005]',
      bg: 'bg-[#fee2e2]',
      value: 'text-[#d30005]',
    },
  };

  const colors = accentMap[accent ?? 'default'];

  return (
    <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 flex flex-col justify-between gap-4 shadow-none'>
      <div className='flex items-center justify-between'>
        <p className='text-xs font-semibold uppercase tracking-wider text-[#707072]'>
          {label}
        </p>
        <div
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center',
            colors.bg,
            colors.icon
          )}
        >
          <Icon className='w-4 h-4' />
        </div>
      </div>
      <div>
        <div className={cn('text-3xl font-medium tracking-tight font-marder-display tabular-nums', colors.value)}>
          {value}
        </div>
        {sublabel && <p className='text-xs text-[#707072] mt-1'>{sublabel}</p>}
      </div>
    </div>
  );
}

const AdminOverviewPage = async () => {
  const session = await requireAdminOrSeller();
  const isAdmin = session?.user?.role === 'admin';

  const summary = await getOrderSummary();

  const commissionSummary = isAdmin ? await getSellerCommissionSummary() : null;
  const sellerOwnRate =
    !isAdmin && session?.user?.id
      ? await getMyCommissionRate(session.user.id)
      : null;

  const abandonedCartMetrics = isAdmin ? await getAbandonedCartMetrics() : null;

  return (
    <div className='space-y-8 max-w-7xl mx-auto'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl lg:text-4xl font-medium tracking-tight text-[#111111] font-marder-display'>
            Panel de Control
          </h1>
          <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-1'>
            Métricas clave y estado de operaciones
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='Ingresos Totales'
          value={formatCurrency(
            summary.totalSales._sum.totalPrice?.toString() || 0
          )}
          icon={BadgeDollarSign}
        />
        <MetricCard
          label='Ventas'
          value={formatNumber(summary.ordersCount)}
          icon={CreditCard}
        />
        <MetricCard
          label='Clientes'
          value={formatNumber(summary.usersCount)}
          icon={Users}
        />
        <MetricCard
          label='Productos'
          value={formatNumber(summary.productsCount)}
          icon={Barcode}
        />
      </div>

      {/* Alert cards */}
      <div className='grid gap-4 md:grid-cols-3'>
        <MetricCard
          label='Pendientes de Pago'
          value={formatNumber(summary.pendingPaymentsCount)}
          icon={Clock}
          accent='warning'
          sublabel='Órdenes a la espera de comprobantes'
        />
        <MetricCard
          label='Pendientes de Envío'
          value={formatNumber(summary.pendingDeliveriesCount)}
          icon={Truck}
          accent='primary'
          sublabel='Órdenes pagadas listas para enviar'
        />
        <MetricCard
          label='Stock Crítico'
          value={formatNumber(summary.criticalStockCount)}
          icon={AlertTriangle}
          accent='critical'
          sublabel={`Talles con ${summary.criticalStockThreshold} o menos unidades`}
        />
      </div>

      {/* Abandoned cart metrics */}
      {isAdmin && abandonedCartMetrics && (
        <div className='grid gap-4 md:grid-cols-3'>
          <MetricCard
            label='Carritos Abandonados'
            value={formatNumber(abandonedCartMetrics.abandonedCartsCount)}
            icon={ShoppingCart}
            accent='warning'
            sublabel='Últimos 7 días sin actividad >1h'
          />
          <MetricCard
            label='Emails de Recuperación'
            value={formatNumber(abandonedCartMetrics.recoveryEmailsSent)}
            icon={Clock}
            sublabel='Enviados en los últimos 7 días'
          />
          <MetricCard
            label='Tasa de Recuperación'
            value={`${abandonedCartMetrics.recoveryRate}%`}
            icon={RotateCcw}
            accent='primary'
            sublabel={`${formatNumber(abandonedCartMetrics.recoveredCarts)} carritos recuperados`}
          />
        </div>
      )}

      {/* Commission section */}
      {isAdmin && commissionSummary !== null && (
        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 shadow-none'>
          <div className='mb-4'>
            <h2 className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Comisiones de Vendedores
            </h2>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-0.5'>
              Liquidación y seguimiento por vendedor
            </p>
          </div>
          {commissionSummary.length === 0 ? (
            <p className='text-xs text-[#707072] py-6 text-center font-medium'>
              No hay vendedores registrados.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                    Vendedor
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                    Email
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>
                    Comisión
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>
                    Total vendido
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>
                    Comisión ganada
                  </TableHead>
                  <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionSummary.map((seller) => (
                  <TableRow
                    key={seller.id}
                    className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                  >
                    <TableCell className='text-sm font-semibold text-[#111111] py-4'>
                      {seller.name}
                    </TableCell>
                    <TableCell className='text-sm text-[#707072] py-4'>
                      {seller.email}
                    </TableCell>
                    <TableCell className='text-sm text-[#111111] py-4 text-right tabular-nums'>
                      {seller.commissionRate != null
                        ? `${Math.round(seller.commissionRate * 100)}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='text-sm text-[#111111] py-4 text-right tabular-nums'>
                      {formatCurrency(seller.totalSales)}
                    </TableCell>
                    <TableCell className='text-sm font-semibold text-[#111111] py-4 text-right tabular-nums'>
                      {formatCurrency(seller.totalCommission)}
                    </TableCell>
                    <TableCell className='py-4 text-right'>
                      <CommissionEditor
                        sellerId={seller.id}
                        sellerName={seller.name}
                        currentRate={seller.commissionRate}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {!isAdmin && sellerOwnRate !== undefined && (
        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 flex items-center gap-4 shadow-none'>
          <div className='w-10 h-10 rounded-full bg-[#f5f5f5] flex items-center justify-center text-[#111111]'>
            <Percent className='w-5 h-5' />
          </div>
          <div>
            <p className='text-xs font-semibold text-[#707072] uppercase tracking-wider'>
              Tu comisión por ventas POS
            </p>
            <p className='text-2xl font-medium tracking-tight text-[#111111] font-marder-display mt-0.5'>
              {sellerOwnRate != null
                ? `${Math.round(sellerOwnRate * 100)}%`
                : 'Sin comisión asignada'}
            </p>
          </div>
        </div>
      )}

      {/* Charts + recent sales */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-7'>
        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 col-span-4 shadow-none'>
          <div className='mb-6'>
            <h2 className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Resumen de Ventas
            </h2>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-0.5'>
              Facturación mensual acumulada
            </p>
          </div>
          <Charts data={{ salesData: summary.salesData }} />
        </div>

        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 col-span-3 shadow-none'>
          <div className='mb-6'>
            <h2 className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Ventas Recientes
            </h2>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-0.5'>
              Últimas transacciones registradas
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                  Comprador
                </TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                  Fecha
                </TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                  Total
                </TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.map((order) => (
                <TableRow
                  key={order.id}
                  className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                >
                  <TableCell className='text-sm text-[#111111] py-3.5'>
                    {order?.user?.name ?? 'Usuario Eliminado'}
                  </TableCell>
                  <TableCell className='text-sm text-[#707072] py-3.5 tabular-nums'>
                    {formatDateTime(order.createdAt).dateOnly}
                  </TableCell>
                  <TableCell className='text-sm font-semibold text-[#111111] py-3.5 tabular-nums'>
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  <TableCell className='py-3.5'>
                    <Link href={`/order/${order.id}`}>
                      <Button
                        variant='outline'
                        size='sm'
                        className='h-8 px-4 text-xs font-semibold uppercase tracking-wider rounded-full border border-[#e5e5e5] text-[#111111] hover:bg-[#111111] hover:text-white transition-colors'
                      >
                        Ver
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Config + revenue by method */}
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-3'>
          <SettingForm
            settingKey='CRITICAL_STOCK_THRESHOLD'
            initialValue={summary.criticalStockThreshold.toString()}
            label='Límite de Stock Crítico'
            description='Las alertas se activarán cuando un talle llegue a esta cantidad o menos.'
          />
        </div>

        <div className='bg-white rounded-2xl border border-[#e5e5e5] p-6 col-span-4 shadow-none'>
          <div className='mb-6'>
            <h2 className='text-xl font-medium tracking-tight text-[#111111] font-marder-display'>
              Ingresos por Método de Pago
            </h2>
            <p className='text-xs text-[#707072] uppercase tracking-wider font-semibold mt-0.5'>
              Distribución de pagos procesados
            </p>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-[#e5e5e5] hover:bg-transparent'>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10'>
                  Método de Pago
                </TableHead>
                <TableHead className='text-xs font-semibold text-[#707072] uppercase tracking-wider h-10 text-right'>
                  Ingresos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.salesByMethod.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className='text-center text-xs font-semibold text-[#707072] py-8'
                  >
                    No hay datos de ingresos
                  </TableCell>
                </TableRow>
              ) : (
                summary.salesByMethod.map((item) => {
                  const displayName =
                    item.paymentMethod === 'TransferenciaBancaria'
                      ? 'Transferencia Bancaria'
                      : item.paymentMethod === 'MercadoPago'
                        ? 'Mercado Pago'
                        : item.paymentMethod;

                  return (
                    <TableRow
                      key={item.paymentMethod}
                      className='border-b border-[#e5e5e5] last:border-0 hover:bg-[#fafafa] transition-colors'
                    >
                      <TableCell className='text-sm font-semibold text-[#111111] py-3.5'>
                        {displayName}
                      </TableCell>
                      <TableCell className='text-sm font-semibold text-[#111111] py-3.5 text-right tabular-nums'>
                        {formatCurrency(item.totalSales)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
