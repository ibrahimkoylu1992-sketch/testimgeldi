import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { X, Lock, Check, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ isOpen, onClose }) => {
  const { updatePassword, currentUser } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const needsInitialPassword = !currentUser?.passwordHash || currentUser?.hasPlatformPassword === false;

  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!needsInitialPassword && !currentPassword) {
      setErrorMsg('Lütfen mevcut şifrenizi giriniz.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Lütfen yeni şifrenizi giriniz.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifreler birbiriyle uyuşmuyor.');
      return;
    }

    setLoading(true);
    const res = await updatePassword(needsInitialPassword ? '' : currentPassword, newPassword);
    setLoading(false);

    if (res.success) {
      showToast(
        needsInitialPassword
          ? 'Platform şifreniz oluşturuldu. Artık hem Google ile hem de e-posta/kullanıcı adı + şifre ile giriş yapabilirsiniz.'
          : 'Şifreniz başarıyla güncellendi.',
        'success'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } else {
      setErrorMsg(res.error || 'Şifre güncellenemedi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {needsInitialPassword ? 'Platform Şifresi Belirle' : 'Şifremi Değiştir'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {currentUser?.username ? `@${currentUser.username} · ` : ''}
                {currentUser?.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} method="post" autoComplete="on" noValidate className="p-6 space-y-4">
          {/* Hidden username input helps Google/browser Password Manager associate the saved password */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={currentUser?.username || currentUser?.email || ''}
            readOnly
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          {needsInitialPassword && (
            <div className="p-3.5 rounded-lg bg-indigo-50/80 border border-indigo-200 text-indigo-900 text-xs leading-relaxed flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>
                Google hesabınızla giriş yaptınız. E-posta adresiniz veya kullanıcı adınız ve şifre ile de giriş yapabilmek için <strong>testimgeldi</strong> platformuna özel bir şifre belirleyebilirsiniz.
              </span>
            </div>
          )}

          {!needsInitialPassword && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mevcut Şifre</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="current-password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  aria-label={showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  title={showCurrentPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {needsInitialPassword ? 'Platform Şifreniz (En az 6 karakter)' : 'Yeni Şifre (En az 6 karakter)'}
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                title={showNewPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {needsInitialPassword ? 'Platform Şifresi Tekrar' : 'Yeni Şifre Tekrar'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full pl-3 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                title={showConfirmPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[38px]"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer min-h-[38px] disabled:opacity-60"
            >
              <Check className="w-3.5 h-3.5" />
              {loading
                ? 'Kaydediliyor...'
                : needsInitialPassword
                ? 'Platform Şifresini Kaydet'
                : 'Şifreyi Güncelle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
