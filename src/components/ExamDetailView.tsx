import React, { useState } from 'react';
import { Exam, StudentResult, ItemAnalysisData, ExamSubjectSection } from '../types';
import { StorageService } from '../lib/storage';
import { computeItemAnalysis, getStudentSectionStats, SectionStudentStats } from '../lib/omrEngine';
import { useToast } from './Toast';
import {
  Camera,
  Download,
  Users,
  Award,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Printer,
  FileSpreadsheet,
  ArrowUpDown,
  BookOpen,
  Layers,
} from 'lucide-react';

interface ExamDetailViewProps {
  exam: Exam;
  onBack: () => void;
  onOpenOMRScanner: () => void;
  onSelectStudent: (result: StudentResult) => void;
  onOpenReportCard: (result: StudentResult) => void;
  onRefreshExam: () => void;
}

export const ExamDetailView: React.FC<ExamDetailViewProps> = ({
  exam,
  onBack,
  onOpenOMRScanner,
  onSelectStudent,
  onOpenReportCard,
  onRefreshExam,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'results' | 'analysis' | 'keys'>('results');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'score' | 'name' | 'number'>('score');
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');

  const results = StorageService.getResultsForExam(exam.id);
  const itemAnalysis = computeItemAnalysis(exam, results);

  const hasSections = !!(exam.sections && exam.sections.length > 0);
  const activeSection = hasSections
    ? exam.sections?.find((s) => s.id === selectedSectionId)
    : undefined;

  // Filter & sort results
  const filteredResults = results
    .filter(
      (r) =>
        r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.studentNumber.includes(searchQuery)
    )
    .sort((a, b) => {
      let valA: any = a.totalScore;
      let valB: any = b.totalScore;

      if (activeSection) {
        const sA = getStudentSectionStats(exam, a, activeSection);
        const sB = getStudentSectionStats(exam, b, activeSection);
        valA = sortField === 'score' ? sA.totalScore : sortField === 'name' ? a.studentName : a.studentNumber;
        valB = sortField === 'score' ? sB.totalScore : sortField === 'name' ? b.studentName : b.studentNumber;
      } else {
        valA = sortField === 'score' ? a.totalScore : sortField === 'name' ? a.studentName : a.studentNumber;
        valB = sortField === 'score' ? b.totalScore : sortField === 'name' ? b.studentName : b.studentNumber;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

  // Calculate KPIs (Overall or Section-Specific)
  const paperCount = filteredResults.length;
  let avgScore = 0;
  let avgNet = 0;
  let maxScore = 0;
  let minScore = 0;
  let passRate = 0;

  if (paperCount > 0) {
    if (activeSection) {
      const secScores = filteredResults.map((r) => getStudentSectionStats(exam, r, activeSection));
      const totalSecScore = secScores.reduce((sum, s) => sum + s.totalScore, 0);
      const totalSecNet = secScores.reduce((sum, s) => sum + s.netScore, 0);
      avgScore = parseFloat((totalSecScore / paperCount).toFixed(1));
      avgNet = parseFloat((totalSecNet / paperCount).toFixed(2));
      maxScore = Math.max(...secScores.map((s) => s.totalScore));
      minScore = Math.min(...secScores.map((s) => s.totalScore));
      const passTarget = (activeSection.questionCount * (100 / exam.questionCount)) * 0.5;
      const passing = secScores.filter((s) => s.totalScore >= passTarget).length;
      passRate = Math.round((passing / paperCount) * 100);
    } else {
      const totalScoreSum = filteredResults.reduce((sum, r) => sum + r.totalScore, 0);
      const totalNetSum = filteredResults.reduce((sum, r) => sum + r.netScore, 0);
      avgScore = parseFloat((totalScoreSum / paperCount).toFixed(1));
      avgNet = parseFloat((totalNetSum / paperCount).toFixed(2));
      maxScore = Math.max(...filteredResults.map((r) => r.totalScore));
      minScore = Math.min(...filteredResults.map((r) => r.totalScore));
      const passing = filteredResults.filter((r) => r.totalScore >= 50).length;
      passRate = Math.round((passing / paperCount) * 100);
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (results.length === 0) {
      showToast('Dışa aktarılacak öğrenci sonucu bulunmuyor.', 'info');
      return;
    }

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (hasSections && exam.sections) {
      headers = [
        'Sira',
        'Ogrenci No',
        'Adi Soyadi',
        'Kitapcik',
        ...exam.sections.flatMap((s) => [
          `${s.name} Dogru`,
          `${s.name} Yanlis`,
          `${s.name} Bos`,
          `${s.name} Net`,
          `${s.name} Puan`,
        ]),
        'Genel Toplam Net',
        'Genel Toplam Puan',
      ];

      rows = filteredResults.map((r, i) => {
        const secValues = exam.sections!.flatMap((s) => {
          const st = getStudentSectionStats(exam, r, s);
          return [st.correctCount, st.wrongCount, st.blankCount, st.netScore, st.totalScore];
        });

        return [
          i + 1,
          `"${r.studentNumber}"`,
          `"${r.studentName}"`,
          r.booklet,
          ...secValues,
          r.netScore,
          r.totalScore,
        ];
      });
    } else {
      headers = ['Sira', 'Ogrenci No', 'Adi Soyadi', 'Kitapcik', 'Dogru', 'Yanlis', 'Bos', 'Net', 'Toplam Puan'];
      rows = filteredResults.map((r, i) => [
        i + 1,
        `"${r.studentNumber}"`,
        `"${r.studentName}"`,
        r.booklet,
        r.correctCount,
        r.wrongCount,
        r.blankCount,
        r.netScore,
        r.totalScore,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${exam.title.replace(/\s+/g, '_')}_Sonuclari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Öğrenci sonuçları ders bazlı olarak Excel / CSV indirildi.', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={onBack}
              className="hover:text-indigo-600 transition-colors font-medium cursor-pointer"
            >
              ← Sınavlarım
            </button>
            <span>/</span>
            <span>{exam.subject}</span>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{exam.gradeLevel}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">{exam.title}</h1>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-slate-500">
            <span>{exam.questionCount} Soru</span>
            <span aria-hidden="true">·</span>
            <span>{exam.optionCount} Şık ({exam.optionCount === 5 ? 'A-E' : 'A-D'})</span>
            <span aria-hidden="true">·</span>
            <span>
              {exam.scoringType === 'equal'
                ? `Eşit Puan (${(100 / exam.questionCount).toFixed(1)} Puan/Soru)`
                : 'Soru Bazlı Özel Puan'}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {exam.penalty === '3to1'
                ? `3 Yanlış 1 Doğru (${exam.penaltyMode === 'floor' ? 'Tam Kural' : 'Kesirli Net'})`
                : exam.penalty === '4to1'
                ? `4 Yanlış 1 Doğru (${exam.penaltyMode === 'floor' ? 'Tam Kural' : 'Kesirli Net'})`
                : 'Yanlış Cezası Yok'}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0">
          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto px-3.5 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs min-h-[42px] cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV İndir</span>
          </button>

          <button
            onClick={onOpenOMRScanner}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[42px]"
          >
            <Camera className="w-4 h-4" />
            <span>Optik Kağıt Oku (OMR)</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-1">Değerlendirilen Kağıt</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {paperCount}
            </span>
            <span className="text-xs text-slate-400">öğrenci</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-1">Sınıf Ortalaması</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-indigo-700 font-mono tabular-nums">
              {avgScore}
            </span>
            <span className="text-xs text-slate-400">/ 100</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-1">Ortalama Net</span>
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-800 font-mono tabular-nums">
              {avgNet}
            </span>
            <span className="text-xs text-slate-400">net</span>
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-1">En Yüksek Not</span>
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl font-bold text-emerald-600 font-mono tabular-nums">
              {maxScore}
            </span>
            <span className="text-[11px] text-slate-400">Min: {minScore}</span>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] sm:text-xs text-slate-500 font-medium block mb-1">Başarı Oranı</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
              %{passRate}
            </span>
            <span className="text-xs text-slate-400">(≥ 50 Puan)</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-3 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-5 sm:gap-6 text-xs font-semibold min-w-max">
            <button
              onClick={() => setActiveTab('results')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'results'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Öğrenci Not Çizelgesi ({paperCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('analysis')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'analysis'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Madde & Çeldirici Analizi</span>
            </button>

            <button
              onClick={() => setActiveTab('keys')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'keys'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Cevap Anahtarı ({exam.booklets.length} Kitapçık)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: ÖĞRENCİ SONUÇLARI */}
        {activeTab === 'results' && (
          <div>
            {/* Subject Section Selection Tabs */}
            {hasSections && exam.sections && (
              <div className="p-3 bg-indigo-50/60 border-b border-indigo-100 flex items-center gap-2 overflow-x-auto text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5 shrink-0 pr-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Ders İnceleme Filtresi:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSectionId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedSectionId === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  Genel Toplam (Tüm Sınav)
                </button>
                {exam.sections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                      selectedSectionId === sec.id
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <span>{sec.name}</span>
                    <span className="text-[10px] font-mono opacity-80">({sec.questionCount} Soru)</span>
                  </button>
                ))}
              </div>
            )}

            {/* Filter & Search Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="İsim veya Öğrenci No ile ara..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500">Sırala:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white focus:outline-none"
                >
                  <option value="score">Puana Göre</option>
                  <option value="name">İsme Göre</option>
                  <option value="number">Öğrenci No</option>
                </select>
                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white hover:bg-slate-100"
                  title="Sıralama yönünü değiştir"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Table */}
            {filteredResults.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Camera className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  Henüz Okunmuş Kağıt Bulunmuyor
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Öğrencilerinizin optik cevap formlarını kamerayla okutun veya toplu fotoğraf
                  yükleyerek anında puanlayın.
                </p>
                <button
                  onClick={onOpenOMRScanner}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                >
                  İlk Kağıdı Oku / Tara
                </button>
              </div>
            ) : (
              <>
                {/* Mobile Card View (< md) */}
                <div className="md:hidden divide-y divide-slate-100">
                  {filteredResults.map((item, idx) => {
                    const secStat = activeSection ? getStudentSectionStats(exam, item, activeSection) : null;
                    const displayScore = secStat ? secStat.totalScore : item.totalScore;
                    const displayNet = secStat ? secStat.netScore : item.netScore;
                    const displayCorrect = secStat ? secStat.correctCount : item.correctCount;
                    const displayWrong = secStat ? secStat.wrongCount : item.wrongCount;
                    const displayBlank = secStat ? secStat.blankCount : item.blankCount;

                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectStudent(item)}
                        className="p-4 space-y-2.5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                              <span className="font-bold text-slate-400">#{idx + 1}</span>
                              <span>·</span>
                              <span className="font-bold text-slate-700">No: {item.studentNumber}</span>
                              <span>·</span>
                              <span>Kitapçık {item.booklet}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 text-sm truncate mt-0.5">
                              {item.studentName}
                            </h4>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-extrabold font-mono tabular-nums text-indigo-700 block leading-tight">
                              {displayScore}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Puan</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2.5 text-xs font-mono">
                            <span className="text-emerald-600 font-bold">{displayCorrect}D</span>
                            <span className="text-rose-600 font-bold">{displayWrong}Y</span>
                            <span className="text-slate-400">{displayBlank}B</span>
                            <span className="text-indigo-700 font-bold">{displayNet} Net</span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onSelectStudent(item)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 cursor-pointer min-h-[36px]"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>İncele</span>
                            </button>
                            <button
                              onClick={() => onOpenReportCard(item)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1 cursor-pointer min-h-[36px]"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Karne</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View (md+) */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                      <th className="py-3 px-4 w-12 text-center">Sıra</th>
                      <th className="py-3 px-4">Öğrenci No</th>
                      <th className="py-3 px-4">Adı Soyadı</th>
                      <th className="py-3 px-4 text-center">Kitapçık</th>

                      {activeSection ? (
                        <>
                          <th className="py-3 px-4 text-center text-emerald-700">{activeSection.name} Doğru</th>
                          <th className="py-3 px-4 text-center text-rose-700">{activeSection.name} Yanlış</th>
                          <th className="py-3 px-4 text-center text-slate-500">{activeSection.name} Boş</th>
                          <th className="py-3 px-4 text-center text-indigo-700">{activeSection.name} Net</th>
                          <th className="py-3 px-4 text-right">{activeSection.name} Puanı</th>
                        </>
                      ) : (
                        <>
                          {hasSections && exam.sections ? (
                            <>
                              {exam.sections.map((s) => (
                                <th key={s.id} className="py-3 px-3 text-center bg-indigo-50/30 text-indigo-900 font-bold whitespace-nowrap">
                                  {s.name} Net
                                </th>
                              ))}
                              <th className="py-3 px-4 text-center text-emerald-700 font-bold">Top. Doğru</th>
                              <th className="py-3 px-4 text-center text-rose-700 font-bold">Top. Yanlış</th>
                              <th className="py-3 px-4 text-center font-bold text-indigo-700">Genel Net</th>
                              <th className="py-3 px-4 text-right font-bold">Toplam Puan</th>
                            </>
                          ) : (
                            <>
                              <th className="py-3 px-4 text-center">Doğru</th>
                              <th className="py-3 px-4 text-center">Yanlış</th>
                              <th className="py-3 px-4 text-center">Boş</th>
                              <th className="py-3 px-4 text-center">Net</th>
                              <th className="py-3 px-4 text-right">Toplam Puan</th>
                            </>
                          )}
                        </>
                      )}

                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {filteredResults.map((item, idx) => {
                      const secStat = activeSection ? getStudentSectionStats(exam, item, activeSection) : null;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                          onClick={() => onSelectStudent(item)}
                        >
                          <td className="py-3 px-4 text-center text-slate-400 font-sans">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.studentNumber}</td>
                          <td className="py-3 px-4 font-sans font-semibold text-slate-800 group-hover:text-indigo-600">
                            {item.studentName}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[11px]">
                              {item.booklet}
                            </span>
                          </td>

                          {activeSection && secStat ? (
                            <>
                              <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                                {secStat.correctCount}
                              </td>
                              <td className="py-3 px-4 text-center text-rose-600 font-bold">
                                {secStat.wrongCount}
                              </td>
                              <td className="py-3 px-4 text-center text-slate-500">{secStat.blankCount}</td>
                              <td className="py-3 px-4 text-center font-bold text-indigo-700">
                                {secStat.netScore}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-sm text-slate-900 tabular-nums">
                                {secStat.totalScore}
                              </td>
                            </>
                          ) : (
                            <>
                              {hasSections && exam.sections ? (
                                <>
                                  {exam.sections.map((s) => {
                                    const sStat = getStudentSectionStats(exam, item, s);
                                    return (
                                      <td key={s.id} className="py-3 px-3 text-center bg-indigo-50/10 font-bold text-indigo-900">
                                        {sStat.netScore}
                                      </td>
                                    );
                                  })}
                                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                                    {item.correctCount}
                                  </td>
                                  <td className="py-3 px-4 text-center text-rose-600 font-bold">
                                    {item.wrongCount}
                                  </td>
                                  <td className="py-3 px-4 text-center font-bold text-indigo-700">
                                    {item.netScore}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-sm text-slate-900 tabular-nums">
                                    {item.totalScore}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="py-3 px-4 text-center text-emerald-600 font-bold">
                                    {item.correctCount}
                                  </td>
                                  <td className="py-3 px-4 text-center text-rose-600 font-bold">
                                    {item.wrongCount}
                                  </td>
                                  <td className="py-3 px-4 text-center text-slate-500">{item.blankCount}</td>
                                  <td className="py-3 px-4 text-center font-bold text-indigo-700">
                                    {item.netScore}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-sm text-slate-900 tabular-nums">
                                    {item.totalScore}
                                  </td>
                                </>
                              )}
                            </>
                          )}
                        <td className="py-3 px-4 text-right font-sans" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onSelectStudent(item)}
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded"
                              title="Optik Kağıdı İncele & Düzelt"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenReportCard(item)}
                              className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded"
                              title="Öğrenci Karnesi Yazdır"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: MADDE & ÇELDİRİCİ ANALİZİ */}
        {activeTab === 'analysis' && (
          <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Madde Analizi & Çeldirici Raporu
                </h3>
                <p className="text-xs text-slate-500">
                  Her sorunun sınıf genelinde doğru yapılma oranı ve en çok tuzağa düşülen çeldirici
                  şıklar.
                </p>
              </div>

              {hasSections && exam.sections && (
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                  <button
                    type="button"
                    onClick={() => setSelectedSectionId('all')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      selectedSectionId === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Tüm Dersler
                  </button>
                  {exam.sections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setSelectedSectionId(sec.id)}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                        selectedSectionId === sec.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sec.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-3 px-4 w-28">Soru No</th>
                    {hasSections && <th className="py-3 px-3">Ders</th>}
                    <th className="py-3 px-4 text-center">Doğru Yanıt</th>
                    <th className="py-3 px-4 text-center">Puan Değeri</th>
                    <th className="py-3 px-4">Başarı Grafiği (%)</th>
                    <th className="py-3 px-4 text-center">Doğru / Yanlış / Boş</th>
                    <th className="py-3 px-4">Şık Dağılımı</th>
                    <th className="py-3 px-4 text-center">En Çok Düşülen Çeldirici</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {itemAnalysis
                    .filter((item) => {
                      if (!activeSection) return true;
                      return (
                        item.questionNumber >= activeSection.questionStart &&
                        item.questionNumber <= activeSection.questionEnd
                      );
                    })
                    .map((item) => {
                      const itemSec = exam.sections?.find(
                        (s) =>
                          item.questionNumber >= s.questionStart && item.questionNumber <= s.questionEnd
                      );
                      const inSecNum = itemSec
                        ? item.questionNumber - itemSec.questionStart + 1
                        : item.questionNumber;

                      return (
                        <tr key={item.questionNumber} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>
                              <span>Soru {inSecNum}</span>
                              {itemSec && (
                                <span className="text-[10px] text-slate-400 block font-normal">
                                  (Genel #{item.questionNumber})
                                </span>
                              )}
                            </div>
                          </td>
                          {hasSections && (
                            <td className="py-3 px-3 font-sans">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[11px]">
                                {itemSec?.name || exam.subject}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4 text-center font-bold text-indigo-700">
                            {item.correctAnswer}
                          </td>
                          <td className="py-3 px-4 text-center tabular-nums">{item.points.toFixed(1)}</td>
                          <td className="py-3 px-4 font-sans">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden w-28">
                                <div
                                  className={`h-full rounded-full ${
                                    item.successRate >= 70
                                      ? 'bg-emerald-500'
                                      : item.successRate >= 40
                                      ? 'bg-amber-500'
                                      : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${item.successRate}%` }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[11px] tabular-nums w-10">
                                %{item.successRate}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-[11px]">
                            <span className="text-emerald-600 font-bold">{item.correctCount} D</span>
                            {' · '}
                            <span className="text-rose-600 font-bold">{item.wrongCount} Y</span>
                            {' · '}
                            <span className="text-slate-400">{item.blankCount} B</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-[10px] text-slate-600">
                            {Object.entries(item.optionDistribution)
                              .map(([opt, count]) => `${opt}:${count}`)
                              .join('  ')}
                          </td>
                          <td className="py-3 px-4 text-center font-sans">
                            {item.mostCommonDistractor ? (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                {item.mostCommonDistractor} Şıkkı
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CEVAP ANAHTARI GÖRÜNTÜLEME */}
        {activeTab === 'keys' && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Tanımlı Cevap Anahtarları</h3>
                <p className="text-xs text-slate-500">
                  Bu sınavda kullanılan kitapçıklar ve doğru şık eşleşmeleri.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {exam.booklets.map((bObj) => (
                <div key={bObj.booklet} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                    <span className="font-bold text-slate-900 text-sm">
                      Kitapçık {bObj.booklet}
                    </span>
                    <span className="text-xs text-indigo-700 font-semibold font-mono">
                      {exam.questionCount} Soru
                    </span>
                  </div>

                  {hasSections && exam.sections ? (
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {exam.sections.map((sec, sIdx) => (
                        <div key={sec.id} className="p-2.5 bg-white rounded border border-slate-200">
                          <div className="font-bold text-xs text-slate-800 pb-1 mb-2 border-b border-slate-100 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px]">
                                {sIdx + 1}
                              </span>
                              {sec.name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {sec.questionCount} Soru (1 - {sec.questionCount})
                            </span>
                          </div>
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                            {Array.from({ length: sec.questionCount }).map((_, rIdx) => {
                              const qNum = sec.questionStart + rIdx;
                              const inSec = rIdx + 1;
                              const ans = bObj.answers[qNum] || '-';
                              return (
                                <div
                                  key={qNum}
                                  className="bg-slate-50 p-1.5 rounded text-center border border-slate-200 font-mono"
                                  title={`${sec.name} ${inSec}. Soru`}
                                >
                                  <span className="text-[9px] text-slate-400 block font-sans">
                                    S{inSec}
                                  </span>
                                  <span className="font-bold text-xs text-indigo-700">{ans}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-5 gap-2 max-h-72 overflow-y-auto">
                      {Array.from({ length: exam.questionCount }).map((_, i) => {
                        const qNum = i + 1;
                        const ans = bObj.answers[qNum] || '-';
                        return (
                          <div
                            key={qNum}
                            className="bg-white p-2 rounded border border-slate-200 text-center font-mono"
                          >
                            <span className="text-[10px] text-slate-400 block">S{qNum}</span>
                            <span className="font-bold text-sm text-indigo-700">{ans}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
