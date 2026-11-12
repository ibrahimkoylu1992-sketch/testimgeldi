import React from 'react';
import { SUBSCRIPTION_PACKAGES } from '../lib/storage';
import {
  Camera,
  Printer,
  Sparkles,
  FileCheck,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Clock,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans">
      {/* Top Bar for Landing Page */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              tg
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              testimgeldi
            </span>
          </div>

          {/* Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Özellikler</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">Nasıl Çalışır?</a>
            <a href="#packages" className="hover:text-slate-900 transition-colors">Paketler & Fiyatlar</a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">SSS</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Giriş Yap
            </button>
            <button
              onClick={() => onOpenAuth('register')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              15 Gün Ücretsiz Başla
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Öğretmenler İçin Online Sınav & Optik Okuma Platformu
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Sınav Kağıtlarını <span className="text-indigo-600">Saniyeler İçinde</span> Otomatik Okuyun ve Puanlayın
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              Cevap anahtarınızı <span className="font-semibold text-slate-800">1-A, 2-B, 3-D</span> olarak girin,
              öğrencilerin optik formlarını telefon kamerası veya tarayıcı ile yükleyin. Sistem soru bazlı puanları,
              netleri ve ayrıntılı analizleri anında çıkarsın.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onOpenAuth('register')}
                className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Hemen 15 Gün Ücretsiz Dene</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onOpenAuth('login')}
                className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-all shadow-xs"
              >
                Mevcut Hesabına Giriş Yap
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                15 Gün Ücretsiz Deneme
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kredi Kartı İstemez
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Öğrenciler İçin Tamamen Ücretsiz
              </span>
            </div>
          </div>

          {/* Interactive Feature Preview Teaser */}
          <div className="mt-14 max-w-5xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Optik Form Basın</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  10, 20, 30, 50 veya 100 soruluk standart A4 optik kağıtları sınırsız basın. Tasarruflu mod ile 1 sayfaya 2 form sığdırın.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <Camera className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Fotoğrafları Yükleyin</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Öğrencilerin doldurduğu kağıtları kameradan canlı okutun veya toplu fotoğraf olarak tek seferde sisteme aktarın.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Anında Not & Karne Alın</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Soru bazlı başarı grafikleri, çeldirici analizleri, sınıf not çizelgesi ve tek tıkla öğrenci karneleri hazır.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section id="features" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
              Öğretmenlerin İhtiyacı Olan Her Şey Tek Bir Yerde
            </h2>
            <p className="text-sm text-slate-500">
              Pahalı optik okuma cihazlarına veya karmaşık yazılımlara son. Her cihazdan kolayca sınavınızı yönetin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <FileCheck className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Hızlı Cevap Anahtarı Girişi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cevapları <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">1-A, 2-B, 3-D</code> şeklinde doğrudan yapıştırın veya interaktif tuşlayın. Dilerseniz optik cevap anahtarını kameradan okutun.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Layers className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Soru Bazlı Özel Puanlama</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sınavınızı ister 100 üzerinden eşit bölün, ister her soruya özel puan (Örn: S1=10, S2=5) tanımlayın. 3 yanlış 1 doğru (LGS) ve 4 yanlış 1 doğru (YKS) desteği dahildir.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Camera className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Kamera & Toplu OMR Okuma</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Telefonunuzun veya bilgisayarınızın kamerasıyla tüm kağıtları seri bir şekilde okutun. Gemini AI Vision motoruyla silik veya hatalı işaretlemeleri bile doğru tanıyın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <BarChart3 className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Madde & Çeldirici Analizi</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hangi soruda öğrencilerin en çok zorlandığını, hangi şıkkın en güçlü çeldirici olduğunu detaylı yüzdeler ve dağılım grafikleriyle görün.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <GraduationCap className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Kişiye Özel Öğrenci Karneleri</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Her öğrenci için tek sayfalık yazdırılabilir veya PDF olarak kaydedilebilir sınav sonuç belgesi oluşturun. Velilere ve öğrencilere anında ulaştırın.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <Users className="w-8 h-8 text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900 text-base mb-2">Özel Branş & Sınıf Tanımlama</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kendi okulunuza ve dersinize göre özel sınıflar (8-A, 11-Sayısal, Mezun) ve özel branşlar ekleyin. Her öğretmen yalnızca istediği sınıf ve branşları görür.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING & PACKAGES */}
      <section id="packages" className="py-20 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2 block">
              Şeffaf ve Avantajlı Fiyatlandırma
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
              Kullanım Paketleri & Üyelik
            </h2>
            <p className="text-sm text-slate-600">
              Yeni kayıt olan her öğretmene <span className="font-semibold text-slate-900">15 gün ücretsiz</span> tam yetkili deneme hakkı tanımlanır. <strong className="text-indigo-600">Öğrenciler için sistem daima ücretsizdir! :)</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {SUBSCRIPTION_PACKAGES.map((pkg, idx) => (
              <div
                key={pkg.id}
                className={`bg-white rounded-2xl border p-8 flex flex-col justify-between transition-all ${
                  pkg.id === 'pack_premium_12m'
                    ? 'border-indigo-600 shadow-xl relative ring-2 ring-indigo-600/20'
                    : 'border-slate-200 shadow-sm hover:shadow-md'
                }`}
              >
                {pkg.badge && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                      pkg.id === 'pack_premium_12m'
                        ? 'bg-indigo-600'
                        : pkg.id === 'pack_student_free'
                        ? 'bg-emerald-600'
                        : 'bg-amber-600'
                    }`}
                  >
                    {pkg.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-900 text-lg">{pkg.name}</h3>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {pkg.id === 'pack_premium_12m' ? '12 Ay' : pkg.id === 'pack_trial_15d' ? '15 Gün' : 'Süresiz'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    {pkg.description}
                  </p>

                  <div className="mb-6 pb-6 border-b border-slate-100">
                    <span className="text-3xl font-extrabold text-slate-900 font-mono">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">
                      / {pkg.id === 'pack_premium_12m' ? 'yıl' : pkg.id === 'pack_trial_15d' ? '15 gün' : 'her zaman'}
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-600 mb-8">
                    {pkg.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => onOpenAuth(pkg.id === 'pack_student_free' ? 'login' : 'register')}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    pkg.id === 'pack_premium_12m'
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                      : pkg.id === 'pack_student_free'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  }`}
                >
                  {pkg.id === 'pack_student_free' ? 'Öğrenci Girişi Yap' : '15 Gün Ücretsiz Başla'}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center text-xs text-slate-500 max-w-lg mx-auto">
            15 günlük deneme süreniz bittiğinde sisteme giriş yaparak doğrudan Premium Paketi seçebilir ve panelden onay talep edebilirsiniz.
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
              Sıkça Sorulan Sorular
            </h2>
            <p className="text-xs text-slate-500">
              testimgeldi hakkında merak edilen her şey
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Kayıt olduğumda ücret ödemem gerekir mi?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Hayır. Yeni kayıt olan her öğretmen hiçbir kart bilgisi girmeden 15 gün boyunca sistemi tüm özellikleriyle sınırsız test edebilir. 15 gün sonra devam etmek isterseniz uygun paketi seçebilirsiniz.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Öğrenciler için sistem ücretli mi?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Öğrenci kaydı ve öğrenci karnesi sorgulama ömür boyu tamamen ücretsizdir. Öğrenciler kendi numaralarıyla girip sınav karnelerini görebilirler.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Optik formları nasıl yazdırabilirim?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistemimiz 10, 20, 30, 50 ve 100 soruluk standart A4 optik form şablonları üretir. İster tam sayfa ister 1 A4 kağıda 2 adet tasarruflu form olarak herhangi bir yazıcıdan doğrudan yazdırabilirsiniz.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/50">
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Optik okuma için özel bir tarayıcı makinesine ihtiyacım var mı?
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kesinlikle hayır! Cep telefonunuzun kamerası, web kamerası veya okulunuzdaki standart fotokopi tarayıcısı ile çekilen fotoğrafları sisteme yüklemeniz yeterlidir.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
              tg
            </div>
            <div>
              <span className="text-white font-bold text-sm block">testimgeldi</span>
              <span className="text-[11px] text-slate-500">Online Sınav & Optik Okuma Sistemi · testimgeldi.com</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => onOpenAuth('login')} className="hover:text-white transition-colors cursor-pointer">
              Öğretmen Girişi
            </button>
            <button onClick={() => onOpenAuth('register')} className="hover:text-white transition-colors cursor-pointer">
              15 Gün Ücretsiz Kayıt Ol
            </button>
            <span>·</span>
            <span className="text-slate-600">© 2026 testimgeldi.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
