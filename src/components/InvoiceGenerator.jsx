import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateInvoice = async (order) => {
  if (!order) throw new Error('Order data is required to generate invoice');

  // Create a hidden container for the invoice HTML
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.color = '#1a1a1a';
  container.style.boxSizing = 'border-box';

  // Format dates and currency safely
  const orderDate = new Date(order.date || order.orderDate || Date.now()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formatCurrency = (amount) => {
    const num = Number(amount);
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  // Safely extract items and addresses
  const items = order.items || order.lineItems || [];
  const billing = order.billing || order.billingAddress || order.shipping || {};
  const shipping = order.shipping || order.shippingAddress || {};

  // Calculate totals if not explicitly provided
  const subtotal = order.subtotal || items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = order.shippingCost !== undefined ? order.shippingCost : (subtotal >= 75 ? 0 : 10);
  const tax = order.tax !== undefined ? order.tax : (subtotal * 0.08);
  const total = order.total || order.totalAmount || (subtotal + shippingCost + tax);

  // Build the HTML structure
  container.innerHTML = `
    <div style="max-width: 100%; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #2f5725; padding-bottom: 20px;">
        <div>
          <h1 style="color: #2f5725; margin: 0; font-size: 32px; font-weight: bold; letter-spacing: -0.5px;">ANFASTYLES</h1>
          <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Conscious creation for a sustainable future</p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 28px; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1px;">Invoice</h2>
          <p style="margin: 8px 0 4px; font-size: 14px;"><strong>Order #:</strong> ${order.orderNumber || 'N/A'}</p>
          <p style="margin: 0 0 4px; font-size: 14px;"><strong>Date:</strong> ${orderDate}</p>
          <p style="margin: 0; font-size: 14px; text-transform: capitalize;"><strong>Status:</strong> ${order.status || order.orderStatus || 'Completed'}</p>
        </div>
      </div>

      <!-- Company & Customer Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
        <div style="flex: 1; padding-right: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #2f5725; text-transform: uppercase;">From</h3>
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: bold;">Medait LLC</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">1209 Mountain Road Place NE STE R</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">Albuquerque, NM 87110</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">contact@medaitllc.com</p>
          <p style="margin: 0; font-size: 14px; color: #444;">+1 202-773-7432</p>
        </div>
        
        <div style="flex: 1; padding: 0 20px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #2f5725; text-transform: uppercase;">Bill To</h3>
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: bold;">${billing.firstName || order.customerName || ''} ${billing.lastName || ''}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">${billing.address || ''}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">${billing.city || ''}, ${billing.state || ''} ${billing.zip || ''}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">${billing.country || 'US'}</p>
          <p style="margin: 0; font-size: 14px; color: #444;">${order.customerEmail || order.email || ''}</p>
        </div>

        <div style="flex: 1; padding-left: 20px;">
          <h3 style="margin: 0 0 10px; font-size: 16px; color: #2f5725; text-transform: uppercase;">Ship To</h3>
          <p style="margin: 0 0 4px; font-size: 14px; font-weight: bold;">${shipping.firstName || order.customerName || ''} ${shipping.lastName || ''}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">${shipping.address || ''}</p>
          <p style="margin: 0 0 4px; font-size: 14px; color: #444;">${shipping.city || ''}, ${shipping.state || ''} ${shipping.zip || ''}</p>
          <p style="margin: 0; font-size: 14px; color: #444;">${shipping.country || 'US'}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <thead>
          <tr style="background-color: #f4f4f5; border-bottom: 2px solid #e4e4e7;">
            <th style="padding: 12px; text-align: left; font-size: 14px; color: #1a1a1a;">Item Description</th>
            <th style="padding: 12px; text-align: center; font-size: 14px; color: #1a1a1a; width: 100px;">Qty</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; color: #1a1a1a; width: 120px;">Price</th>
            <th style="padding: 12px; text-align: right; font-size: 14px; color: #1a1a1a; width: 120px;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr style="border-bottom: 1px solid #e4e4e7;">
              <td style="padding: 12px; font-size: 14px; color: #333;">
                <strong>${item.name || item.productName || 'Product'}</strong>
                ${item.sku ? `<br><span style="font-size: 12px; color: #666;">SKU: ${item.sku}</span>` : ''}
                ${item.size ? `<br><span style="font-size: 12px; color: #666;">Size: ${item.size.toUpperCase()}</span>` : ''}
                ${item.color ? `<br><span style="font-size: 12px; color: #666;">Color: ${item.color}</span>` : ''}
              </td>
              <td style="padding: 12px; text-align: center; font-size: 14px; color: #333;">${item.quantity || 1}</td>
              <td style="padding: 12px; text-align: right; font-size: 14px; color: #333;">${formatCurrency(item.price)}</td>
              <td style="padding: 12px; text-align: right; font-size: 14px; color: #333;">${formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 40px;">
        <div style="width: 300px;">
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
            <span style="font-size: 14px; color: #444;">Subtotal:</span>
            <span style="font-size: 14px; color: #1a1a1a;">${formatCurrency(subtotal)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e4e4e7;">
            <span style="font-size: 14px; color: #444;">Shipping:</span>
            <span style="font-size: 14px; color: #1a1a1a;">${shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #1a1a1a;">
            <span style="font-size: 14px; color: #444;">Tax:</span>
            <span style="font-size: 14px; color: #1a1a1a;">${formatCurrency(tax)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 12px 0;">
            <span style="font-size: 18px; font-weight: bold; color: #2f5725;">Total:</span>
            <span style="font-size: 18px; font-weight: bold; color: #1a1a1a;">${formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 60px; padding-top: 20px; border-top: 1px solid #e4e4e7; text-align: center;">
        <p style="margin: 0 0 5px; font-size: 14px; font-weight: bold; color: #1a1a1a;">Thank you for your business!</p>
        <p style="margin: 0; font-size: 12px; color: #666;">Payment Method: <span style="text-transform: capitalize;">${order.paymentMethod || 'Credit Card'}</span></p>
        <p style="margin: 10px 0 0; font-size: 11px; color: #888;">
          Returns accepted within 30 days of purchase. Items must be unworn and in original condition.<br>
          For support, please contact contact@medaitllc.com
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait a brief moment to ensure any fonts/styles are applied
    await new Promise(resolve => setTimeout(resolve, 100));

    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate PDF dimensions (A4 format)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`AnfaStyles-Order-${order.orderNumber || 'Invoice'}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate invoice PDF');
  } finally {
    // Clean up the DOM
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
};
