import React, { useState, useEffect } from 'react';
import { useAuth, PendingGoogleProfile } from '../context/AuthContext';
import { useToast } from './Toast';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  GraduationCap,
  Phone,
  ArrowLeft,
  RotateCw,
  Send,
  ShieldCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const {
    login,
    loginWithGoogle,
    completeGoogleRegistration,
    register,
    sendRegisterVerificationCode,
    verifyRegisterCode,
    requestPasswordReset,
    resetPasswordWithCode,
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'register-verify' | 'google-complete' | 'forgot' | 'reset-code'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'teacher' | 'student'>('teacher');
  const [school, setSchool] = useState('');
  const [branch, setBranch] = useState('Matematik');
  const [studentNumber, setStudentNumber] = useState('');
  const [gradeLevel, setGradeLevel] = useState('8-A');
  const [phone, setPhone] = useState('');

  // Pending Google user state (for selecting Teacher vs Student after Google sign-in)
  const [pendingGoogleUser, setPendingGoogleUser] = useState<PendingGoogleProfile | null>(null);
  const [googlePlatformPassword, setGooglePlatformPassword] = useState('');

  // Email verification state (for Registration)
  const [registerVerificationCode, setRegisterVerificationCode] = useState('');

  // Forgot password & reset code states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg('');
      setPendingGoogleUser(null);
      setGooglePlatformPassword('');
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // GOOGLE LOGIN / REGISTER
  const handleGoogleAuth = async (fromMode: 'login' | 'register') => {
    setErrorMsg('');
    setGoogleLoading(true);

    const res = await loginWithGoogle(
      fromMode === 'register'
        ? {
            roleForNewUser: selectedRole,
            name: name.trim() || undefined,
            school: school.trim() || undefined,
            branch: branch.trim() || undefined,
            studentNumber: studentNumber.trim() || undefined,
            gradeLevel: gradeLevel.trim() || undefined,
            phone: phone.trim() || undefined,
            platformPassword: password.trim().length >= 6 ? password.trim() : undefined,
          }
        : undefined
    );

    setGoogleLoading(false);

    if (res.success) {
      if (res.isNewUser) {
        showToast(
          selectedRole === 'teacher'
            ? 'Google hesabınızla kaydınız tamamlandı! 15 günlük ücretsiz deneme süreniz başladı.'
            : 'Google hesabınızla öğrenci kaydınız ücretsiz olarak tamamlandı!',
          'success'
        );
      } else {
        showToast('Google ile giriş başarılı. Hoş geldiniz!', 'success');
      }
      onClose();
      return;
    }

    if (res.needsRoleSelection && res.pendingGoogleUser) {
      setPendingGoogleUser(res.pendingGoogleUser);
      setName(res.pendingGoogleUser.name);
      setEmail(res.pendingGoogleUser.email);
      setGooglePlatformPassword('');
      setMode('google-complete');
      return;
    }

    if (res.error) {
      setErrorMsg(res.error);
    }
  };

  // COMPLETE GOOGLE REGISTRATION (STEP 2 WHEN NEW USER CLICKED FROM LOGIN)
  const handleCompleteGoogleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;
    setErrorMsg('');

    if (googlePlatformPassword.trim() && googlePlatformPassword.trim().length < 6) {
      setErrorMsg('Platform şifresi belirlemek istiyorsanız en az 6 karakter girmelisiniz.');
      return;
    }

    setLoading(true);
    const res = await completeGoogleRegistration(pendingGoogleUser, {
      role: selectedRole,
      name: name.trim() || pendingGoogleUser.name,
      school: school.trim() || undefined,
      branch: branch.trim() || undefined,
      studentNumber: studentNumber.trim() || undefined,
      gradeLevel: gradeLevel.trim() || undefined,
      phone: phone.trim() || undefined,
      platformPassword: googlePlatformPassword.trim() || undefined,
    });
    setLoading(false);

    if (res.success) {
      showToast(
        selectedRole === 'teacher'
          ? 'Google hesabınızla kaydınız oluşturuldu! 15 günlük ücretsiz deneme hesabınız açıldı.'
          : 'Google hesabınızla öğrenci kaydınız ücretsiz olarak açıldı!',
        'success'
      );
      onClose();
    } else {
      setErrorMsg(res.error || 'Kayıt tamamlanırken bir hata oluştu.');
    }
  };

  // LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      showToast('Giriş başarılı. Hoş geldiniz!', 'success');
      onClose();
    } else {
      setErrorMsg(res.error || 'Giriş yapılamadı.');
    }
  };

  // STEP 1 OF EMAIL REGISTER: SEND VERIFICATION CODE OR COMPLETE ON STATIC HOST
  const handleRegisterInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Lütfen adınızı ve soyadınızı giriniz.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    if (selectedRole === 'student' && !studentNumber.trim()) {
      setErrorMsg('Lütfen öğrenci numaranızı giriniz.');
      return;
    }

    setLoading(true);
    const res = await sendRegisterVerificationCode(email);

    if (!res.success) {
      setLoading(false);
      setErrorMsg(res.error || 'Kayıt işlemi başlatılamadı.');
      return;
    }

    // If real SMTP email was dispatched, proceed to 6-digit verification step
    if (res.delivered) {
      setLoading(false);
      setRegisterVerificationCode('');
      setMode('register-verify');
      showToast('Doğrulama kodu e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol ediniz.', 'info');
      return;
    }

    // Otherwise complete email registration seamlessly without trapping user on unsent code
    const completeRes = await register(
      name,
      email,
      password,
      selectedRole,
      school,
      branch,
      studentNumber,
      gradeLevel,
      phone
    );
    setLoading(false);

    if (completeRes.success) {
      showToast(
        selectedRole === 'teacher'
          ? 'Kaydınız tamamlandı! 15 günlük ücretsiz deneme hesabınız açıldı.'
          : 'Öğrenci hesabınız ücretsiz olarak açıldı!',
        'success'
      );
      onClose();
    } else {
      setErrorMsg(completeRes.error || 'Hesap oluşturulurken bir hata oluştu.');
    }
  };

  // STEP 2 OF REGISTER: VERIFY CODE & CREATE USER
  const handleRegisterVerifyAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!registerVerificationCode.trim() || registerVerificationCode.trim().length !== 6) {
      setErrorMsg('Lütfen e-postanıza gelen 6 haneli doğrulama kodunu eksiksiz giriniz.');
      return;
    }

    setLoading(true);
    const verifyRes = await verifyRegisterCode(email, registerVerificationCode);
    if (!verifyRes.success) {
      setLoading(false);
      setErrorMsg(verifyRes.error || 'Doğrulama kodu hatalı.');
      return;
    }

    const res = await register(
      name,
      email,
      password,
      selectedRole,
      school,
      branch,
      studentNumber,
      gradeLevel,
      phone
    );
    setLoading(false);

    if (res.success) {
      showToast(
        selectedRole === 'teacher'
          ? 'E-posta adresiniz doğrulandı! 15 günlük ücretsiz deneme hesabınız açıldı.'
          : 'E-posta adresiniz doğrulandı! Öğrenci hesabınız ücretsiz olarak açıldı.',
        'success'
      );
      onClose();
    } else {
      setErrorMsg(res.error || 'Hesap oluşturulurken bir hata oluştu.');
    }
  };

  // RESEND REGISTER CODE
  const handleResendRegisterCode = async () => {
    setErrorMsg('');
    setLoading(true);
    const res = await sendRegisterVerificationCode(email);
    setLoading(false);
    if (res.success && res.delivered) {
      showToast('Yeni doğrulama kodu e-posta adresinize tekrar gönderildi.', 'info');
    } else if (res.error) {
      setErrorMsg(res.error);
    } else {
      setErrorMsg('E-posta gönderim servisi şu anda aktif değil. Dilerseniz geri dönüp Google ile hızlı kayıt olabilirsiniz.');
    }
  };

  // STEP 1 OF FORGOT PASSWORD: SEND RESET CODE
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await requestPasswordReset(email);
    setLoading(false);

    if (!res.success) {
      setErrorMsg(res.error || 'Sıfırlama talebi oluşturulamadı.');
      return;
    }

    if (res.delivered) {
      setResetCode('');
      setMode('reset-code');
      showToast('Şifre sıfırlama kodu e-posta adresinize gönderildi.', 'info');
    } else {
      setErrorMsg(
        'Otomatik sıfırlama e-postası şu anda sunucuda yapılandırılmamıştır. Gmail/Google hesabınızla "Google ile Devam Et" butonunu kullanarak doğrudan giriş yapıp şifrenizi yenileyebilirsiniz.'
      );
    }
  };

  // STEP 2 OF FORGOT PASSWORD: VERIFY CODE & CHANGE PASSWORD
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (resetCode.trim().length !== 6) {
      setErrorMsg('Lütfen e-postanıza gelen 6 haneli doğrulama kodunu giriniz.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithCode(email, resetCode, newPassword);
    setLoading(false);

    if (res.success) {
      showToast('Şifreniz başarıyla güncellendi! Giriş yapıldı.', 'success');
      onClose();
    } else {
      setErrorMsg(res.error || 'Şifre sıfırlanamadı.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              tg
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                {mode === 'login' && 'Giriş Yap'}
                {mode === 'register' && 'Ücretsiz Kayıt Ol'}
                {mode === 'register-verify' && 'E-Posta Doğrulama'}
                {mode === 'google-complete' && 'Google Hesabını Tamamla'}
                {mode === 'forgot' && 'Şifremi Unuttum'}
                {mode === 'reset-code' && 'Yeni Şifre Belirle'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'register-verify'
                  ? 'Gelen kutunuzdaki kodu girerek onaylayın'
                  : mode === 'google-complete'
                  ? 'Hesap türünüzü seçerek hemen başlayın'
                  : 'testimgeldi Online Sınav & Optik Okuma'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <span className="font-bold shrink-0">Hata:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => handleGoogleAuth('login')}
                disabled={googleLoading || loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>{googleLoading ? 'Google Bağlanıyor...' : 'Google ile Devam Et'}</span>
              </button>

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
                  veya e-posta & şifre ile
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Posta Adresi
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@okul.k12.tr"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Şifre</label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setErrorMsg('');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                    >
                      Şifremi unuttum?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                >
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-100">
                  Hesabınız yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg('');
                    }}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Ücretsiz Kayıt Olun
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. REGISTER FORM (GOOGLE OR EMAIL) */}
          {mode === 'register' && (
            <div className="space-y-3.5">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hesap Türü Seçin
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                      selectedRole === 'teacher'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Öğretmen (15 Gün Free)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                      selectedRole === 'student'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Öğrenci (Ücretsiz)</span>
                  </button>
                </div>
              </div>

              {/* Quick Google Registration */}
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleGoogleAuth('register')}
                  disabled={googleLoading || loading}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg border border-slate-300 shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                >
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                  <span>
                    {googleLoading
                      ? 'Google Bağlanıyor...'
                      : selectedRole === 'teacher'
                      ? 'Google ile Öğretmen Kaydı Ol'
                      : 'Google ile Öğrenci Kaydı Ol'}
                  </span>
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  Google mailinizle anında kayıt olun; isterseniz daha sonra platforma özel şifre belirleyebilirsiniz.
                </p>
              </div>

              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-slate-200" />
                <span className="shrink mx-3 text-[11px] font-medium text-slate-400">
                  veya form ile kayıt olun
                </span>
                <div className="flex-grow border-t border-slate-200" />
              </div>

              <form onSubmit={handleRegisterInitiate} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Soyad *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={selectedRole === 'teacher' ? 'Örn: Selin Öğretmen' : 'Örn: Ahmet Yılmaz'}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-Posta Adresi *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@okul.k12.tr"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Role specific inputs */}
                {selectedRole === 'teacher' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Okul Adı</label>
                        <input
                          type="text"
                          value={school}
                          onChange={(e) => setSchool(e.target.value)}
                          placeholder="Örn: Merkez Ortaokulu"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Branş</label>
                        <input
                          type="text"
                          value={branch}
                          onChange={(e) => setBranch(e.target.value)}
                          placeholder="Örn: Matematik"
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Telefon Numarası (Opsiyonel)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0555 123 4567"
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Öğrenci Numarası *
                      </label>
                      <input
                        type="text"
                        required
                        value={studentNumber}
                        onChange={(e) => setStudentNumber(e.target.value)}
                        placeholder="Örn: 1042"
                        className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Okul / Sınıf
                      </label>
                      <input
                        type="text"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        placeholder="Örn: 8-A"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Şifre Belirleyin (En az 6 karakter) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-60"
                >
                  {loading ? (
                    'Kayıt İşlemi Yapılıyor...'
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kayıt Ol</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Zaten bir hesabınız var mı?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-indigo-600 font-semibold hover:underline cursor-pointer"
                  >
                    Giriş Yapın
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2B. GOOGLE REGISTRATION ROLE COMPLETION */}
          {mode === 'google-complete' && pendingGoogleUser && (
            <form onSubmit={handleCompleteGoogleSignup} className="space-y-3.5">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center gap-3">
                {pendingGoogleUser.avatarUrl ? (
                  <img
                    src={pendingGoogleUser.avatarUrl}
                    alt={pendingGoogleUser.name}
                    className="w-10 h-10 rounded-full border border-indigo-200 object-cover shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {pendingGoogleUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{pendingGoogleUser.name}</div>
                  <div className="text-[11px] text-indigo-700 truncate">{pendingGoogleUser.email}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hesap Türü Seçin *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('teacher')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                      selectedRole === 'teacher'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>Öğretmen (15 Gün Free)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRole('student')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[44px] ${
                      selectedRole === 'student'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>Öğrenci (Ücretsiz)</span>
                  </button>
                </div>
              </div>

              {selectedRole === 'teacher' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Okul Adı (Opsiyonel)</label>
                    <input
                      type="text"
                      value={school}
                      onChange={(e) => setSchool(e.target.value)}
                      placeholder="Örn: Merkez Ortaokulu"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Branş</label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="Örn: Matematik"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Öğrenci No</label>
                    <input
                      type="text"
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(e.target.value)}
                      placeholder="Örn: 1042"
                      className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Sınıf</label>
                    <input
                      type="text"
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      placeholder="Örn: 8-A"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platforma Özel Şifre (İsteğe Bağlı)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={googlePlatformPassword}
                    onChange={(e) => setGooglePlatformPassword(e.target.value)}
                    placeholder="İsterseniz şimdi belirleyin (min 6 krk)"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Boş bırakırsanız dilediğiniz zaman profilinizdeki <strong>Platform Şifresi Belirle</strong> menüsünden oluşturabilirsiniz.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Hesap Oluşturuluyor...' : 'Hesabı Tamamla ve Başla'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPendingGoogleUser(null);
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Giriş Ekranına Dön</span>
                </button>
              </div>
            </form>
          )}

          {/* 3. REGISTER VERIFICATION CODE (WHEN REAL SMTP SENT CODE) */}
          {mode === 'register-verify' && (
            <form onSubmit={handleRegisterVerifyAndComplete} className="space-y-4">
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>E-Postanızı Kontrol Ediniz</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  6 haneli aktivasyon kodu <strong className="text-indigo-900">{email}</strong> adresinize gönderildi. Lütfen gelen kutunuzu (ve spam/gereksiz klasörünü) kontrol edip kodu giriniz.
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Kod 15 dakika boyunca geçerlidir.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  E-Postanıza Gelen 6 Haneli Doğrulama Kodu *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={registerVerificationCode}
                    onChange={(e) => setRegisterVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2.5 text-base font-mono tracking-widest text-center sm:text-left border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>E-posta ulaşmadı mı?</span>
                <button
                  type="button"
                  onClick={handleResendRegisterCode}
                  disabled={loading}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  <span>Tekrar Gönder</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  'Hesap Doğrulanıyor...'
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hesabı Doğrula ve Başla</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg('');
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Geri Dön ve Bilgileri Düzenle</span>
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD (STEP 1: ENTER EMAIL) */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Kayıtlı e-posta adresinizi giriniz. Sistemimiz şifre sıfırlama doğrulama kodunuzu
                e-postanıza gönderecektir.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kayıtlı E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@okul.k12.tr"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Kod Gönderiliyor...' : 'Doğrulama Kodu Gönder'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                  }}
                  className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Giriş Ekranına Dön</span>
                </button>
              </div>
            </form>
          )}

          {/* 5. RESET CODE & NEW PASSWORD (STEP 2 OF FORGOT PASSWORD) */}
          {mode === 'reset-code' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Sıfırlama Kodu E-Postanıza Gönderildi</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Şifre sıfırlama kodunuz <strong className="text-indigo-900">{email}</strong> adresine gönderildi. Lütfen e-postanızı kontrol edip gelen kodu ve yeni şifrenizi giriniz.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-Postanıza Gelen 6 Haneli Doğrulama Kodu *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Şifreniz (En az 6 karakter) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Yeni şifrenizi giriniz"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Şifre Tekrar *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Yeni şifreyi onaylayın"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg min-h-[44px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {loading ? 'Şifre Güncelleniyor...' : 'Şifreyi Değiştir ve Giriş Yap'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg('');
                  }}
                  className="text-slate-600 hover:text-slate-900 font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Tekrar Kod İste</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
