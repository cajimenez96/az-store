// Temporary PayPal client mock to satisfy TypeScript import compilation
// This will be replaced/deleted during the MercadoPago integration phase.

export const paypal = {
  createOrder: async (amount: number) => {
    if (amount === 0) return { id: '' };
    return { id: 'dummy-paypal-id' };
  },
  capturePayment: async (orderId: string) => {
    if (orderId === '') {
      return {
        id: '',
        status: '',
        payer: { email_address: '' },
        purchase_units: [],
      };
    }
    return {
      id: 'dummy-paypal-id',
      status: 'COMPLETED',
      payer: { email_address: 'dummy@example.com' },
      purchase_units: [
        {
          payments: {
            captures: [
              {
                amount: {
                  value: '0',
                },
              },
            ],
          },
        },
      ],
    };
  },
};
