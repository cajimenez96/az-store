import { MercadoPagoConfig } from 'mercadopago';
import { getMercadoPagoSettings } from './actions/settings.actions';

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

export async function getMercadoPagoClient() {
  try {
    const settings = await getMercadoPagoSettings();
    return new MercadoPagoConfig({
      accessToken: settings.accessToken,
    });
  } catch {
    return mpClient;
  }
}
