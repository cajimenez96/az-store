import { requireAdmin } from '@/lib/auth-guard';
import { getBankSettings, getMercadoPagoSettings, getShippingSettings } from '@/lib/actions/settings.actions';
import { Metadata } from 'next';
import BankSettingsForm from './bank-settings-form';
import MercadoPagoSettingsForm from './mercadopago-settings-form';
import ShippingSettingsForm from './shipping-settings-form';

export const metadata: Metadata = { title: 'Configuración' };

const SettingsPage = async () => {
  await requireAdmin();
  const bankSettings = await getBankSettings();
  const mpSettings = await getMercadoPagoSettings();
  const shippingSettings = await getShippingSettings();

  return (
    <div className='max-w-3xl space-y-8'>
      <div>
        <h1 className='font-marder-display text-3xl font-black uppercase tracking-tight text-[#111111]'>Configuración</h1>
        <p className='text-sm text-[#707072] mt-1'>Ajustes generales y pasarelas de pago de la tienda.</p>
      </div>

      <section className='bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm'>
        <div className='border-b border-[#e5e5e5] pb-4'>
          <h2 className='text-lg font-bold text-[#111111]'>Envíos</h2>
          <p className='text-sm text-[#707072] mt-0.5'>
            Configura el monto mínimo para envío gratis y las localidades con retiro disponible.
          </p>
        </div>
        <ShippingSettingsForm initialValues={shippingSettings} />
      </section>

      <section className='bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm'>
        <div className='border-b border-[#e5e5e5] pb-4'>
          <h2 className='text-lg font-bold text-[#111111]'>Datos Bancarios</h2>
          <p className='text-sm text-[#707072] mt-0.5'>
            Esta información se muestra al cliente cuando elige pagar por transferencia bancaria.
          </p>
        </div>
        <BankSettingsForm initialValues={bankSettings} />
      </section>

      <section className='bg-white border border-[#e5e5e5] rounded-2xl p-6 md:p-8 space-y-6 shadow-sm'>
        <div className='border-b border-[#e5e5e5] pb-4'>
          <h2 className='text-lg font-bold text-[#111111]'>MercadoPago</h2>
          <p className='text-sm text-[#707072] mt-0.5'>
            Credenciales para procesar pagos mediante MercadoPago.
          </p>
        </div>
        <MercadoPagoSettingsForm initialValues={mpSettings} />
      </section>
    </div>
  );
};

export default SettingsPage;
