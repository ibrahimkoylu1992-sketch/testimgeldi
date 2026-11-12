import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/storage';
import {
  Shield,
  KeyRound,
  LogOut,
  Printer,
  Plus,
  ChevronDown,
  Clock,
  Sparkles,
  BookOpen,
  User,
  Menu,
  X,
  FileText,
  Crop,
  MessageSquare,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'exams' | 'exam-detail' | 'bubble-sheets' | 'admin' | 'student-results' | 'quiz-builder' | 'guide';
  onNavigate: (view: 'exams' | 'bubble-sheets' | 'admin' | 'student-results' | 'quiz-builder' | 'guide') => void;
  onOpenCreateExam: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenPasswordChange: () => void;
  onOpenSubscriptionModal: () => void;
  onOpenProfile: () => void;
  onOpenSupportTicket?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenCreateExam,
  onOpenAuth,
  onOpenPasswordChange,
  onOpenSubscriptionModal,
  onOpenProfile,
  onOpenSupportTicket,
}) => {
  const {
    currentUser,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    logout,
    remainingDays,
    isSubscriptionActive,
  } = useAuth();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Only if click wasn't on the hamburger button itself
        const target = event.target as HTMLElement;
        if (!target.closest('#mobile-menu-btn')) {
          setMobileMenuOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingRequestsCount = isAdmin
    ? StorageService.getSubscriptionRequests().filter((r) => r.status === 'pending').length
    : 0;

  const handleMobileNav = (action: () => void) => {
    action();
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            id="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Menüyü Aç/Kapat"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onNavigate(isStudent ? 'student-results' : 'exams')}
            className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-bold text-lg group-hover:bg-indigo-700 transition-colors">
              tg
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                testimgeldi
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {!isStudent ? (
            <>
              <button
                onClick={() => onNavigate('exams')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 cursor-pointer ${
                  currentView === 'exams' || currentView === 'exam-detail'
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600'
                }`}
              >
                Sınavlarım
              </button>

              <button
                onClick={() => onNavigate('quiz-builder')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'quiz-builder' ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                }`}
              >
                <Crop className="w-4 h-4 text-indigo-600" />
                <span>Test & Quiz Hazırla</span>
              </button>

              <button
                onClick={onOpenCreateExam}
                className="transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>Yeni Sınav</span>
              </button>

              <button
                onClick={() => onNavigate('bubble-sheets')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'bubble-sheets' ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                }`}
              >
                <Printer className="w-4 h-4 text-slate-500" />
                <span>Optik Form Yazdır</span>
              </button>

              <button
                onClick={() => onNavigate('guide')}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'guide' ? 'text-indigo-600 font-semibold' : 'text-slate-600'
                }`}
              >
                <BookOpen className="w-4 h-4 text-indigo-500" />
                <span>Kılavuz & Rehber</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => onNavigate('student-results')}
              className="text-indigo-600 font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>Sınav Sonuçlarım & Karnelerim</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer ${
                currentView === 'admin' ? 'text-indigo-600 font-semibold' : 'text-slate-600'
              }`}
            >
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Admin Paneli</span>
              {pendingRequestsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Subscription & User Account */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated && currentUser ? (
            <>
              {/* Teacher Subscription Days Indicator */}
              {isTeacher && (
                <button
                  onClick={onOpenSubscriptionModal}
                  className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer min-h-[38px] ${
                    !isSubscriptionActive
                      ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                      : remainingDays <= 5
                      ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                  title="Abonelik süresi ve paket seçenekleri"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {!isSubscriptionActive
                      ? 'Süre Doldu (Paket Seç)'
                      : `${remainingDays} Gün Kaldı`}
                  </span>
                </button>
              )}

              {/* Desktop User Menu */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors text-xs font-medium text-slate-800 cursor-pointer min-h-[40px]"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                      isSuperAdmin ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {isSuperAdmin ? '👑' : currentUser.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {isSuperAdmin
                        ? 'SuperAdmin'
                        : currentUser.role === 'admin'
                        ? 'Admin'
                        : currentUser.role === 'student'
                        ? 'Öğrenci'
                        : 'Öğretmen'}
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 text-sm z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <div className="font-semibold text-slate-900 truncate">{currentUser.name}</div>
                      <div className="text-xs text-slate-500 truncate">{currentUser.email}</div>
                      <div className="text-[11px] font-semibold mt-1">
                        {isSuperAdmin && <span className="text-amber-800">👑 SuperAdmin (Sistem Sahibi)</span>}
                        {currentUser.role === 'admin' && !isSuperAdmin && (
                          <span className="text-indigo-600">Yönetici (Admin)</span>
                        )}
                        {currentUser.role === 'teacher' && (
                          <span className={isSubscriptionActive ? 'text-indigo-600' : 'text-rose-600'}>
                            Öğretmen ({isSubscriptionActive ? `${remainingDays} Gün Aktif` : 'Süre Doldu'})
                          </span>
                        )}
                        {currentUser.role === 'student' && (
                          <span className="text-emerald-700">Öğrenci (Süresiz Ücretsiz)</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenProfile();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                    >
                      <User className="w-4 h-4 text-indigo-600" />
                      <span>Profilim & Ders/Sınıf Tercihlerim</span>
                    </button>

                    {isTeacher && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onOpenSubscriptionModal();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Kullanım Paketleri & Süre</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          onNavigate('admin');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        <span>Admin Yönetim Paneli</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenPasswordChange();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                    >
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      <span>Şifremi Değiştir</span>
                    </button>

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        onOpenSupportTicket?.();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-amber-50 text-amber-800 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-600" />
                      <span>Sorun / İstek Bildir</span>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2 transition-colors cursor-pointer text-xs min-h-[38px]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Oturumu Kapat</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => onOpenAuth('login')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer min-h-[44px] flex items-center"
            >
              Giriş / Kayıt
            </button>
          )}
        </div>
      </div>

      {/* MOBILE NAVIGATION DRAWER */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden border-t border-slate-200 bg-white shadow-xl animate-in slide-in-from-top-2 duration-150 py-3 px-4 space-y-2"
        >
          {isAuthenticated && currentUser ? (
            <>
              {/* User info card in mobile drawer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                      isSuperAdmin ? 'bg-amber-200 text-amber-900' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {isSuperAdmin ? '👑' : currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 leading-tight">
                      {currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isSuperAdmin
                        ? 'SuperAdmin'
                        : currentUser.role === 'admin'
                        ? 'Admin'
                        : currentUser.role === 'student'
                        ? `Öğrenci (No: ${currentUser.studentNumber || '-'})`
                        : `${currentUser.branch || 'Öğretmen'} · ${currentUser.school || ''}`}
                    </div>
                  </div>
                </div>

                {isTeacher && (
                  <button
                    onClick={() => handleMobileNav(onOpenSubscriptionModal)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                      !isSubscriptionActive
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    {isSubscriptionActive ? `${remainingDays} Gün` : 'Süre Doldu'}
                  </button>
                )}
              </div>

              {/* Navigation Items */}
              <div className="grid grid-cols-1 gap-1 pt-1">
                {!isStudent ? (
                  <>
                    <button
                      onClick={() => handleMobileNav(() => onNavigate('exams'))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                        currentView === 'exams' || currentView === 'exam-detail'
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Sınavlarım</span>
                    </button>

                    <button
                      onClick={() => handleMobileNav(() => onNavigate('quiz-builder'))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                        currentView === 'quiz-builder'
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Crop className="w-4 h-4 text-indigo-600" />
                      <span>Test & Quiz Hazırla (PDF & Soru)</span>
                    </button>

                    <button
                      onClick={() => handleMobileNav(onOpenCreateExam)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-indigo-600" />
                      <span>Yeni Sınav Oluştur</span>
                    </button>

                    <button
                      onClick={() => handleMobileNav(() => onNavigate('bubble-sheets'))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                        currentView === 'bubble-sheets'
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>Optik Form Yazdır (A4)</span>
                    </button>

                    <button
                      onClick={() => handleMobileNav(() => onNavigate('guide'))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                        currentView === 'guide'
                          ? 'bg-indigo-50 text-indigo-700 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      <span>Kullanım Kılavuzu & Rehber</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleMobileNav(() => onNavigate('student-results'))}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 font-semibold min-h-[44px] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>Sınav Sonuçlarım & Karnelerim</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleMobileNav(() => onNavigate('admin'))}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px] cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-amber-50 text-amber-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>Admin Yönetim Paneli</span>
                    </span>
                    {pendingRequestsCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold">
                        {pendingRequestsCount} bekleyen
                      </span>
                    )}
                  </button>
                )}

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => handleMobileNav(onOpenProfile)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Profilim & Tercihlerim</span>
                </button>

                {isTeacher && (
                  <button
                    onClick={() => handleMobileNav(onOpenSubscriptionModal)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    <span>Kullanım Paketleri & Fiyatlar</span>
                  </button>
                )}

                <button
                  onClick={() => handleMobileNav(onOpenPasswordChange)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-slate-500" />
                  <span>Şifremi Değiştir</span>
                </button>

                <button
                  onClick={() => handleMobileNav(() => onOpenSupportTicket?.())}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-800 bg-amber-50/60 hover:bg-amber-100/80 transition-colors min-h-[44px] cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  <span>Sorun / İstek Bildir</span>
                </button>

                <button
                  onClick={() => handleMobileNav(logout)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors min-h-[44px] cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Oturumu Kapat</span>
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-2 py-1">
              <button
                onClick={() => handleMobileNav(() => onOpenAuth('login'))}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors text-center min-h-[44px] cursor-pointer"
              >
                Giriş Yap
              </button>
              <button
                onClick={() => handleMobileNav(() => onOpenAuth('register'))}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-lg transition-colors text-center min-h-[44px] cursor-pointer"
              >
                15 Gün Ücretsiz Kayıt Ol
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
