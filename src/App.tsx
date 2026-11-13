import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './components/Toast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { ExamListView } from './components/ExamListView';
import { ExamDetailView } from './components/ExamDetailView';
import { BubbleSheetGenerator } from './components/BubbleSheetGenerator';
import { AdminPanel } from './components/AdminPanel';
import { StudentResultsView } from './components/StudentResultsView';
import { AuthModal } from './components/AuthModal';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { SubscriptionExpiredModal } from './components/SubscriptionExpiredModal';
import { ExamCreatorModal } from './components/ExamCreatorModal';
import { OMRScannerModal } from './components/OMRScannerModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { StudentReportCardModal } from './components/StudentReportCardModal';
import { ProfileModal } from './components/ProfileModal';
import { SupportTicketModal } from './components/support/SupportTicketModal';
import { QuizBuilderView } from './components/quiz/QuizBuilderView';
import { UserGuideView } from './components/guide/UserGuideView';
import { AIAssistantWidget } from './components/assistant/AIAssistantWidget';
import { StorageService } from './lib/storage';
import { Exam, StudentResult } from './types';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';

function MainApp() {
  const { currentUser, isAuthenticated, isSuperAdmin, isAdmin, isTeacher, isStudent, isSubscriptionActive, remainingDays } = useAuth();
  const { showToast } = useToast();

  const [currentView, setCurrentView] = useState<'exams' | 'exam-detail' | 'bubble-sheets' | 'admin' | 'student-results' | 'quiz-builder' | 'guide'>('exams');
  const [exams, setExams] = useState<Exam[]>(() => StorageService.getExams());
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);

  // Modals state
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPasswordChangeModalOpen, setIsPasswordChangeModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [hasDismissedNotice, setHasDismissedNotice] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupportTicketModalOpen, setIsSupportTicketModalOpen] = useState(false);
  const [isExamCreatorOpen, setIsExamCreatorOpen] = useState(false);
  const [isOMRScannerOpen, setIsOMRScannerOpen] = useState(false);
  const [isStudentDetailOpen, setIsStudentDetailOpen] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  // Sync Cloud Firestore data down to local cache on initial app boot
  useEffect(() => {
    StorageService.syncCloudToLocal()
      .then(() => {
        setExams(StorageService.getExams());
      })
      .catch(() => {});
  }, []);

  // Auto set view based on role and protect admin routes
  useEffect(() => {
    if (isStudent) {
      if (currentView !== 'student-results') setCurrentView('student-results');
    } else if (currentView === 'student-results') {
      setCurrentView('exams');
    } else if (currentView === 'admin' && !isAdmin) {
      setCurrentView('exams');
    }
  }, [isStudent, isAdmin, currentView]);

  // If teacher subscription expired, prompt subscription modal once per session (dismissible)
  useEffect(() => {
    if (isTeacher && !isSubscriptionActive && !hasDismissedNotice) {
      setIsSubscriptionModalOpen(true);
    }
  }, [isTeacher, isSubscriptionActive, hasDismissedNotice]);

  const refreshExams = () => {
    const list = StorageService.getExams();
    setExams(list);
    if (selectedExam) {
      const updated = list.find((e) => e.id === selectedExam.id) || null;
      setSelectedExam(updated);
    }
  };

  const handleSelectExam = (exam: Exam) => {
    setSelectedExam(exam);
    setCurrentView('exam-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExamCreated = (newExam: Exam) => {
    refreshExams();
    setSelectedExam(newExam);
    setCurrentView('exam-detail');
  };

  const handleSelectStudentForDetail = (result: StudentResult) => {
    setSelectedStudent(result);
    setIsStudentDetailOpen(true);
  };

  const handleOpenReportCard = (result: StudentResult, exam?: Exam) => {
    if (exam) {
      setSelectedExam(exam);
    }
    setSelectedStudent(result);
    setIsReportCardOpen(true);
  };

  // IF NOT LOGGED IN: SHOW PRESENTATION LANDING PAGE ONLY
  if (!isAuthenticated || !currentUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      </>
    );
  }

  // LOGGED IN APP VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Teacher Trial Expiration Banner if approaching end or expired */}
      {isTeacher && !isSubscriptionActive && (
        <div className="bg-rose-600 text-white px-3 sm:px-4 py-2 text-xs font-semibold text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1 no-print">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>15 günlük deneme süreniz dolmuştur. Sınav oluşturma ve optik okuma işlemlerine devam etmek için lütfen paket seçiniz.</span>
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="underline font-bold hover:text-rose-100 cursor-pointer whitespace-nowrap"
          >
            Paketleri İncele & Talep Gönder
          </button>
        </div>
      )}

      {isTeacher && isSubscriptionActive && remainingDays <= 5 && (
        <div className="bg-amber-500 text-slate-900 px-3 sm:px-4 py-1.5 text-xs font-semibold text-center flex flex-wrap items-center justify-center gap-x-2 gap-y-1 no-print">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>15 günlük ücretsiz deneme sürenizin bitmesine <strong>{remainingDays} gün</strong> kaldı.</span>
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="underline hover:text-black cursor-pointer whitespace-nowrap"
          >
            Paket Seçenekleri
          </button>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'admin' && !isAdmin) {
            showToast('Yönetici paneline erişim yetkiniz bulunmamaktadır.', 'error');
            return;
          }
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenCreateExam={() => {
          if (isTeacher && !isSubscriptionActive) {
            setIsSubscriptionModalOpen(true);
            showToast('Deneme süreniz dolduğu için paket seçimi yapmanız gerekmektedir.', 'error');
            return;
          }
          setIsExamCreatorOpen(true);
        }}
        onOpenAuth={(mode = 'login') => {
          setAuthModalMode(mode);
          setIsAuthModalOpen(true);
        }}
        onOpenPasswordChange={() => setIsPasswordChangeModalOpen(true)}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenSupportTicket={() => setIsSupportTicketModalOpen(true)}
      />

      {/* Main Viewport */}
      <main className="flex-1">
        {currentView === 'exams' && (
          <ExamListView
            exams={exams}
            onSelectExam={handleSelectExam}
            onOpenCreateExam={() => {
              if (isTeacher && !isSubscriptionActive) {
                setIsSubscriptionModalOpen(true);
                return;
              }
              setIsExamCreatorOpen(true);
            }}
            onNavigateToBubbleSheets={() => setCurrentView('bubble-sheets')}
            onNavigateToQuizBuilder={() => setCurrentView('quiz-builder')}
            onRefreshExams={refreshExams}
          />
        )}

        {currentView === 'exam-detail' && selectedExam && (
          <ExamDetailView
            exam={selectedExam}
            onBack={() => {
              setCurrentView('exams');
              setSelectedExam(null);
            }}
            onOpenOMRScanner={() => {
              if (isTeacher && !isSubscriptionActive) {
                setIsSubscriptionModalOpen(true);
                showToast('Deneme süreniz dolduğu için kağıt okutamazsınız.', 'error');
                return;
              }
              setIsOMRScannerOpen(true);
            }}
            onSelectStudent={handleSelectStudentForDetail}
            onOpenReportCard={(res) => handleOpenReportCard(res, selectedExam)}
            onRefreshExam={refreshExams}
          />
        )}

        {currentView === 'bubble-sheets' && <BubbleSheetGenerator />}

        {currentView === 'quiz-builder' && (
          <QuizBuilderView
            onNavigateToExamDetail={(examId) => {
              const ex = StorageService.getExamById(examId);
              if (ex) handleSelectExam(ex);
            }}
            onRefreshExams={refreshExams}
          />
        )}

        {currentView === 'student-results' && (
          <StudentResultsView
            onOpenReportCard={(res, ex) => handleOpenReportCard(res, ex)}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            onSelectExam={handleSelectExam}
            onNavigateToExams={() => setCurrentView('exams')}
          />
        )}

        {currentView === 'guide' && (
          <UserGuideView
            onNavigateToView={(view) => setCurrentView(view as any)}
            onOpenCreateExam={() => setIsExamCreatorOpen(true)}
            onOpenSupportTicket={() => setIsSupportTicketModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            <span className="font-bold text-slate-800">testimgeldi</span>
            <span className="hidden sm:inline">—</span>
            <span>Online Optik Okuma ve Sınav Değerlendirme Sistemi · testimgeldi.com</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[11px] text-slate-400">
            <span>Standart OMR & A4 Optik Form Şablonları</span>
            <span aria-hidden="true">·</span>
            <span>SuperAdmin: {isSuperAdmin ? 'Aktif' : 'Korunuyor'}</span>
            <span aria-hidden="true">·</span>
            <span>{new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        onClose={() => setIsAuthModalOpen(false)}
      />

      <PasswordChangeModal
        isOpen={isPasswordChangeModalOpen}
        onClose={() => setIsPasswordChangeModalOpen(false)}
      />

      <SubscriptionExpiredModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => {
          setIsSubscriptionModalOpen(false);
          setHasDismissedNotice(true);
        }}
        canDismiss={true}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenSupportTicket={() => setIsSupportTicketModalOpen(true)}
      />

      <SupportTicketModal
        isOpen={isSupportTicketModalOpen}
        onClose={() => setIsSupportTicketModalOpen(false)}
      />

      <ExamCreatorModal
        isOpen={isExamCreatorOpen}
        onClose={() => setIsExamCreatorOpen(false)}
        onExamCreated={handleExamCreated}
        onOpenSubscriptionModal={() => setIsSubscriptionModalOpen(true)}
      />

      {selectedExam && (
        <OMRScannerModal
          isOpen={isOMRScannerOpen}
          onClose={() => setIsOMRScannerOpen(false)}
          exam={selectedExam}
          onGradingComplete={() => {
            refreshExams();
            setIsOMRScannerOpen(false);
          }}
        />
      )}

      {selectedExam && selectedStudent && (
        <StudentDetailModal
          isOpen={isStudentDetailOpen}
          onClose={() => setIsStudentDetailOpen(false)}
          exam={selectedExam}
          result={selectedStudent}
          onUpdated={refreshExams}
          onOpenReportCard={(res) => handleOpenReportCard(res, selectedExam)}
        />
      )}

      {selectedExam && selectedStudent && (
        <StudentReportCardModal
          isOpen={isReportCardOpen}
          onClose={() => setIsReportCardOpen(false)}
          exam={selectedExam}
          result={selectedStudent}
          classAverage={selectedExam.averageScore || 75}
        />
      )}

      {/* FLOATING AI ASSISTANT CHATBOT (Geçici olarak gizlendi - ileride tekrar aktif edilecek) */}
      {/*
      <AIAssistantWidget
        currentView={currentView}
        onNavigateToView={(view) => setCurrentView(view as any)}
        onOpenCreateExam={() => setIsExamCreatorOpen(true)}
        onOpenSupportTicket={() => setIsSupportTicketModalOpen(true)}
      />
      */}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
