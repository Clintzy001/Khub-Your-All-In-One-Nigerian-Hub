import { supabase } from '../lib/supabase';

export interface EmailOTP {
  email: string;
  otp_code: string;
  purpose: 'verification' | 'password_reset' | 'login' | '2fa';
}

class EmailService {
  private static instance: EmailService;
  
  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendOTP(email: string, purpose: EmailOTP['purpose']): Promise<void> {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database
    const { error: dbError } = await supabase
      .from('email_otps')
      .insert({
        email,
        otp_code: otp,
        purpose,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      });
    
    if (dbError) throw dbError;
    
    // Send email via Supabase Edge Function
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        type: purpose,
        data: { otp_code: otp }
      }
    });
    
    if (emailError) throw emailError;
  }

  async verifyOTP(email: string, otp: string, purpose: EmailOTP['purpose']): Promise<boolean> {
    const { data, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otp)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) return false;
    
    // Mark OTP as used
    await supabase
      .from('email_otps')
      .update({ is_used: true })
      .eq('id', data.id);
    
    return true;
  }

  async resendOTP(email: string, purpose: EmailOTP['purpose']): Promise<void> {
    // Check last attempt
    const { data: lastOTP } = await supabase
      .from('email_otps')
      .select('created_at')
      .eq('email', email)
      .eq('purpose', purpose)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (lastOTP) {
      const timeSinceLast = Date.now() - new Date(lastOTP.created_at).getTime();
      if (timeSinceLast < 60 * 1000) {
        throw new Error('Please wait 60 seconds before requesting another OTP');
      }
    }
    
    await this.sendOTP(email, purpose);
  }
}

export const emailService = EmailService.getInstance();
