import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrderSummary } from '@/lib/actions/order.actions';
import { getSellerCommissionSummary, getMyCommissionRate } from '@/lib/actions/user.actions';
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
} from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdminOrSeller } from '@/lib/auth-guard';
import { auth } from '@/auth';
import SettingForm from './setting-form';
import CommissionEditor from './commission-editor';
import { Button } from '@/components/ui/button';



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
      icon: 'text-az-steel',
      value: 'text-az-ink-deep',
    },
    primary: {
      icon: 'text-az-primary',
      value: 'text-az-primary',
    },
    warning: {
      icon: 'text-az-attention',
      value: 'text-az-attention',
    },
    critical: {
      icon: 'text-az-critical',
      value: 'text-az-critical',
    },
  };

  const colors = accentMap[accent ?? 'default'];

  return (
    <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 flex flex-col gap-3'>
      <div className='flex items-center justify-between'>
        <p className='az-caption-bold text-az-steel uppercase tracking-wider'>{label}</p>
        <div className={cn('w-8 h-8 rounded-az-lg bg-az-surface-soft flex items-center justify-center', colors.icon)}>
          <Icon className='w-4 h-4' />
        </div>
      </div>
      <div className={cn('az-heading-sm tabular-nums', colors.value)}>{value}</div>
      {sublabel && <p className='az-caption text-az-stone'>{sublabel}</p>}
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

  return (
    <div className='space-y-6'>
      <h1 className='az-heading-lg text-az-ink-deep'>Panel de Control</h1>

      {/* KPI row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='Ingresos Totales'
          value={formatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0)}
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
          sublabel='Talles con 2 o menos unidades'
        />
      </div>

      {/* Commission section */}
      {isAdmin && commissionSummary !== null && (
        <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5'>
          <p className='az-body-md-bold text-az-ink-deep mb-4'>Comisiones de Vendedores</p>
          {commissionSummary.length === 0 ? (
            <p className='az-body-sm text-az-stone py-4 text-center'>No hay vendedores registrados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className='border-b border-az-hairline-soft hover:bg-transparent'>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Vendedor</TableHead>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Email</TableHead>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9 text-right'>Comisión</TableHead>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9 text-right'>Total vendido</TableHead>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9 text-right'>Comisión ganada</TableHead>
                  <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissionSummary.map((seller) => (
                  <TableRow
                    key={seller.id}
                    className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors'
                  >
                    <TableCell className='az-body-sm-bold text-az-ink py-3'>{seller.name}</TableCell>
                    <TableCell className='az-body-sm text-az-charcoal py-3'>{seller.email}</TableCell>
                    <TableCell className='az-body-sm text-az-ink-deep py-3 text-right tabular-nums'>
                      {seller.commissionRate != null
                        ? `${Math.round(seller.commissionRate * 100)}%`
                        : '—'}
                    </TableCell>
                    <TableCell className='az-body-sm text-az-ink-deep py-3 text-right tabular-nums'>
                      {formatCurrency(seller.totalSales)}
                    </TableCell>
                    <TableCell className='az-body-sm-bold text-az-ink-deep py-3 text-right tabular-nums'>
                      {formatCurrency(seller.totalCommission)}
                    </TableCell>
                    <TableCell className='py-3 text-right'>
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
        <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 flex items-center gap-3'>
          <div className='w-9 h-9 rounded-az-lg bg-az-surface-soft flex items-center justify-center text-az-primary'>
            <Percent className='w-4 h-4' />
          </div>
          <div>
            <p className='az-caption-bold text-az-stone uppercase tracking-wider'>Tu comisión por ventas POS</p>
            <p className='az-heading-sm text-az-ink-deep mt-0.5'>
              {sellerOwnRate != null ? `${Math.round(sellerOwnRate * 100)}%` : 'Sin comisión asignada'}
            </p>
          </div>
        </div>
      )}

      {/* Charts + recent sales */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 col-span-4'>
          <p className='az-body-md-bold text-az-ink-deep mb-4'>Resumen</p>
          <Charts data={{ salesData: summary.salesData }} />
        </div>

        <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 col-span-3'>
          <p className='az-body-md-bold text-az-ink-deep mb-4'>Ventas Recientes</p>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-az-hairline-soft hover:bg-transparent'>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Comprador</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Fecha</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Total</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.latestSales.map((order) => (
                <TableRow
                  key={order.id}
                  className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors'
                >
                  <TableCell className='az-body-sm text-az-ink py-3'>
                    {order?.user?.name ?? 'Usuario Eliminado'}
                  </TableCell>
                  <TableCell className='az-body-sm text-az-charcoal py-3 tabular-nums'>
                    {formatDateTime(order.createdAt).dateOnly}
                  </TableCell>
                  <TableCell className='az-body-sm-bold text-az-ink-deep py-3 tabular-nums'>
                    {formatCurrency(order.totalPrice)}
                  </TableCell>
                  <TableCell className='py-3'>
                    <Link href={`/order/${order.id}`}>
                      <Button variant='outline' size='sm' className='h-7 az-caption-bold rounded-az-full border-az-hairline-soft text-az-ink hover:bg-az-ink-deep hover:text-white hover:border-az-ink-deep transition-colors'>
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
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <div className='col-span-3'>
          <SettingForm
            settingKey='CRITICAL_STOCK_THRESHOLD'
            initialValue={summary.criticalStockThreshold.toString()}
            label='Límite de Stock Crítico'
            description='Las alertas se activarán cuando un talle llegue a esta cantidad o menos.'
          />
        </div>

        <div className='bg-az-canvas rounded-az-xl border border-az-hairline-soft p-5 col-span-4'>
          <p className='az-body-md-bold text-az-ink-deep mb-4'>Ingresos por Método de Pago</p>
          <Table>
            <TableHeader>
              <TableRow className='border-b border-az-hairline-soft hover:bg-transparent'>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9'>Método de Pago</TableHead>
                <TableHead className='az-caption-bold text-az-stone uppercase tracking-wider h-9 text-right'>Ingresos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.salesByMethod.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='text-center az-body-sm text-az-stone py-8'>
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
                      className='border-b border-az-hairline-soft last:border-0 hover:bg-az-surface-soft/50 transition-colors'
                    >
                      <TableCell className='az-body-sm-bold text-az-ink py-3'>
                        {displayName}
                      </TableCell>
                      <TableCell className='az-body-sm-bold text-az-ink-deep py-3 text-right tabular-nums'>
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
