/**
 * Email templates as HTML strings
 */

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000';

const emailHeader = () => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif; color: #1f2937; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 20px 0; }
      .header { text-align: center; padding: 24px 0; border-bottom: 1px solid #e5e7eb; }
      .content { padding: 0 24px; }
      .footer { padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      .button { display: inline-block; background: #2563eb; color: #fff; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 32px 0; }
      .success { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 6px; color: #047857; }
      .error { background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 6px; color: #991b1b; }
      .info-box { background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 16px 0; }
      table { width: 100%; border-collapse: collapse; margin: 16px 0; }
      th { text-align: left; padding: 12px; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #4b5563; }
      td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
      h1 { font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 24px; }
      h2 { font-size: 18px; font-weight: 600; color: #111827; margin: 24px 0 16px; }
      p { margin: 16px 0; color: #4b5563; }
      .link { color: #2563eb; text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <img src="https://marderhombres.com.ar/images/logo-m-negro.png" width="40" height="40" alt="Marder Hombres" style="display:block; margin:0 auto;" />
      </div>
`;

const emailFooter = () => `
      <div class="footer">
        <p style="margin: 0;">© 2026 Marder Hombres. Todos los derechos reservados.</p>
        <p style="margin: 8px 0 0;">
          <a href="https://marderhombres.com.ar" class="link">Visita nuestro sitio</a> •
          <a href="mailto:ventas@marderhombres.com.ar" class="link">Contacto</a>
        </p>
      </div>
    </div>
  </body>
  </html>
`;

export function passwordResetTemplate(
  email: string,
  resetLink: string
): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1>Restablece tu contraseña</h1>
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en AZ Store. Si no fuiste vos, podés ignorar este email de forma segura.</p>
      <p>Para restablecer tu contraseña, hacé clic en el botón de abajo. Este link es válido por 1 hora.</p>
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Restablecer contraseña</a>
      </div>
      <p>O copiá y pegá este link en tu navegador:</p>
      <p style="word-break: break-all; font-family: monospace; background: #f3f4f6; padding: 12px; border-radius: 4px; font-size: 12px;">${resetLink}</p>
      <p>Si tienes problemas, contactanos a <a href="mailto:support@azstore.com" class="link">support@azstore.com</a></p>
      <p style="font-size: 12px; color: #9ca3af; font-style: italic;">Por tu seguridad, nunca compartimos contraseñas por email. Si recibís un email sospechoso, reportalo como spam.</p>
    </div>
    ${emailFooter()}
  `;
}

interface OrderItem {
  name: string;
  size?: string;
  qty: number;
  price: string;
}

export function orderConfirmationTemplate(
  orderId: string,
  customerName: string,
  items: OrderItem[],
  itemsPrice: string,
  shippingPrice: string,
  totalPrice: string,
  paymentMethod: 'MercadoPago' | 'TransferenciaBancaria',
  bankInfo?: {
    bank: string;
    accountHolder: string;
    cbu: string;
    alias: string;
    cuit: string;
  }
): string {
  const itemsRows = items
    .map(
      (item) => `
    <tr>
      <td>${item.name}${item.size ? `<br><span style="font-size: 12px; color: #9ca3af;">Talle: ${item.size}</span>` : ''}</td>
      <td>${item.qty}</td>
      <td>$${item.price}</td>
      <td>$${(parseFloat(item.price) * item.qty).toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  const bankInfoSection =
    paymentMethod === 'TransferenciaBancaria' && bankInfo
      ? `
    <h2>Datos para realizar la transferencia</h2>
    <table>
      <tr><td style="font-weight: 600;">Banco:</td><td>${bankInfo.bank}</td></tr>
      <tr><td style="font-weight: 600;">Titular:</td><td>${bankInfo.accountHolder}</td></tr>
      <tr><td style="font-weight: 600;">CBU:</td><td style="font-family: monospace;">${bankInfo.cbu}</td></tr>
      <tr><td style="font-weight: 600;">Alias:</td><td>${bankInfo.alias}</td></tr>
      <tr><td style="font-weight: 600;">CUIT:</td><td>${bankInfo.cuit}</td></tr>
    </table>
    <p style="font-size: 12px; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; padding: 12px; border-radius: 4px;">Una vez realizada la transferencia, subí el comprobante en tu cuenta para que el admin apruebe tu orden.</p>
  `
      : '';

  return `
    ${emailHeader()}
    <div class="content">
      <h1>¡Gracias por tu compra!</h1>
      <p>Hola ${customerName},</p>
      <p>Confirmamos que hemos recibido tu orden. Acá están los detalles:</p>

      <div class="info-box">
        <strong>Orden ID:</strong> ${orderId}<br>
        <strong>Método de pago:</strong> ${paymentMethod}
      </div>

      <h2>Productos</h2>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;"><span>Subtotal:</span><span>$${itemsPrice}</span></div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;"><span>Envío:</span><span>$${shippingPrice}</span></div>
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 600;"><span>Total:</span><span>$${totalPrice}</span></div>
      </div>

      ${bankInfoSection}

      <div style="text-align: center;">
        <a href="${BASE_URL}/orders/${orderId}" class="button">Ver detalles de la orden</a>
      </div>

      <p>Si tienes preguntas, contactanos a <a href="mailto:support@azstore.com" class="link">support@azstore.com</a></p>
    </div>
    ${emailFooter()}
  `;
}

export function receiptUploadedTemplate(
  orderId: string,
  customerName: string,
  amount: string
): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1>Comprobante de transferencia recibido</h1>
      <p>Hola ${customerName},</p>
      <p>Recibimos el comprobante de transferencia para tu orden. Nuestro equipo lo revisará pronto y te confirmaremos el pago.</p>

      <div class="info-box">
        <strong>Orden ID:</strong> ${orderId}<br>
        <strong>Monto:</strong> $${amount}<br>
        <strong>Estado:</strong> Comprobante pendiente de aprobación
      </div>

      <p>Podés ver el estado en cualquier momento desde tu cuenta:</p>
      <div style="text-align: center;">
        <a href="${BASE_URL}/orders/${orderId}" class="button">Ver orden</a>
      </div>

      <p>En general aprobamos los comprobantes en menos de 24 horas. Te avisaremos por email cuando confirmar el pago.</p>
      <p>Si tienes preguntas, contactanos a <a href="mailto:support@azstore.com" class="link">support@azstore.com</a></p>
    </div>
    ${emailFooter()}
  `;
}

export function transferApprovedTemplate(
  orderId: string,
  customerName: string,
  amount: string
): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1 style="color: #059669;">¡Transferencia aprobada!</h1>
      <p>Hola ${customerName},</p>
      <p>Confirmamos que hemos recibido y aprobado tu transferencia bancaria. Tu orden ha sido pagada y se está preparando para el envío.</p>

      <div class="success" style="text-align: center;">
        <div style="font-size: 32px; margin-bottom: 16px;">✓</div>
        <strong>Orden ID:</strong> ${orderId}<br>
        <strong>Monto aprobado:</strong> $${amount}<br>
        <strong>Estado:</strong> Pagado
      </div>

      <p>Podés seguir el estado de tu envío en cualquier momento desde tu cuenta:</p>
      <div style="text-align: center;">
        <a href="${BASE_URL}/orders/${orderId}" style="background: #059669;" class="button">Ver orden</a>
      </div>

      <p>Te avisaremos por email cuando tu orden esté lista para enviar.</p>
      <p>Gracias por tu compra,<br>Equipo de AZ Store</p>
    </div>
    ${emailFooter()}
  `;
}

export function transferRejectedTemplate(
  orderId: string,
  customerName: string,
  amount: string,
  reason?: string
): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1 style="color: #dc2626;">Transferencia rechazada</h1>
      <p>Hola ${customerName},</p>
      <p>Lamentablemente, no pudimos aprobar la transferencia para tu orden${reason ? ` debido a: ${reason}` : '.'} Por favor, intenta nuevamente.</p>

      <div class="error" style="text-align: center;">
        <div style="font-size: 32px; margin-bottom: 16px;">⚠</div>
        <strong>Orden ID:</strong> ${orderId}<br>
        <strong>Monto:</strong> $${amount}<br>
        <strong>Estado:</strong> Rechazado
      </div>

      <h2>Opciones para resolver tu orden:</h2>
      <div style="background: #f9fafb; padding: 16px; border-radius: 6px;">
        <p><strong>1. Reintentar</strong><br>Revisa los datos bancarios en tu cuenta y vuelve a subir el comprobante.</p>
        <p><strong>2. Cambiar método de pago</strong><br>Contactanos para usar un método alternativo.</p>
        <p><strong>3. Cancelar la orden</strong><br>Si ya enviaste la transferencia, no te preocupes; podemos cancelar la orden.</p>
      </div>

      <div style="text-align: center;">
        <a href="${BASE_URL}/orders/${orderId}" class="button">Ver orden</a>
      </div>

      <p>Si tienes preguntas o necesitas ayuda, contactanos a <a href="mailto:support@azstore.com" class="link">support@azstore.com</a></p>
    </div>
    ${emailFooter()}
  `;
}

export function shippingUpdateTemplate(
  orderId: string,
  customerName: string,
  status: 'Enviado' | 'En tránsito' | 'Entregado',
  trackingNumber?: string,
  estimatedDelivery?: string
): string {
  const isDelivered = status === 'Entregado';
  const statusColor = isDelivered ? '#059669' : '#111827';

  return `
    ${emailHeader()}
    <div class="content">
      <h1 style="color: ${statusColor};">${isDelivered ? '¡Orden entregada!' : 'Tu orden está en camino'}</h1>
      <p>Hola ${customerName},</p>
      <p>Tu orden acaba de ser ${status.toLowerCase()}. Podés seguir el estado en cualquier momento desde tu cuenta.</p>

      <div class="info-box">
        <div style="display: inline-block; background: ${status === 'Entregado' ? '#dcfce7' : status === 'En tránsito' ? '#fef3c7' : '#dbeafe'}; color: ${status === 'Entregado' ? '#166534' : status === 'En tránsito' ? '#92400e' : '#1e40af'}; padding: 8px 12px; border-radius: 4px; font-weight: 600; margin-bottom: 12px;">${status}</div><br>
        <strong>Orden ID:</strong> ${orderId}<br>
        ${trackingNumber ? `<strong>Número de seguimiento:</strong> ${trackingNumber}<br>` : ''}
        ${estimatedDelivery && !isDelivered ? `<strong>Entrega estimada:</strong> ${estimatedDelivery}<br>` : ''}
      </div>

      ${isDelivered ? `<p style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 4px; color: #047857;">¡Gracias por tu compra! Esperamos que disfrutes tu orden. Si tienes dudas o problemas con el producto, no dudes en contactarnos.</p>` : ''}

      <div style="text-align: center;">
        <a href="${BASE_URL}/orders/${orderId}" class="button">Ver orden</a>
      </div>

      <p>Si tienes preguntas sobre el envío, contactanos a <a href="mailto:ventas@marderhombres.com.ar" class="link">ventas@marderhombres.com.ar</a></p>
    </div>
    ${emailFooter()}
  `;
}

export function welcomeTemplate(customerName: string, email: string): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1>¡Bienvenido a AZ Store!</h1>
      <p>Hola ${customerName},</p>
      <p>Tu cuenta ha sido creada exitosamente. Estamos emocionados de tenerte en nuestra comunidad.</p>

      <div class="info-box">
        <p style="margin: 0;"><strong>Email de tu cuenta:</strong> ${email}</p>
      </div>

      <h2>¿Qué podés hacer ahora?</h2>
      <ul style="padding-left: 20px;">
        <li>Explorar nuestro catálogo de productos</li>
        <li>Guardar tus favoritos para comprar después</li>
        <li>Recibir notificaciones de nuevos productos y promociones</li>
        <li>Gestionar tus órdenes y seguimientos</li>
      </ul>

      <div style="text-align: center;">
        <a href="${BASE_URL}/search" class="button">Explorar catálogo</a>
      </div>

      <p>Si tienes alguna pregunta, nuestro equipo de soporte está disponible en <a href="mailto:support@azstore.com" class="link">support@azstore.com</a></p>
      <p style="font-size: 12px; color: #9ca3af;">Ten en cuenta que este email fue generado automáticamente cuando se registró tu cuenta. No respondas a este email directamente.</p>
    </div>
    ${emailFooter()}
  `;
}

export function saleNotificationTemplate(
  productName: string,
  qty: number,
  price: string,
  sellerName: string
): string {
  return `
    ${emailHeader()}
    <div class="content">
      <h1 style="color: #059669;">¡Vendiste un producto!</h1>
      <p>Hola ${sellerName},</p>
      <p>Uno de tus productos ha sido vendido. Aquí están los detalles:</p>

      <div class="info-box">
        <strong>${productName}</strong><br>
        <span style="color: #6b7280;">Cantidad: ${qty}</span><br>
        <span style="color: #6b7280;">Precio unitario: $${parseFloat(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span><br>
        <strong style="color: #059669; font-size: 16px;">Monto total: $${(parseFloat(price) * qty).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
      </div>

      <p>Este monto será transferido a tu cuenta bancaria de acuerdo con nuestros términos de pago.</p>

      <div style="text-align: center;">
        <a href="${BASE_URL}/admin/overview" class="button">Ver mis ventas</a>
      </div>

      <p style="font-size: 12px; color: #9ca3af; font-style: italic;">Este es un email de notificación automática. No respondas a este mensaje.</p>
    </div>
    ${emailFooter()}
  `;
}
