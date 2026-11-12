import React, { useState } from 'react';
import { Exam } from '../types';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import {
  Plus,
  Printer,
  Search,
  BookOpen,
  Camera,
  Users,
  Award,
  ChevronRight,
  Trash2,
  Sparkles,
  FileText,
  Crop,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

interface ExamListViewProps {
  exams: Exam[];
  onSelectExam: (exam: Exam) => void;
  onOpenCreateExam: () => void;
  onNavigateToBubbleSheets: () => void;
  onNavigateToQuizBuilder?: () => void;
  onRefreshExams: () => void;
}

export const ExamListView: React.FC<ExamListViewProps> = ({
  exams,
  onSelectExam,
  onOpenCreateExam,
  onNavigateToBubbleSheets,
  onNavigateToQuizBuilder,
  onRefreshExams,
}) => {
  const { currentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [showAllExams, setShowAllExams] = useState(false);

  // Filter exams by creator: Teachers only see their own exams!
  const userExams = exams.filter((e) => {
    if (isAdmin && showAllExams) return true;
    return e.creatorId === currentUser?.id;
  });

  const filteredExams = userExams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || e.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleDelete = (e: React.MouseEvent, exam: Exam) => {
    e.stopPropagation();
    if (window.confirm(`"${exam.title}" sınavını ve tüm sonuçlarını silmek istediğinize emin misiniz?`)) {
      StorageService.deleteExam(exam.id);
      showToast('Sınav başarıyla silindi.', 'info');
      onRefreshExams();
    }
  };

  const handleResetDemo = () => {
    if (window.confirm('Demo verileri baştan yüklemek istiyor musunuz?')) {
      StorageService.resetDemoData();
      showToast('Demo veriler sıfırlandı.', 'success');
      onRefreshExams();
    }
  };

  const subjects = ['all', ...Array.from(new Set(userExams.map((e) => e.subject)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Yapay Zeka Destekli Optik Sınav Değerlendirme
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            testimgeldi ile Sınav Kağıtlarını Saniyeler İçinde Okuyun
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed mb-6">
            Öğretmenler için optik form oluşturucu, cevap anahtarı tanımlama ve telefon kamerasıyla
            veya tarayıcıyla otomatik kağıt değerlendirme sistemi.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCreateExam}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Sınav Oluştur
            </button>
            {onNavigateToQuizBuilder && (
              <button
                onClick={onNavigateToQuizBuilder}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                <Crop className="w-4 h-4" />
                Test & Quiz Kağıdı Hazırla
              </button>
            )}
            <button
              onClick={onNavigateToBubbleSheets}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-lg border border-white/15 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Optik Form Şablonu Yazdır
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sınav adı ile ara..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowAllExams(!showAllExams)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border whitespace-nowrap transition-colors cursor-pointer ${
                showAllExams
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
              title="Yönetici görünümü: Diğer öğretmenlerin sınavlarını da gör"
            >
              {showAllExams ? 'Tüm Sınavlar' : 'Sadece Benimkiler'}
            </button>
          )}
        </div>

        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedSubject === sub
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {sub === 'all' ? 'Tüm Dersler' : sub}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      {filteredExams.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">Kayıtlı Sınav Bulunamadı</h3>
          <p className="text-xs text-slate-500 mb-4">
            Arama kriterlerinize uygun sınav bulunamadı veya henüz sınav oluşturmadınız.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={onOpenCreateExam}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
            >
              Yeni Sınav Oluştur
            </button>
            <button
              onClick={handleResetDemo}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
            >
              Örnek Sınavı Yükle
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <div
              key={exam.id}
              onClick={() => onSelectExam(exam)}
              className="bg-white rounded-xl border border-slate-200 hover:border-indigo-400 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Subject & Delete */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    {exam.subject} · {exam.gradeLevel}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, exam)}
                    className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                    title="Sınavı Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Exam Title */}
                <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors mb-3 line-clamp-2">
                  {exam.title}
                </h3>

                {/* Metadata row */}
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                  <span>{exam.questionCount} Soru</span>
                  <span aria-hidden="true">·</span>
                  <span>{exam.optionCount} Şık</span>
                  <span aria-hidden="true">·</span>
                  <span>{exam.booklets.length} Kitapçık ({exam.booklets.map(b => b.booklet).join('/')})</span>
                </div>
              </div>

              {/* Card Footer: Papers Count & Average Score */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold font-mono">{exam.totalPaperCount}</span>
                    <span className="text-[11px] text-slate-400">kağıt</span>
                  </div>

                  {exam.totalPaperCount > 0 && (
                    <div className="flex items-center gap-1 text-emerald-700">
                      <Award className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-bold font-mono">{exam.averageScore}</span>
                      <span className="text-[11px] text-slate-400">ort.</span>
                    </div>
                  )}
                </div>

                <div className="text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Sınavı Aç</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
