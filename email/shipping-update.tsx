import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import sampleData from '@/db/sample-data';
require('dotenv').config();

ShippingUpdateEmail.PreviewProps = {
  order: {
    id: crypto.randomUUID(),
    userId: '123',
    user: {
      name: 'John Doe',
      email: 'test@test.com',
    },
    paymentMethod: 'MercadoPago',
    shippingAddress: {
      fullName: 'John Doe',
      streetAddress: '123 Main st',
      city: 'New York',
      province: 'NY',
      postalCode: '10001',
      country: 'US',
      phone: '1122334455',
      contactEmail: 'test@test.com',
    },
    createdAt: new Date(),
    totalPrice: '100',
    taxPrice: '10',
    shippingPrice: '10',
    itemsPrice: '80',
    orderitems: sampleData.products.map((x) => ({
      name: x.name,
      orderId: '123',
      productId: '123',
      slug: x.slug,
      qty: x.stock,
      image: x.images[0],
      price: x.price.toString(),
    })),
    isDelivered: true,
    deliveredAt: new Date(),
    isPaid: true,
    paidAt: new Date(),
    paymentResult: {
      id: '123',
      status: 'succeeded',
      pricePaid: '100',
      email_address: 'test@test.com',
    },
    receiptUrl: null,
    expiresAt: null,
    shippingStatus: 'Enviado',
    shippingNotes: null,
  },
} satisfies OrderInformationProps;

const dateFormatter = new Intl.DateTimeFormat('es', { dateStyle: 'medium' });

type OrderInformationProps = {
  order: Order;
};

export default function ShippingUpdateEmail({ order }: OrderInformationProps) {
  return (
    <Html>
      <Preview>Actualización de tu Envío</Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>Actualización de tu pedido</Heading>
            <Text>
              Hola {order.user.name}, tenemos novedades sobre tu pedido con ID {order.id.toString()}.
            </Text>
            {order.isDelivered ? (
              <Text className='font-bold text-green-600'>¡Tu pedido ha sido entregado exitosamente!</Text>
            ) : (
              <Text className='font-bold text-blue-600'>El estado de tu envío ha sido actualizado.</Text>
            )}
            <Section>
              <Row>
                <Column>
                  <Text className='mb-0 mr-4 text-gray-500 whitespace-nowrap text-nowrap'>
                    Dirección de envío
                  </Text>
                  <Text className='mt-0 mr-4'>
                    {order.shippingAddress.streetAddress}, {order.shippingAddress.city}
                  </Text>
                </Column>
              </Row>
            </Section>
            <Section className='border border-solid border-gray-500 rounded-lg p-4 md:p-6 my-4'>
              {order.orderitems.map((item) => (
                <Row key={item.productId} className='mt-8'>
                  <Column className='w-20'>
                    <Img
                      width='80'
                      alt={item.name}
                      className='rounded'
                      src={
                        item.image.startsWith('/')
                          ? `${process.env.NEXT_PUBLIC_SERVER_URL}${item.image}`
                          : item.image
                      }
                    />
                  </Column>
                  <Column className='align-top'>
                    {item.name} x {item.qty}
                  </Column>
                </Row>
              ))}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
