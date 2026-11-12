import React, { useState, useEffect } from 'react';
import { QuizDocument, QuizQuestion, QuizHeaderSettings } from '../../types/quiz';
import { StorageService } from '../../lib/storage';
import { DEFAULT_SAMPLE_QUIZ } from '../../lib/quizSampleData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { TestSheetPaper } from './TestSheetPaper';
import { PdfQuestionCropperModal } from './PdfQuestionCropperModal';
import { ManualQuestionModal } from './ManualQuestionModal';
import { QuestionBankModal } from './QuestionBankModal';
import {
  Plus,
  Printer,
  Crop,
  Layers,
  FileText,
  Trash2,
  Edit3,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  Settings,
  Check,
  Eye,
  Copy,
  Scan,
  BookOpen,
  School,
  FileQuestion,
  ChevronRight,
} from 'lucide-react';

interface QuizBuilderViewProps {
  onNavigateToExamDetail?: (examId: string) => void;
  onRefreshExams?: () => void;
}

export const QuizBuilderView: React.FC<QuizBuilderViewProps> = ({
  onNavigateToExamDetail,
  onRefreshExams,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  // Active quiz document
  const [quizzes, setQuizzes] = useState<QuizDocument[]>(() => StorageService.getQuizzes());
  const [activeQuiz, setActiveQuiz] = useState<QuizDocument>(() => {
    const list = StorageService.getQuizzes();
    return list[0] || DEFAULT_SAMPLE_QUIZ;
  });

  // Modals state
  const [isPdfCropperOpen, setIsPdfCropperOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isManualQuestionModalOpen, setIsManualQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isSavedQuizzesDrawerOpen, setIsSavedQuizzesDrawerOpen] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // View toggles
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [previewZoom, setPreviewZoom] = useState(1); // 1 = 100%

  // Save changes to storage whenever activeQuiz updates
  const saveActiveQuiz = (updated: QuizDocument) => {
    setActiveQuiz(updated);
    StorageService.saveQuiz(updated);
    setQuizzes(StorageService.getQuizzes());
  };

  // Add question to active quiz
  const handleAddQuestion = (newQuestion: QuizQuestion) => {
    const updatedQuestions = [...activeQuiz.questions, newQuestion];
    // Re-index order numbers
    const reindexed = updatedQuestions.map((q, idx) => ({
      ...q,
      orderNumber: idx + 1,
    }));

    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      questions: reindexed,
      updatedAt: new Date().toISOString(),
    };
    saveActiveQuiz(updatedQuiz);
  };

  // Batch add questions from Question Bank
  const handleBatchAddQuestions = (newQuestions: QuizQuestion[]) => {
    const updatedQuestions = [...activeQuiz.questions, ...newQuestions];
    const reindexed = updatedQuestions.map((q, idx) => ({
      ...q,
      orderNumber: idx + 1,
    }));
    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      questions: reindexed,
      updatedAt: new Date().toISOString(),
    };
    saveActiveQuiz(updatedQuiz);
  };

  // Update existing question
  const handleUpdateQuestion = (updatedQ: QuizQuestion) => {
    const idx = activeQuiz.questions.findIndex((q) => q.id === updatedQ.id);
    if (idx === -1) {
      handleAddQuestion(updatedQ);
      return;
    }
    const updatedList = [...activeQuiz.questions];
    updatedList[idx] = updatedQ;

    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      questions: updatedList,
      updatedAt: new Date().toISOString(),
    };
    saveActiveQuiz(updatedQuiz);
  };

  // Delete question
  const handleDeleteQuestion = (id: string) => {
    const filtered = activeQuiz.questions.filter((q) => q.id !== id);
    const reindexed = filtered.map((q, idx) => ({
      ...q,
      orderNumber: idx + 1,
    }));
    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      questions: reindexed,
      updatedAt: new Date().toISOString(),
    };
    saveActiveQuiz(updatedQuiz);
    showToast('Soru silindi.', 'info');
  };

  // Move Question Up / Down
  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const list = [...activeQuiz.questions];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reindexed = list.map((q, idx) => ({
      ...q,
      orderNumber: idx + 1,
    }));

    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      questions: reindexed,
    };
    saveActiveQuiz(updatedQuiz);
  };

  // Duplicate Question
  const handleDuplicateQuestion = (q: QuizQuestion) => {
    const duplicated: QuizQuestion = {
      ...q,
      id: 'q_' + Date.now(),
      orderNumber: activeQuiz.questions.length + 1,
    };
    handleAddQuestion(duplicated);
    showToast('Soru kopyalandı.', 'success');
  };

  // Header settings update
  const handleUpdateSettings = (partial: Partial<QuizHeaderSettings>) => {
    const updatedQuiz: QuizDocument = {
      ...activeQuiz,
      settings: {
        ...activeQuiz.settings,
        ...partial,
      },
      title: partial.examTitle || activeQuiz.title,
      schoolName: partial.schoolName || activeQuiz.schoolName,
      subject: partial.courseName || activeQuiz.subject,
      gradeLevel: partial.gradeLevel || activeQuiz.gradeLevel,
    };
    saveActiveQuiz(updatedQuiz);
  };

  // Reset to sample math quiz
  const handleLoadSampleQuiz = () => {
    if (window.confirm('Örnek LGS Matematik Tarama Sınavını yüklemek istiyor musunuz?')) {
      saveActiveQuiz(DEFAULT_SAMPLE_QUIZ);
      showToast('Örnek sınav yüklendi!', 'success');
    }
  };

  // Create new blank quiz
  const handleCreateNewBlankQuiz = () => {
    const newDoc: QuizDocument = {
      id: 'quiz_' + Date.now(),
      title: 'Yeni Test / Quiz',
      subject: currentUser?.branch || 'Matematik',
      gradeLevel: currentUser?.gradeLevel || '8. Sınıf',
      schoolName: currentUser?.school || 'Cumhuriyet Ortaokulu',
      creatorId: currentUser?.id || 'usr_anon',
      creatorName: currentUser?.name || 'Öğretmen',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        schoolName: currentUser?.school || 'Cumhuriyet Ortaokulu',
        examTitle: 'YENİ TARAMA SINAV SORULARI',
        academicYear: '2025 - 2026 Eğitim-Öğretim Yılı',
        termInfo: '1. Dönem 1. Sınav',
        courseName: currentUser?.branch || 'Matematik',
        gradeLevel: currentUser?.gradeLevel || '8. Sınıf',
        dateText: new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
        durationText: '40 Dakika',
        instructions: 'Sınav süresi 40 dakikadır. Yanlış cevaplar doğruyu götürmez. Başarılar dileriz.',
        showStudentTable: true,
        showScoreBox: true,
        showMiniOpticalGrid: true,
        twoColumnLayout: true,
        showQuestionDividerLines: true,
        headerStyle: 'standard',
      },
      questions: [],
    };
    saveActiveQuiz(newDoc);
    showToast('Yeni boş test oluşturuldu. PDF veya soru ekleyebilirsiniz.', 'success');
  };

  // Convert quiz to exam in OMR Evaluation System
  const handleConvertToExam = () => {
    if (!currentUser) {
      showToast('Sınav oluşturmak için lütfen oturum açınız.', 'error');
      return;
    }
    if (activeQuiz.questions.length === 0) {
      showToast('Lütfen önce test kağıdınıza en az 1 soru ekleyiniz.', 'error');
      return;
    }

    const newExam = StorageService.convertQuizToExam(activeQuiz, currentUser);
    showToast(`"${newExam.title}" başarıyla testimgeldi Optik Sınavlarına aktarıldı!`, 'success');
    if (onRefreshExams) onRefreshExams();
    if (onNavigateToExamDetail) {
      onNavigateToExamDetail(newExam.id);
    }
  };

  // High-fidelity print
  const handlePrint = () => {
    try {
      const printableElem = document.getElementById('printable-quiz-sheet');
      if (!printableElem) {
        window.print();
        return;
      }

      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${activeQuiz.title}</title>
              <meta charset="utf-8" />
              <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #000; }
                * { box-sizing: border-box; }
                .no-print { display: none !important; }
                .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
              </style>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
            </head>
            <body>
              <div style="width: 100%; max-width: 210mm; margin: 0 auto;">
                ${printableElem.innerHTML}
              </div>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }, 400);

        showToast('Yazdırma penceresi açıldı.', 'info');
        return;
      }
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
    }
    window.print();
  };

  // Calculate total points
  const totalPoints = activeQuiz.questions.reduce((sum, q) => sum + (q.points || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Yeni Modül: Test & Quiz Kağıdı Hazırlayıcı
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
              MEB Standardında 2 Sütunlu Sınav Kağıdı Oluşturun
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              PDF'deki soruları ekrandan kırpın, manuel soru & şık yazın veya görsel ekleyin.
              A4 baskıya hazır, mini optik formlu profesyonel sınav kağıdı üretin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsPdfCropperOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Crop className="w-4 h-4" />
              <span>PDF'den Soru Kırp</span>
            </button>

            <button
              onClick={() => {
                setEditingQuestion(null);
                setIsManualQuestionModalOpen(true);
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Manuel Soru Yaz</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        {/* Test Name & Switcher */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <FileQuestion className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={activeQuiz.settings.examTitle}
                onChange={(e) => handleUpdateSettings({ examTitle: e.target.value })}
                className="font-bold text-slate-900 text-sm border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
                title="Sınav başlığını düzenlemek için tıklayın"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 px-1">
              <span>{activeQuiz.questions.length} Soru</span>
              <span aria-hidden="true">·</span>
              <span>Toplam {totalPoints} Puan</span>
              <span aria-hidden="true">·</span>
              <span>{activeQuiz.settings.twoColumnLayout ? '2 Sütunlu (MEB Formatı)' : 'Tek Sütun'}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Settings Panel Toggle */}
          <button
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showSettingsPanel
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Sayfa Ayarları</span>
          </button>

          {/* Answer Key Toggle */}
          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className={`px-3 py-2 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showAnswerKey
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Öğretmen ve zümre için her sorunun doğru şıkkı, puanı ve konusunu içeren cevap anahtarı sayfasını açar/kapatır"
          >
            <Check className={`w-3.5 h-3.5 ${showAnswerKey ? 'text-white' : 'text-emerald-600'}`} />
            <span>🔑 Cevap Anahtarı {showAnswerKey ? '(Açık)' : ''}</span>
          </button>

          {/* Convert to OMR Exam */}
          <button
            onClick={handleConvertToExam}
            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bu testi testimgeldi optik okuma sistemine aktarır"
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Optik Sınava Dönüştür</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Yazdır / PDF Kaydet</span>
          </button>

          {/* Sample Quiz */}
          <button
            onClick={handleLoadSampleQuiz}
            className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Örnek Matematik testini yükle"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </button>

          {/* New Blank Quiz */}
          <button
            onClick={handleCreateNewBlankQuiz}
            className="px-2.5 py-2 text-xs text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Yeni boş sınav kağıdı aç"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Informative Answer Key Banner */}
      {showAnswerKey && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-center justify-between gap-3 no-print animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
              ✓
            </span>
            <div>
              <strong>🔑 Öğretmen Cevap Anahtarı & Kazanım Çizelgesi Açık:</strong> Soruların doğru cevapları (A-E), puanları ve kazanım dağılımı A4 kağıdı olarak sınavın sonuna eklenir. Öğrencilere sınavı dağıtmadan önce butona tekrar basarak kapatabilirsiniz.
            </div>
          </div>
          <button
            onClick={() => setShowAnswerKey(false)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded hover:bg-emerald-100 cursor-pointer text-[11px] shrink-0"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Settings Drawer (if toggled) */}
      {showSettingsPanel && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-4 animate-in slide-in-from-top-2 duration-150 no-print">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-bold text-slate-800">
            <span>Sınav Kağıdı & Başlık Özelleştirme</span>
            <button
              onClick={() => setShowSettingsPanel(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Okul Adı</label>
              <input
                type="text"
                value={activeQuiz.settings.schoolName}
                onChange={(e) => handleUpdateSettings({ schoolName: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Eğitim Yılı</label>
              <input
                type="text"
                value={activeQuiz.settings.academicYear}
                onChange={(e) => handleUpdateSettings({ academicYear: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Ders & Sınıf</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={activeQuiz.settings.courseName}
                  onChange={(e) => handleUpdateSettings({ courseName: e.target.value })}
                  placeholder="Ders"
                  className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
                <input
                  type="text"
                  value={activeQuiz.settings.gradeLevel}
                  onChange={(e) => handleUpdateSettings({ gradeLevel: e.target.value })}
                  placeholder="Sınıf"
                  className="w-1/2 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sınav Süresi</label>
              <input
                type="text"
                value={activeQuiz.settings.durationText}
                onChange={(e) => handleUpdateSettings({ durationText: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sayfa Başı Soru (A4 Bölme)</label>
              <select
                value={activeQuiz.settings.questionsPerPage || 0}
                onChange={(e) => handleUpdateSettings({ questionsPerPage: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-indigo-600 font-medium"
              >
                <option value={0}>Otomatik Bölme (4-6 Soru / Sayfa)</option>
                <option value={4}>Sayfa Başı 4 Soru</option>
                <option value={5}>Sayfa Başı 5 Soru</option>
                <option value={6}>Sayfa Başı 6 Soru</option>
                <option value={8}>Sayfa Başı 8 Soru</option>
              </select>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-200">
            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeQuiz.settings.twoColumnLayout}
                onChange={(e) => handleUpdateSettings({ twoColumnLayout: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>2 Sütunlu MEB Düzeni (Dikey Bölücü Çizgi)</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeQuiz.settings.showStudentTable}
                onChange={(e) => handleUpdateSettings({ showStudentTable: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Öğrenci Bilgi Alanı (Adı, Soyadı, No)</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeQuiz.settings.showScoreBox}
                onChange={(e) => handleUpdateSettings({ showScoreBox: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Aldığı Puan Kutusu</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeQuiz.settings.showMiniOpticalGrid}
                onChange={(e) => handleUpdateSettings({ showMiniOpticalGrid: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Mini Optik Kodlama Alanı</span>
            </label>

            <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={activeQuiz.settings.showQuestionDividerLines}
                onChange={(e) => handleUpdateSettings({ showQuestionDividerLines: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Sorular Arası Yatay Çizgi</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Split Layout: Left Column Question Cards Manager, Right Column Live A4 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5/12): Question Manager & Cards */}
        <div className="lg:col-span-5 space-y-4 no-print">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Soru Listesi ({activeQuiz.questions.length} Soru)
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setIsQuestionBankOpen(true)}
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors border border-amber-200"
                  title="Kazanım odaklı örnek soru bankasından ekleyin"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Soru Bankası</span>
                </button>
                <button
                  onClick={() => setIsPdfCropperOpen(true)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  title="PDF belgesinden soru kırparak ekleyin"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>PDF'den Kırp</span>
                </button>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsManualQuestionModalOpen(true);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Manuel</span>
                </button>
              </div>
            </div>

            {/* Questions List */}
            {activeQuiz.questions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs">Bu teste henüz soru eklenmedi.</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setIsPdfCropperOpen(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    PDF'den Soru Kırp
                  </button>
                  <button
                    onClick={handleLoadSampleQuiz}
                    className="px-3 py-1.5 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                  >
                    Örnek Soruları Yükle
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto pt-2">
                {activeQuiz.questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="py-3 flex items-start justify-between gap-3 group hover:bg-slate-50/70 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Order Number Badge */}
                      <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {q.orderNumber}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Cropped thumbnail or text preview */}
                        {q.croppedImage ? (
                          <div className="flex items-center gap-2 mb-1">
                            <img
                              src={q.croppedImage}
                              alt={`Soru ${q.orderNumber}`}
                              className="h-10 w-20 object-contain border border-slate-200 rounded bg-white"
                            />
                            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                              PDF Kırpması
                            </span>
                          </div>
                        ) : null}

                        {q.questionText && (
                          <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                            {q.questionText}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            Doğru: {q.correctAnswer}
                          </span>
                          <span>{q.points} Puan</span>
                          {q.topic && <span>· {q.topic}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Question Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                      <button
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        disabled={idx === activeQuiz.questions.length - 1}
                        className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicateQuestion(q)}
                        className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Kopyala"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsManualQuestionModalOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (7/12): Live A4 Test Sheet Preview */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between no-print text-xs text-slate-500 font-medium px-2">
            <span>A4 Sınav Kağıdı Canlı Önizleme (Baskıya Hazır)</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                A4 (210 × 297 mm)
              </span>
            </div>
          </div>

          {/* Paper Viewport Container */}
          <div className="bg-slate-300 p-4 sm:p-6 rounded-2xl shadow-inner overflow-x-auto flex justify-center">
            <TestSheetPaper
              quiz={activeQuiz}
              showAnswerKey={showAnswerKey}
              showMiniOpticalGrid={activeQuiz.settings.showMiniOpticalGrid}
            />
          </div>
        </div>
      </div>

      {/* PDF QUESTION CROPPER MODAL */}
      <PdfQuestionCropperModal
        isOpen={isPdfCropperOpen}
        onClose={() => setIsPdfCropperOpen(false)}
        onAddQuestion={handleAddQuestion}
        nextOrderNumber={activeQuiz.questions.length + 1}
      />

      {/* MANUAL QUESTION CREATOR / EDITOR MODAL */}
      <ManualQuestionModal
        isOpen={isManualQuestionModalOpen}
        onClose={() => {
          setIsManualQuestionModalOpen(false);
          setEditingQuestion(null);
        }}
        onSaveQuestion={handleUpdateQuestion}
        editingQuestion={editingQuestion}
        nextOrderNumber={activeQuiz.questions.length + 1}
      />

      {/* QUESTION BANK MODAL */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onAddQuestion={handleAddQuestion}
        onBatchAddQuestions={handleBatchAddQuestions}
        nextOrderNumber={activeQuiz.questions.length + 1}
      />
    </div>
  );
};
