import React, { useState, useEffect } from 'react';
import { emailService } from '../../services/emailService';
import { Mail, Check, AlertCircle } from 'lucide-react';

interface EmailVerificationProps {
  email: string;
  onVerified: () => void;
  purpose: 'verification' | 'password_reset' | 'login';
}

export default function EmailVerification({ email, onVerified, purpose }: EmailVerificationProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(true);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const isValid = await emailService.verifyOTP(email, otp, purpose);
      if (isValid) {
        onVerified();
      } else {
        setError('Invalid or expired OTP. Please try again.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    try {
      await emailService.resendOTP(email, purpose);
      setTimeLeft(60);
      setCanResend(false);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-slide-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
          <p className="text-gray-600">
            We've sent a verification code to <strong>{email}</strong>
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input-field text-center text-2xl tracking-widest"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-xl">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? 'Verifying...' : (
              <>
                <Check className="w-5 h-5" />
                Verify Email
              </>
            )}
          </button>

          <div className="text-center">
            <button
              onClick={handleResend}
              disabled={!canResend || loading}
              className="text-primary text-sm hover:underline disabled:opacity-50"
            >
              {canResend ? 'Resend Code' : `Resend in ${timeLeft}s`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
