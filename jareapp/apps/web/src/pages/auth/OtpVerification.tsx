import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../../utils/api';
import { useAuthStore } from '../../store/authStore';

export default function OtpVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { pendingPhone, setAuth } = useAuthStore();

  useEffect(() => {
    if (!pendingPhone) navigate('/auth/phone', { replace: true });
    inputRefs.current[0]?.focus();
  }, [pendingPhone, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  function handleDigit(index: number, val: string) {
    if (!/^\d?$/.test(val)) return;
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every((d) => d !== '')) verifyCode(newCode.join(''));
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setCode(digits);
      inputRefs.current[5]?.focus();
      verifyCode(pasted);
    }
  }

  async function verifyCode(otp: string) {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/verify-otp', { phone: pendingPhone, code: otp });
      if (data.data.isNewUser) {
        navigate('/auth/register');
      } else {
        setAuth(data.data.user, data.data.tokens.accessToken, data.data.tokens.refreshToken);
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.invalidOtp'));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (!canResend) return;
    try {
      await api.post('/auth/send-otp', { phone: pendingPhone });
      setCountdown(60);
      setCanResend(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.response?.data?.message || t('common.error'));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-light flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          <button onClick={() => navigate('/auth/phone')} className="flex items-center gap-1 text-text-muted hover:text-primary mb-4 transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">{t('common.back')}</span>
          </button>

          <h2 className="text-xl font-bold text-text-primary mb-1">{t('auth.otp')}</h2>
          <p className="text-text-muted text-sm mb-6">
            {t('auth.otpSent')} <span className="font-medium text-primary" dir="ltr">{pendingPhone}</span>
          </p>

          <div className="flex gap-2 justify-center mb-4" dir="ltr" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigit(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                  digit ? 'border-primary bg-primary/5' : 'border-border'
                } focus:border-primary`}
              />
            ))}
          </div>

          {error && (
            <p className="text-danger text-sm text-center mb-3">{error}</p>
          )}

          {loading && (
            <div className="flex justify-center mb-3">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          <div className="text-center">
            {canResend ? (
              <button onClick={resendOtp} className="flex items-center gap-1 text-primary text-sm font-medium mx-auto hover:underline">
                <RefreshCw size={14} />
                {t('auth.otpResend')}
              </button>
            ) : (
              <p className="text-text-muted text-sm">
                {t('auth.otpResendIn', { seconds: countdown })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
