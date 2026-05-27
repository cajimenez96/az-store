import { requireAdmin } from '@/lib/auth-guard';
import { getBankSettings } from '@/lib/actions/settings.actions';
import { Metadata } from 'next';
import BankSettingsForm from './bank-settings-form';

export const metadata: Metadata = { title: 'Configuración' };

const SettingsPage = async () => {
  await requireAdmin();
  const bankSettings = await getBankSettings();

  return (
    <div className='max-w-2xl space-y-8'>
      <div>
        <h1 className='az-heading-sm text-az-ink-deep'>Configuración</h1>
        <p className='az-body-sm text-az-stone mt-1'>Ajustes generales de la tienda.</p>
      </div>

      <section className='bg-az-canvas border border-az-hairline-soft rounded-az-lg p-6 space-y-4'>
        <div className='border-b border-az-hairline-soft pb-3'>
          <h2 className='az-body-lg-bold text-az-ink-deep'>Datos Bancarios</h2>
          <p className='az-body-sm text-az-stone mt-0.5'>
            Esta información se muestra al cliente cuando elige pagar por transferencia bancaria.
          </p>
        </div>
        <BankSettingsForm initialValues={bankSettings} />
      </section>
    </div>
  );
};

export default SettingsPage;
