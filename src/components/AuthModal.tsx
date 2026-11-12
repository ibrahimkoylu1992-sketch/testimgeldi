import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
import { INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, StorageService } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const {
    login,
    register,
    sendRegisterVerificationCode,
    verifyRegisterCode,
    requestPasswordReset,
    resetPasswordWithCode,
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register' | 'register-verify' | 'forgot' | 'reset-code'>(initialMode);
  const [loading, setLoading] = useState(false);
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

  // Email verification state (for Registration)
  const [registerVerificationCode, setRegisterVerificationCode] = useState('');

  // Forgot password & reset code states
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

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

  // STEP 1 OF REGISTER: SEND VERIFICATION CODE
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
    setLoading(false);

    if (res.success) {
      setRegisterVerificationCode('');
      setMode('register-verify');
      showToast('Doğrulama kodu e-postanıza gönderildi. Lütfen gelen kutunuzu kontrol ediniz.', 'info');
    } else {
      setErrorMsg(res.error || 'Doğrulama kodu gönderilemedi.');
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

    // Code verified! Now create account
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
    if (res.success) {
      showToast('Yeni doğrulama kodu e-posta adresinize tekrar gönderildi.', 'info');
    } else {
      setErrorMsg(res.error || 'Kod yeniden gönderilemedi.');
    }
  };

  // STEP 1 OF FORGOT PASSWORD: SEND RESET CODE
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await requestPasswordReset(email);
    setLoading(false);

    if (res.success) {
      setResetCode('');
      setMode('reset-code');
      showToast('Şifre sıfırlama kodu e-posta adresinize gönderildi.', 'info');
    } else {
      setErrorMsg(res.error || 'Sıfırlama talebi oluşturulamadı.');
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

  // Quick Credentials Fillers
  const fillSuperAdmin = () => {
    setEmail(INITIAL_ADMIN_EMAIL);
    setPassword(INITIAL_ADMIN_PASSWORD);
    setErrorMsg('');
  };

  const fillTeacher = () => {
    setEmail('ayse.ogretmen@testimgeldi.com');
    setPassword('123456');
    setErrorMsg('');
  };

  const fillExpiredTeacher = () => {
    setEmail('mehmet.hoca@testimgeldi.com');
    setPassword('123456');
    setErrorMsg('');
  };

  const fillStudent = () => {
    setEmail('elif.ogrenci@testimgeldi.com');
    setPassword('123456');
    setErrorMsg('');
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
                {mode === 'forgot' && 'Şifremi Unuttum'}
                {mode === 'reset-code' && 'Yeni Şifre Belirle'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'register-verify'
                  ? 'Gelen kutunuzdaki kodu girerek onaylayın'
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

          {/* Quick Test Profiles for Reviewers */}
          {mode === 'login' && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
              <div className="text-slate-600 mb-2 font-medium flex items-center justify-between">
                <span>Hızlı Rol Test Girişleri:</span>
                <span className="text-[10px] text-slate-400">Şifre: 123456</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={fillSuperAdmin}
                  className="px-2 py-2 bg-amber-50 border border-amber-300 rounded text-amber-900 hover:bg-amber-100 font-bold text-[11px] text-left truncate min-h-[36px]"
                >
                  👑 SuperAdmin (Yönetici)
                </button>
                <button
                  type="button"
                  onClick={fillTeacher}
                  className="px-2 py-2 bg-white border border-slate-300 rounded text-indigo-700 hover:bg-indigo-50 font-medium text-[11px] text-left truncate min-h-[36px]"
                >
                  👩‍🏫 Öğretmen (15 Gün Aktif)
                </button>
                <button
                  type="button"
                  onClick={fillExpiredTeacher}
                  className="px-2 py-2 bg-rose-50 border border-rose-200 rounded text-rose-700 hover:bg-rose-100 font-medium text-[11px] text-left truncate min-h-[36px]"
                >
                  ⏳ Süresi Dolan (Paket Seç)
                </button>
                <button
                  type="button"
                  onClick={fillStudent}
                  className="px-2 py-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 hover:bg-emerald-100 font-medium text-[11px] text-left truncate min-h-[36px]"
                >
                  🎓 Öğrenci (Ücretsiz)
                </button>
              </div>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-2"
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
          )}

          {/* 2. REGISTER FORM (STEP 1: FILL INFO & REQUEST CODE) */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterInitiate} className="space-y-3.5">
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
                  E-Posta Adresi (Doğrulama Gönderilecek) *
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
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                {loading ? (
                  'E-Posta Gönderiliyor...'
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Doğrulama Kodu Gönder</span>
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
          )}

          {/* 3. REGISTER VERIFICATION CODE (STEP 2: ENTER CODE FROM EMAIL) */}
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

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>E-posta ulaşmadı mı?</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const latest = StorageService.getLatestEmailVerificationCode(email, 'register');
                        if (latest) {
                          setRegisterVerificationCode(latest);
                          showToast('Doğrulama kodu alana aktarıldı.', 'info');
                        }
                      }}
                      className="text-slate-400 hover:text-slate-600 text-[11px] underline cursor-pointer"
                    >
                      (Test Kodu)
                    </button>
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
                </div>
                <p className="text-[10px] text-slate-400">
                  💡 Not: Gerçek Gmail gelen kutunuza anında düşmesi için Yönetici Paneli &gt; E-Posta &amp; SMTP Ayarları sekmesinden Gmail veya SMTP bilgilerinizi tanımlayabilirsiniz.
                </p>
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
                anında e-postanıza gönderecektir.
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

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
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
                <button
                  type="button"
                  onClick={() => {
                    const latest = StorageService.getLatestEmailVerificationCode(email, 'forgot_password');
                    if (latest) {
                      setResetCode(latest);
                      showToast('Sıfırlama kodu aktarıldı.', 'info');
                    }
                  }}
                  className="text-slate-400 hover:text-slate-600 text-[11px] underline cursor-pointer"
                >
                  (Test Kodu)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
