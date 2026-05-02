

export const emailTemplates = {
  // Email Verification
  verification: (name: string, link: string) => ({
    subject: 'Verify Your KHUB Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B2EFF 0%, #7F33FF 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KHUB</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Hello ${name},</h2>
          <p>Thank you for registering with KHUB! Please verify your email address to get started.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
        </div>
      </div>
    `,
    text: `Verify your KHUB account: ${link}`
  }),

  // Password Reset
  passwordReset: (name: string, code: string) => ({
    subject: 'Reset Your KHUB Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B2EFF 0%, #7F33FF 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KHUB</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Hello ${name},</h2>
          <p>We received a request to reset your password. Use the code below:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>This code expires in 1 hour. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
    text: `Your password reset code is: ${code}`
  }),

  // Order Confirmation
  orderConfirmation: (orderNumber: string, items: any[], total: number) => ({
    subject: `Order Confirmation #${orderNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5B2EFF 0%, #7F33FF 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Order Confirmed!</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Order #${orderNumber}</h2>
          <p>Thank you for your purchase. Your order has been confirmed and is being processed.</p>
          <div style="margin: 20px 0;">
            <h3>Order Summary:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${items.map(item => `
                <tr>
                  <td style="padding: 10px 0;">${item.name} x ${item.quantity}</td>
                  <td style="padding: 10px 0; text-align: right;">₦${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid #e0e0e0;">
                <td style="padding: 10px 0; font-weight: bold;">Total</td>
                <td style="padding: 10px 0; text-align: right; font-weight: bold;">₦${total.toLocaleString()}</td>
              </tr>
            </table>
          </div>
          <p>You can track your order in your KHUB dashboard.</p>
        </div>
      </div>
    `,
    text: `Order #${orderNumber} confirmed. Total: ₦${total}`
  }),

  // Wallet Credit Notification
  walletCredit: (amount: number, balance: number) => ({
    subject: `Wallet Credited - ₦${amount.toLocaleString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Money Received!</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Wallet Update</h2>
          <div style="font-size: 48px; text-align: center; margin: 30px 0;">
            ₦${amount.toLocaleString()}
          </div>
          <p>Your wallet has been credited with ₦${amount.toLocaleString()}.</p>
          <p>New balance: <strong>₦${balance.toLocaleString()}</strong></p>
          <div style="margin-top: 30px;">
            <a href="https://khub.com.ng/wallet" style="background-color: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              View Wallet
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Your wallet has been credited with ₦${amount}. New balance: ₦${balance}`
  }),

  // KYC Status Update
  kycStatus: (name: string, status: 'approved' | 'rejected', reason?: string) => ({
    subject: `KYC Verification ${status === 'approved' ? 'Approved' : 'Update'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${status === 'approved' ? '#10B981' : '#EF4444'}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">KYC ${status === 'approved' ? 'Approved!' : 'Update'}</h1>
        </div>
        <div style="padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <h2>Hello ${name},</h2>
          ${status === 'approved' ? `
            <p>Congratulations! Your KYC verification has been approved.</p>
            <p>You can now:</p>
            <ul>
              <li>Withdraw funds from your wallet</li>
              <li>List products and services</li>
              <li>Access all platform features</li>
            </ul>
          ` : `
            <p>Unfortunately, your KYC verification was not approved.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p>Please submit a new KYC application with valid documents.</p>
          `}
          <div style="margin-top: 30px;">
            <a href="https://khub.com.ng/profile/kyc" style="background-color: #5B2EFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
              ${status === 'approved' ? 'Go to Dashboard' : 'Resubmit KYC'}
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Your KYC has been ${status}. ${reason ? `Reason: ${reason}` : ''}`
  })
}
