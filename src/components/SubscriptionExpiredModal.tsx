import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUBSCRIPTION_PACKAGES, StorageService } from '../lib/storage';
import { useToast } from './Toast';
import {
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Send,
  Sparkles,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const SubscriptionExpiredModal: React.FC<SubscriptionExpiredModalProps> = ({
  isOpen,
  onClose,
  canDismiss = false,
}) => {
  const { currentUser, submitSubscriptionRequest, remainingDays, isSubscriptionActive } = useAuth();
  const { showToast } = useToast();

  const [selectedPkgId, setSelectedPkgId] = useState<string>('pack_premium_12m');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  if (!isOpen || !currentUser) return null;

  const handleSubmitRequest = async (pkgId: string) => {
    setSubmitting(true);
    const res = await submitSubscriptionRequest(pkgId, phone);
    setSubmitting(false);

    if (res.success) {
      setHasSubmitted(true);
      showToast('Abonelik talebiniz site yöneticisine iletildi!', 'success');
    } else {
      showToast('Talep iletilemedi, lütfen tekrar deneyin.', 'error');
    }
  };

  const isExpired = !isSubscriptionActive;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">
                  {isExpired ? '15 Günlük Deneme Süreniz Sona Erdi' : `Deneme Süreniz: ${remainingDays} Gün Kaldı`}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                  {currentUser.subscriptionStatus === 'trial' ? '15 Günlük Deneme' : 'Süresi Doldu'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sayın {currentUser.name}, testimgeldi özelliklerini kesintisiz kullanmaya devam etmek için paket seçebilirsiniz.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
              title="Kapat ve Geçmişi İncele"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-8 max-h-[75vh] overflow-y-auto">
          {hasSubmitted ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-emerald-950 text-lg">
                Paket Talebiniz Başarıyla Site Yöneticisine İletildi!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                Yöneticimiz ({StorageService.getUsers().find(u => u.role === 'superadmin')?.email || 'info@testimgeldi.com'}) talebinizi inceleyip onayladığında süreniz anında uzatılacaktır.
              </p>
              <div className="pt-2">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg cursor-pointer shadow-sm transition-colors"
                  >
                    Panele Devam Et (Geçmiş Sınavları & Sonuçları İncele)
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* 3 Packages */}
              <div>
                <div className="text-center mb-6">
                  <h4 className="text-base font-bold text-slate-900">
                    Size Uygun Kullanım Paketini Seçin
                  </h4>
                  <p className="text-xs text-slate-500">
                    Seçiminizi yaptıktan sonra doğrudan yöneticiye onay talebi gönderebilirsiniz.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {SUBSCRIPTION_PACKAGES.map((pkg, idx) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`rounded-xl border p-5 flex flex-col justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/20 ring-2 ring-indigo-600/20 shadow-md'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 text-sm">{pkg.name}</span>
                            {pkg.badge && (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                                {pkg.badge}
                              </span>
                            )}
                          </div>

                          <div className="mb-3">
                            <span className="text-2xl font-black text-slate-900 font-mono">
                              {pkg.price}
                            </span>
                            <span className="text-[11px] text-slate-500 ml-1">
                              / {pkg.id === 'pack_premium_12m' ? '12 Ay (1 Yıl)' : pkg.id === 'pack_trial_15d' ? '15 Günlük' : 'Süresiz'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                            {pkg.description}
                          </p>

                          <ul className="space-y-1.5 text-[11px] text-slate-600 mb-6">
                            {pkg.features.slice(0, 4).map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {pkg.id === 'pack_student_free' ? (
                          <div className="w-full py-2 px-3 rounded-lg text-xs font-bold text-center bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Öğrenciler İçin Daima Ücretsiz :)
                          </div>
                        ) : pkg.id === 'pack_trial_15d' ? (
                          <div className="w-full py-2 px-3 rounded-lg text-xs font-bold text-center bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Yeni Kayıtta Otomatik Tanımlanır
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPkgId(pkg.id);
                              handleSubmitRequest(pkg.id);
                            }}
                            disabled={submitting}
                            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                            }`}
                          >
                            {isSelected ? '✓ Premium Paketi Seç & Talep Gönder' : 'Premium Paketi Seç'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Direct Contact with Site Administration */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">
                    Hızlı Onay ve İletişim Hattı
                  </span>
                  <p className="text-slate-500 text-[11px]">
                    Site Yöneticisi ile doğrudan iletişime geçerek anında hesabınızı aktif ettirebilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href="mailto:info@testimgeldi.com?subject=testimgeldi%20Paket%20Onay%20Talebi"
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    <span>info@testimgeldi.com</span>
                  </a>

                  <a
                    href="https://wa.me/905551234567"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Destek</span>
                  </a>
                </div>
              </div>

              {/* Informative Note & Close Button */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    Deneme süreniz dolmuş olsa bile <strong>geçmiş sınavlarınızı, optik sonuçları ve karneleri</strong> inceleyebilirsiniz.
                  </span>
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Kapat & Geçmişi İncele
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
