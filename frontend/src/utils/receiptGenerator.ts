import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '@/lib/supabase'

interface ReceiptData {
  orderNumber: string
  date: string
  customerName: string
  customerEmail: string
  items: Array<{
    name: string
    quantity: number
    price: number
    total: number
  }>
  subtotal: number
  shipping: number
  discount: number
  total: number
  paymentMethod: string
  transactionId: string
  shippingAddress: any
}

export const generateReceiptPDF = async (orderId: string, orderNumber: string, items: any[], total: number, discount: number) => {
  const doc = new jsPDF()
  
  // Get order details
  const { data: order } = await supabase
    .from('orders')
    .select('*, buyer:profiles(*)')
    .eq('id', orderId)
    .single()

  // Header
  doc.setFillColor(91, 46, 255)
  doc.rect(0, 0, 210, 50, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.text('KHUB', 20, 25)
  doc.setFontSize(12)
  doc.text('E-Commerce Platform', 20, 35)
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(`Receipt #: ${orderNumber}`, 150, 20, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 28, { align: 'right' })
  doc.text(`Time: ${new Date().toLocaleTimeString()}`, 150, 36, { align: 'right' })

  // Customer Info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.text('BILL TO:', 20, 70)
  doc.setFontSize(10)
  doc.text(order?.buyer?.full_name || 'Customer', 20, 80)
  doc.text(order?.buyer?.email || '', 20, 88)
  doc.text(order?.shipping_address?.phone || '', 20, 96)
  
  // Order Info
  doc.text('ORDER INFO:', 150, 70)
  doc.text(`Status: ${order?.status?.toUpperCase()}`, 150, 80, { align: 'right' })
  doc.text(`Payment: ${order?.payment_status?.toUpperCase()}`, 150, 88, { align: 'right' })
  doc.text(`Method: ${order?.payment_method || 'Card'}`, 150, 96, { align: 'right' })

  // Items Table
  const tableData = items.map(item => [
    item.product.title,
    item.quantity.toString(),
    `₦${item.price.toLocaleString()}`,
    `₦{(item.price * item.quantity).toLocaleString()}`
  ])

  ;(doc as any).autoTable({
    startY: 110,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [91, 46, 255], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  })

  const finalY = (doc as any).lastAutoTable.finalY || 150

  // Totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = 1500

  doc.setFontSize(10)
  doc.text('Subtotal:', 130, finalY + 10, { align: 'right' })
  doc.text(`₦${subtotal.toLocaleString()}`, 190, finalY + 10, { align: 'right' })
  
  doc.text('Shipping:', 130, finalY + 18, { align: 'right' })
  doc.text(`₦${shipping.toLocaleString()}`, 190, finalY + 18, { align: 'right' })
  
  if (discount > 0) {
    doc.text('Discount:', 130, finalY + 26, { align: 'right' })
    doc.text(`-₦${discount.toLocaleString()}`, 190, finalY + 26, { align: 'right' })
  }
  
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL:', 130, finalY + 36, { align: 'right' })
  doc.text(`₦${total.toLocaleString()}`, 190, finalY + 36, { align: 'right' })

  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('Thank you for shopping with KHUB!', 105, 270, { align: 'center' })
  doc.text('For support, contact: support@khub.com.ng', 105, 278, { align: 'center' })

  // Save PDF
  doc.save(`KHUB-Receipt-${orderNumber}.pdf`)
  
  // Also store in database
  const pdfBlob = doc.output('blob')
  const fileName = `receipts/${orderNumber}.pdf`
  
  const { error } = await supabase.storage
    .from('documents')
    .upload(fileName, pdfBlob, {
      contentType: 'application/pdf',
      cacheControl: '3600'
    })
    
  if (!error) {
    // Update order with receipt URL
    const { data: publicUrl } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName)
      
    await supabase
      .from('orders')
      .update({ receipt_url: publicUrl.publicUrl })
      .eq('id', orderId)
  }
}

// HTML Receipt for email
export const generateHTMLReceipt = (data: ReceiptData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .receipt { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #5B2EFF; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f5f5f5; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>KHUB</h1>
          <p>Order Receipt</p>
        </div>
        
        <div class="content">
          <p><strong>Order #:</strong> ${data.orderNumber}</p>
          <p><strong>Date:</strong> ${data.date}</p>
          
          <h3>Order Summary</h3>
          <table>
            <thead>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${data.items.map(item => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>₦${item.price.toLocaleString()}</td>
                  <td>₦${item.total.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Subtotal: ₦${data.subtotal.toLocaleString()}</p>
            <p>Shipping: ₦${data.shipping.toLocaleString()}</p>
            ${data.discount > 0 ? `<p>Discount: -₦${data.discount.toLocaleString()}</p>` : ''}
            <p><strong>Total: ₦${data.total.toLocaleString()}</strong></p>
          </div>
          
          <h3>Payment Information</h3>
          <p>Method: ${data.paymentMethod}</p>
          <p>Transaction ID: ${data.transactionId}</p>
          
          <h3>Shipping Address</h3>
          <p>${data.shippingAddress.address_line1}<br>
          ${data.shippingAddress.city}, ${data.shippingAddress.state}<br>
          ${data.shippingAddress.country}</p>
        </div>
        
        <div class="footer">
          <p>Thank you for shopping with KHUB!</p>
          <p>Track your order: https://khub.com.ng/orders/${data.orderNumber}</p>
        </div>
      </div>
    </body>
    </html>
  `
}
