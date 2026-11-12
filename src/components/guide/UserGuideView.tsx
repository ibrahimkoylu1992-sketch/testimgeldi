import React, { useState } from 'react';
import {
  BookOpen,
  Shield,
  GraduationCap,
  Users,
  Camera,
  Printer,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  FileText,
  Mail,
  Key,
  Smartphone,
  Crop,
  Layers,
  Award,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Send,
  Check,
  Share2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface UserGuideViewProps {
  onNavigateToView?: (view: string) => void;
  onOpenCreateExam?: () => void;
  onOpenSupportTicket?: () => void;
}

export const UserGuideView: React.FC<UserGuideViewProps> = ({
  onNavigateToView,
  onOpenCreateExam,
  onOpenSupportTicket,
}) => {
  const { currentUser, isSuperAdmin, isAdmin, isTeacher } = useAuth();

  // Enforce role-based tab availability: teachers must never see superadmin or school admin guides
  const canSeeSuperAdminGuide = Boolean(isSuperAdmin);
  const canSeeAdminGuide = Boolean(isAdmin || isSuperAdmin);

  // Active role tab
  const [activeRole, setActiveRole] = useState<'teacher' | 'superadmin' | 'admin' | 'student'>(
    canSeeSuperAdminGuide ? 'superadmin' : canSeeAdminGuide ? 'admin' : 'teacher'
  );

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            testimgeldi Uygulamalı Kullanım Kılavuzu & Adım Adım Rehber
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            testimgeldi Nasıl Kullanılır? (Adım Adım Rehber)
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
            Sınav tanımlamadan PDF kırpmaya, panodan (Ctrl+V) soru yapıştırmadan telefonla canlı optik okumaya ve karne paylaşımına kadar tüm işlemlerin pratik adımları.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {onNavigateToView && (
              <>
                <button
                  onClick={() => onNavigateToView('quiz-builder')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Crop className="w-4 h-4" />
                  Test & Quiz Hazırlayıcıya Git
                </button>
                <button
                  onClick={() => onNavigateToView('exams')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Sınav Listesine Dön
                </button>
              </>
            )}
            {onOpenSupportTicket && (
              <button
                onClick={onOpenSupportTicket}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                Sorun / İstek Bildir
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs (Strictly Protected by Role) */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl overflow-x-auto border border-slate-200">
        <button
          onClick={() => setActiveRole('teacher')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeRole === 'teacher'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-indigo-600" />
          <span>👨‍🏫 Öğretmen Rehberi</span>
        </button>

        {/* SuperAdmin guide is STRICTLY hidden from teachers and school admins */}
        {canSeeSuperAdminGuide && (
          <button
            onClick={() => setActiveRole('superadmin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeRole === 'superadmin'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4 text-amber-600" />
            <span>👑 Süper Admin Rehberi (Özel)</span>
          </button>
        )}

        {/* School Admin guide is only visible to school admins and superadmins */}
        {canSeeAdminGuide && (
          <button
            onClick={() => setActiveRole('admin')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeRole === 'admin'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-600" />
            <span>🛡️ Okul Yöneticisi Rehberi</span>
          </button>
        )}

        <button
          onClick={() => setActiveRole('student')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeRole === 'student'
              ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-600" />
          <span>🎓 Öğrenci & Veli Rehberi</span>
        </button>
      </div>

      {/* ROLE 1: TEACHER STEP-BY-STEP WORKFLOW GUIDE */}
      {activeRole === 'teacher' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Öğretmenler İçin Adım Adım Kullanım Rehberi</h2>
                <p className="text-xs text-slate-500">
                  Sınav hazırlama, optik okuma, soru kırpma ve karne süreçlerini aşağıdaki somut adımlarla dakikalar içinde tamamlayın.
                </p>
              </div>
            </div>

            {/* Step 1: Sınav Oluşturma */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-indigo-900 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                  1
                </span>
                <h3>Adım 1: Yeni Bir Sınav Nasıl Tanımlanır?</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Öğrencilerinize uygulayacağınız tarama veya yazılı sınavı optik sisteme kaydetmek için:
              </p>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-5">
                <li>Üst menüdeki <strong>"Yeni Sınav"</strong> butonuna tıklayın.</li>
                <li><strong>Sınav Türünü Belirleyin:</strong> Tek ders sınavı (Örn: 8. Sınıf Matematik 1. Yazılı) veya LGS/YKS formatında <strong>"Çoklu Ders (Birleşik Deneme)"</strong> seçin.</li>
                <li><strong>Okul ve Şube Seçin:</strong> Listenizde olmayan bir okul veya şube varsa, hemen yanındaki <strong>"+ Ekle"</strong> butonuna yazıp ekleyin; sayfa yenilemenize gerek kalmadan listeye eklenir.</li>
                <li><strong>Soru Sayısı ve Şık Sayısını Belirleyin:</strong> 20, 40, 90 veya 100 soru; A-D (4 seçenek) veya A-E (5 seçenek).</li>
                <li><strong>Cevap Anahtarını Girin:</strong> A, B, C, D harflerine tıklayarak veya tek tuşla hızlı doldurma araçlarıyla doğru yanıtları kaydedin.</li>
              </ol>
            </div>

            {/* Step 2: Test & Quiz Hazırlama Modülü */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                  2
                </span>
                <h3>Adım 2: Test & Quiz Kağıdı Nasıl Hazırlanır? (PDF Kırpma & Win+Shift+S)</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                MEB formatında iki sütunlu, antetli ve soru bölücülü profesyonel bir A4 sınav kağıdı hazırlamak için <strong>"Test & Quiz Hazırla"</strong> menüsüne girin. 3 farklı yöntemden dilediğinizi kullanabilirsiniz:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="font-bold text-indigo-700 text-xs flex items-center gap-1.5">
                    <Crop className="w-4 h-4" />
                    <span>A) PDF Yükleyip Kırpma</span>
                  </div>
                  <ol className="text-[11px] text-slate-600 space-y-1 list-decimal pl-4">
                    <li><strong>"PDF'den Soru Kırp"</strong> butonuna basın.</li>
                    <li>PDF veya görsel dosyanızı seçin.</li>
                    <li>Farenizle sorunun etrafını kutu içine alın veya <em>Sol Üst / Sağ Üst</em> hızlı şablonlarına tıklayın.</li>
                    <li>Doğru cevabı (A-E) ve puanını seçip <strong>"Bu Soruyu Ekle"</strong>ye basın.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
                  <div className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>B) En Kolay: Panodan Yapıştır (Ctrl+V)</span>
                  </div>
                  <ol className="text-[11px] text-slate-700 space-y-1 list-decimal pl-4">
                    <li>Klavyenizden <kbd className="px-1 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-mono">Win + Shift + S</kbd> tuşlarına basın.</li>
                    <li>Ekrandaki herhangi bir sorunun fotoğrafını çekin.</li>
                    <li>Test ekranında doğrudan <kbd className="px-1 py-0.5 bg-white border border-amber-300 rounded text-[10px] font-mono">Ctrl + V</kbd> yapın!</li>
                    <li>Görsel anında aktarılır; PDF yükleme beklemenize hiç gerek kalmaz.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>C) Örnek Soru Bankasından Ekleme</span>
                  </div>
                  <ol className="text-[11px] text-slate-700 space-y-1 list-decimal pl-4">
                    <li>Sarı renkli <strong>"Soru Bankası"</strong> butonuna basın.</li>
                    <li>Dersinizi (Matematik, Fen, Türkçe vb.) ve konuyu seçin.</li>
                    <li>Kazanım odaklı hazır MEB/LGS sorularını inceleyin.</li>
                    <li><strong>"Teste Ekle"</strong> butonuna basarak anında kağıdınıza yerleştirin.</li>
                  </ol>
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700">
                <strong>Çok Sayfalı A4 Düzeni:</strong> Sayfaya soru ekledikçe A4 sınırını aşan sorular otomatik olarak <strong>Sayfa 2, Sayfa 3</strong> sekmelerine aktarılır. "Yazdır / PDF Kaydet" butonuna bastığınızda tarayıcınız tüm sayfaları tek bir PDF dokümanı olarak kusursuzca yazdırır.
              </div>
            </div>

            {/* Step 3: Cevap Anahtarı ve Optik Sınava Aktarma */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                  3
                </span>
                <h3>Adım 3: "🔑 Cevap Anahtarı" Butonu Ne İşe Yarar ve Nasıl Kullanılır?</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Test hazırlayıcı üst barındaki <strong>"Cevap Anahtarı"</strong> butonu; hazırladığınız sınavın zümre öğretmenleri ve öğrenci panosu için <strong>Öğretmen Cevap Anahtarı & Kazanım Çizelgesi</strong> sayfasını açıp kapatır:
              </p>
              <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                <li><strong>Cevap Anahtarı Açıkken:</strong> Her sorunun doğru şıkkı (A-E), puanı ve konusu tablolaştırılır ve A4 sınav kağıdının sonuna ek bir sayfa olarak eklenir.</li>
                <li><strong>Öğrencilere Dağıtırken:</strong> Cevap Anahtarı butonunu kapatıp sadece öğrenci soru kitapçığını yazdırabilirsiniz.</li>
                <li><strong>Tek Tıkla Optik Sınava Dönüştür:</strong> Test kağıdınız bittiğinde <strong>"Optik Sınava Dönüştür"</strong> butonuna basarak testi doğrudan sınav listenize aktarabilir ve hemen telefon kamerasıyla okutabilirsiniz.</li>
              </ul>
            </div>

            {/* Step 4: Telefon Kamerasıyla Canlı Optik Okuma */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-emerald-950 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center">
                  4
                </span>
                <h3>Adım 4: Telefon Kamerasıyla Optik Kağıt Nasıl Okutulur? (Kritik İpuçları)</h3>
              </div>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-5">
                <li>Sınav detay sayfasına girip yeşil renkli <strong>"Optik Kağıt Oku"</strong> butonuna tıklayın.</li>
                <li><strong>Kağıdı Düz Bir Zemine Koyun:</strong> Masanın üzerinde gölge oluşturmayacak şekilde ortam ışığının yeterli olduğundan emin olun.</li>
                <li><strong>90 Derece Dik Tutun:</strong> Telefonunuzu kağıdın tam üzerine, eğmeden dik açıyla tutun.</li>
                <li><strong>4 Köşe İşaretini Çerçeveye Denk Getirin:</strong> Optik formun köşelerindeki siyah kareler ekrandaki yeşil kılavuz kutularıyla eşleştiğinde sistem "Cevaplar Okundu!" uyarısı verir.</li>
                <li><strong>Sonuç:</strong> Öğrencinin numarası, adı, doğru, yanlış ve net puanı saniyeler içinde hesaplanıp tabloya kaydedilir.</li>
              </ol>
            </div>

            {/* Step 5: Karneler ve WhatsApp Paylaşımı */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center">
                  5
                </span>
                <h3>Adım 5: Karne Çıkarma ve Veliye WhatsApp Gönderimi</h3>
              </div>
              <ol className="text-xs text-slate-700 space-y-2 list-decimal pl-5">
                <li>Sınav sonuç listesinde öğrencinin yanındaki <strong>"Karne"</strong> butonuna tıklayın.</li>
                <li>Açılan pencerede öğrencinin net puanı, sınıf ortalaması ve hangi kazanımlarda hata yaptığı renkli grafiklerle listelenir.</li>
                <li><strong>"WhatsApp ile Paylaş"</strong> butonuna basarak velinin telefonuna sınav karnesi özetini tek tıkla mesaj olarak iletebilirsiniz.</li>
              </ol>
            </div>

            {/* Step 6: Destek & İstek Bildirimi */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-amber-950 font-bold text-base">
                <span className="w-7 h-7 rounded-lg bg-amber-600 text-white font-extrabold text-xs flex items-center justify-center">
                  6
                </span>
                <h3>Adım 6: Karşılaştığınız Bir Hata veya Yeni Bir Özellik İsteğini Bildirme</h3>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Sistemde çözemediğiniz bir sorun olursa veya eklenmesini istediğiniz bir özellik için doğrudan Sistem Yöneticisine (Süper Admin) ulaşabilirsiniz:
              </p>
              <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-5">
                <li>Profil simgenize tıklayıp <strong>"Sorun / İstek Bildir"</strong> seçeneğini seçin.</li>
                <li>Başlık ve sorununuzu detaylıca yazın.</li>
                <li>Varsa ekran görüntüsünü <strong>"Ekli Dosya Yükle"</strong> alanına ekleyin.</li>
                <li><strong>"Bildirimi Gönder"</strong> butonuna basın. Süper Admin bildirimler menüsünden talebinizi hemen görecektir.</li>
              </ol>
              {onOpenSupportTicket && (
                <div className="pt-2">
                  <button
                    onClick={onOpenSupportTicket}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Hemen Sorun / İstek Bildir
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROLE 2: SUPER ADMIN WORKFLOW GUIDE (ONLY ACCESSIBLE TO SUPERADMIN) */}
      {activeRole === 'superadmin' && canSeeSuperAdminGuide && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Süper Admin (Sistem Sahibi) Yönetim Kılavuzu</h2>
                <p className="text-xs text-slate-500">
                  Öğretmen üyelik onayları, rol terfileri, SMTP e-posta sunucusu ve destek bildirimleri yönetimi.
                </p>
              </div>
            </div>

            {/* SuperAdmin Workflow Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Öğretmen Kayıtlarını Onaylama Adımları</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Üst bardaki <strong>"Admin Paneli"</strong> menüsüne tıklayın.</li>
                  <li><strong>"Abonelik Talepleri & Bekleyen Üyelikler"</strong> sekmesine geçin.</li>
                  <li>Bekleyen öğretmen satırında <strong>"Onayla (Aktif Et)"</strong> butonuna basın.</li>
                  <li>Öğretmene anında 15 günlük tam yetkili kullanım açılır.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Kullanıcı Rolünü Yükseltme / Değiştirme</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Admin Panelinde <strong>"Kullanıcı Yönetimi"</strong> sekmesini açın.</li>
                  <li>İlgili kullanıcının satırındaki "Rol" açılır kutusundan <strong>"Admin (Okul Yöneticisi)"</strong> veya <strong>"Öğretmen"</strong> seçin.</li>
                  <li>Değişiklik anında kaydedilir ve kullanıcı yeni yetkilerine kavuşur.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                    3
                  </span>
                  <span>Gerçek E-Posta (SMTP / Gmail) Ayarlama</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Admin Panelindeki <strong>"E-Posta (SMTP) Ayarları"</strong> sekmesine geçin.</li>
                  <li>Gmail adresinizi ve 16 haneli <em>Google Uygulama Şifrenizi (App Password)</em> girin.</li>
                  <li><strong>"Ayarları Kaydet ve Test E-Postası Gönder"</strong>e tıklayın.</li>
                  <li>Kayıt olan kullanıcılara ve şifre sıfırlama taleplerine gerçek e-posta doğrulama kodları gönderilir.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs flex items-center justify-center font-bold">
                    4
                  </span>
                  <span>Öğretmenlerden Gelen Sorun ve İstek Bildirimleri</span>
                </div>
                <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
                  <li>Admin Panelinde <strong>"📩 Sorun & İstek Bildirimleri"</strong> sekmesini açın.</li>
                  <li>Öğretmenlerin yazdığı başlık, mesaj ve ekledikleri ekran görüntülerini inceleyin.</li>
                  <li>Durumunu <em>İnceleniyor, Çözüldü</em> olarak işaretleyin veya tek tıkla e-posta yanıtı oluşturun.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 3: SCHOOL ADMIN WORKFLOW GUIDE (ONLY FOR ADMIN OR SUPERADMIN) */}
      {activeRole === 'admin' && canSeeAdminGuide && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Okul Yöneticisi (İdareci) Kullanım Kılavuzu</h2>
                <p className="text-xs text-slate-500">
                  Okul geneli ortak sınavlar, toplu optik form basımı ve okul şube sıralamaları.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Toplu Optik Form Şablonu Yazdırma</h3>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Üst menüden <strong>"Optik Form Yazdır (A4)"</strong> seçeneğine tıklayın.</li>
                  <li>20, 40, 100 soru veya LGS 90 soru şablonlarından birini seçin.</li>
                  <li><strong>"Sayfada 2 Form"</strong> veya <strong>"Sayfada 4 Form"</strong> düzenini belirleyin.</li>
                  <li>Okul fotokopi makinesinden tek seferde sınıflar için toplu çoğaltma yapın.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">Zümre Ortak Deneme Sınavları</h3>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Yeni sınav ekranında <strong>"Çoklu Ders (Birleşik Deneme)"</strong> seçin.</li>
                  <li>Türkçe, Matematik, Fen ve Sosyal derslerini tek bir sınav altında toplayın.</li>
                  <li>Öğrenciler tek bir optik form kodlar; sistem tüm dersleri ayrı ayrı ve toplam LGS/YKS puanı olarak hesaplar.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE 4: STUDENT & PARENT GUIDE */}
      {activeRole === 'student' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Öğrenci & Veli Sınav Sonucu Takip Kılavuzu</h2>
                <p className="text-xs text-slate-500">
                  Öğrenci numarasıyla sınav sonuçlarını sorgulama, karne analizi ve konu eksiklerini görüntüleme.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">1. Sınav Sonucumu Nasıl Öğrenirim?</h3>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>testimgeldi'ye öğrenci numaranızla giriş yapın.</li>
                  <li><strong>"Sınav Sonuçlarım & Karnelerim"</strong> menüsüne tıklayın.</li>
                  <li>Öğretmeninizin okuttuğu tüm sınavlar, aldığınız puanlar ve sınıf ortalamaları anında ekranınıza gelir.</li>
                </ol>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-slate-900 text-sm">2. Hangi Konularda Eksiğim Var?</h3>
                <ol className="text-xs text-slate-600 space-y-1.5 list-decimal pl-4">
                  <li>Sınavın yanındaki <strong>"Karnemi Görüntüle"</strong> butonuna basın.</li>
                  <li>Karnenizin altındaki <strong>"Kazanım Analizi"</strong> tablosunu inceleyin.</li>
                  <li>Kırmızı ile işaretli konular yanlış yaptığınız soruları gösterir; bu konuları tekrar ederek eksiklerinizi kapatabilirsiniz.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIKÇA SORULAN SORULAR & PÜF NOKTALARI */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <HelpCircle className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-900 text-base">
            Sıkça Sorulan Sorular & Pratik Çözümler
          </h3>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Telefon kamerası optik formdaki baloncukları okumakta zorlanıyorsa ne yapmalıyım?',
              a: '1. Kağıdı düz, buruşuk olmayan ve gölgesiz bir masaya koyun.\n2. Telefonunuzu kağıdın tam üzerine 90 derece dik açıyla tutun.\n3. Kağıdın 4 köşesindeki siyah kare işaretlerinin ekrandaki yeşil kılavuz kutularıyla hizalandığından emin olun.\n4. Formu yazdırırken tarayıcı ayarlarında "Sayfaya Sığdır" yerine "%100 Gerçek Boyut" seçiniz.',
            },
            {
              q: 'PDF yüklemek yerine soruları ekrandan en hızlı nasıl teste eklerim?',
              a: 'Windows klavyenizden Win + Shift + S tuşlarına basarak sorunun etrafını seçip kopyalayın. Ardından Test & Quiz Hazırlama ekranında farenizle herhangi bir yere tıklayıp Ctrl + V yapın. Soru anında kağıdınıza eklenecektir!',
            },
            {
              q: 'Test & Quiz sayfasında "Cevap Anahtarı" butonu ne işe yarar?',
              a: 'Bu buton, hazırladığınız sınavın her sorusunun doğru şıkkını, puanını ve konusunu içeren "Öğretmen Cevap Anahtarı ve Kazanım Listesi" sayfasını açıp kapatır. Açık olduğunda yazdırma çıktısına ek bir öğretmen cevap anahtarı sayfası olarak eklenir.',
            },
            {
              q: 'Sistemde bir hata görürsem veya yapamadığım bir işlem olursa ne yapmalıyım?',
              a: 'Profil simgenizden veya Asistan üzerinden "Sorun / İstek Bildir" seçeneğine tıklayarak yaşadığınız sorunu ve varsa ekran görüntüsünü doğrudan Süper Admin kullanıcısına gönderebilirsiniz.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-800 flex items-center justify-between bg-slate-50/60 hover:bg-slate-100/80 transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                {expandedFaq === idx ? (
                  <ChevronDown className="w-4 h-4 text-indigo-600 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>
              {expandedFaq === idx && (
                <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-200 whitespace-pre-line">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
