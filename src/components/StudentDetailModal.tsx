import React, { useState } from 'react';
import { Exam, StudentResult } from '../types';
import { evaluateStudentPaper, getStudentSectionStats } from '../lib/omrEngine';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import { X, CheckCircle2, AlertCircle, HelpCircle, Save, Trash2, Printer, Layers } from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  result: StudentResult | null;
  onUpdated: () => void;
  onOpenReportCard: (result: StudentResult) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  exam,
  result,
  onUpdated,
  onOpenReportCard,
}) => {
  const { showToast } = useToast();

  if (!isOpen || !result) return null;

  const [studentName, setStudentName] = useState(result.studentName);
  const [studentNumber, setStudentNumber] = useState(result.studentNumber);
  const [booklet, setBooklet] = useState(result.booklet);
  const [answers, setAnswers] = useState<Record<number, string | null>>({ ...result.answers });

  const options = exam.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const bookletKey =
    exam.booklets.find((b) => b.booklet === booklet)?.answers || exam.booklets[0]?.answers || {};

  const hasSections = exam.sections && exam.sections.length > 0;

  // Compute live section stats based on current answers
  const liveResult: StudentResult = {
    ...result,
    studentName,
    studentNumber,
    booklet,
    answers,
  };

  // Handle manual answer override
  const handleOptionClick = (qNum: number, opt: string) => {
    setAnswers((prev) => {
      const current = prev[qNum];
      // If clicking already selected, toggle to blank
      const next = current === opt ? null : opt;
      return { ...prev, [qNum]: next };
    });
  };

  const handleSave = () => {
    // Re-evaluate using updated answers
    const reEvaluated = evaluateStudentPaper(
      exam,
      studentNumber,
      studentName,
      booklet,
      answers,
      result.imageUrl,
      result.confidenceScore,
      result.school || exam.school
    );
    // Preserve same result ID
    reEvaluated.id = result.id;
    reEvaluated.scannedAt = result.scannedAt;

    StorageService.saveResult(reEvaluated);
    showToast('Öğrenci kağıdı ve puanı güncellendi.', 'success');
    onUpdated();
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Bu öğrencinin sınav sonucunu silmek istediğinizden emin misiniz?')) {
      StorageService.deleteResult(result.id);
      showToast('Sonuç silindi.', 'info');
      onUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-2 sm:my-8 max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-start sm:items-center justify-between gap-2 bg-slate-50 shrink-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Öğrenci Optik Kağıdı İnceleme
              </h3>
              <span className="text-xs font-mono font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                No: {studentNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              İşaretlenen baloncukları kontrol edebilir, gerekirse elle şık düzeltmesi yapabilirsiniz.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top summary stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 px-4 sm:px-6 py-3 bg-slate-100/60 border-b border-slate-200 text-center text-xs shrink-0">
          <div>
            <span className="text-slate-500 block text-[11px]">Genel Toplam Puan</span>
            <span className="font-bold text-slate-900 text-sm font-mono tabular-nums">
              {result.totalScore}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Genel Net</span>
            <span className="font-bold text-indigo-700 text-sm font-mono tabular-nums">
              {result.netScore}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Doğru</span>
            <span className="font-bold text-emerald-600 text-sm font-mono tabular-nums">
              {result.correctCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Yanlış</span>
            <span className="font-bold text-rose-600 text-sm font-mono tabular-nums">
              {result.wrongCount}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Boş</span>
            <span className="font-bold text-slate-600 text-sm font-mono tabular-nums">
              {result.blankCount}
            </span>
          </div>
        </div>

        {/* Multi-Subject Breakdown Banner */}
        {hasSections && exam.sections && (
          <div className="px-6 py-2.5 bg-indigo-50/50 border-b border-indigo-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Ders Bazlı Sonuç Dağılımı:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {exam.sections.map((sec) => {
                const sStats = getStudentSectionStats(exam, liveResult, sec);
                return (
                  <div
                    key={sec.id}
                    className="bg-white border border-indigo-200 rounded-lg p-2 text-xs flex items-center justify-between shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{sec.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {sec.questionCount} Soru · {sStats.correct}D {sStats.wrong}Y {sStats.blank}B
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-indigo-700 font-mono block">
                        {sStats.net} Net
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600 font-mono">
                        {sStats.score} P
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 flex-1 min-h-0 overflow-y-auto">
          {/* Left: Scanned Optical Sheet Image / Preview */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-xs font-semibold text-slate-700 block">
              Taranan Optik Form Görüntüsü
            </span>
            <div className="bg-slate-100 border border-slate-300 rounded-lg p-2 flex items-center justify-center min-h-[300px] overflow-hidden">
              {result.imageUrl ? (
                <img
                  src={result.imageUrl}
                  alt="Öğrenci Optik Kağıdı"
                  className="max-h-[420px] w-auto object-contain rounded shadow-xs"
                />
              ) : (
                <div className="text-center text-slate-400 text-xs p-6">
                  <p>Optik form önizleme resmi mevcut değil.</p>
                </div>
              )}
            </div>

            {/* Editable student info inputs */}
            <div className="space-y-2 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600">Öğrenci Adı</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Öğrenci No</label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">Kitapçık</label>
                  <select
                    value={booklet}
                    onChange={(e) => setBooklet(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="A">Kitapçık A</option>
                    <option value="B">Kitapçık B</option>
                    <option value="C">Kitapçık C</option>
                    <option value="D">Kitapçık D</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Question By Question Marking Grid */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700">
                Soru ve Baloncuk Değerlendirme Tablosu
              </span>
              <span className="text-[11px] text-slate-400">
                (Düzeltmek için harfe tıklayınız)
              </span>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-[420px] overflow-y-auto">
              {hasSections && exam.sections ? (
                // Grouped by subject sections with 1..N numbering per subject
                exam.sections.map((sec) => (
                  <div key={sec.id} className="border-b last:border-b-0 border-slate-200">
                    <div className="bg-slate-100 px-3 py-1.5 font-bold text-slate-800 text-xs flex items-center justify-between sticky top-0 z-10 border-b border-slate-200">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                        {sec.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {sec.questionCount} Soru (1 - {sec.questionCount})
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {Array.from({ length: sec.questionCount }).map((_, rIdx) => {
                        const inSecNum = rIdx + 1;
                        const start = sec.startIndex ?? (sec.questionStart - 1);
                        const globalQNum = start + rIdx + 1;
                        const studentAns = answers[globalQNum] || null;
                        const correctAns = bookletKey[globalQNum] || 'A';
                        const isBlank = studentAns === null;
                        const isCorrect = !isBlank && studentAns === correctAns;

                        return (
                          <div
                            key={globalQNum}
                            className={`flex items-center justify-between px-3 py-1.5 text-xs ${
                              isBlank
                                ? 'bg-slate-50/50'
                                : isCorrect
                                ? 'bg-emerald-50/30'
                                : 'bg-rose-50/30'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 w-7">
                                {inSecNum}.
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (Doğru: <strong className="text-slate-700">{correctAns}</strong>)
                              </span>
                              <span className="text-[9px] font-mono text-slate-400">
                                #{globalQNum}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {options.map((opt) => {
                                const isStudentMarked = studentAns === opt;
                                let btnClass = 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100';

                                if (isStudentMarked) {
                                  if (isCorrect) {
                                    btnClass = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs';
                                  } else {
                                    btnClass = 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs';
                                  }
                                }

                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => handleOptionClick(globalQNum, opt)}
                                    className={`w-6 h-6 rounded-full border text-[11px] flex items-center justify-center transition-colors cursor-pointer ${btnClass}`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="w-16 text-right">
                              {isBlank && <span className="text-[11px] text-slate-400 font-medium">Boş</span>}
                              {!isBlank && isCorrect && (
                                <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Doğru
                                </span>
                              )}
                              {!isBlank && !isCorrect && (
                                <span className="text-[11px] text-rose-600 font-bold flex items-center justify-end gap-1">
                                  <AlertCircle className="w-3 h-3" /> Yanlış
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="divide-y divide-slate-100">
                  {Array.from({ length: exam.questionCount }).map((_, i) => {
                    const qNum = i + 1;
                    const studentAns = answers[qNum] || null;
                    const correctAns = bookletKey[qNum] || 'A';
                    const isBlank = studentAns === null;
                    const isCorrect = !isBlank && studentAns === correctAns;

                    return (
                      <div
                        key={qNum}
                        className={`flex items-center justify-between px-3 py-2 text-xs ${
                          isBlank
                            ? 'bg-slate-50/50'
                            : isCorrect
                            ? 'bg-emerald-50/30'
                            : 'bg-rose-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 w-6">
                            {qNum}.
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (Doğru: <strong className="text-slate-700">{correctAns}</strong>)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {options.map((opt) => {
                            const isStudentMarked = studentAns === opt;
                            let btnClass = 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100';

                            if (isStudentMarked) {
                              if (isCorrect) {
                                btnClass = 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs';
                              } else {
                                btnClass = 'bg-rose-600 border-rose-600 text-white font-bold shadow-xs';
                              }
                            }

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleOptionClick(qNum, opt)}
                                className={`w-6 h-6 rounded-full border text-[11px] flex items-center justify-center transition-colors cursor-pointer ${btnClass}`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>

                        <div className="w-16 text-right">
                          {isBlank && <span className="text-[11px] text-slate-400 font-medium">Boş</span>}
                          {!isBlank && isCorrect && (
                            <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Doğru
                            </span>
                          )}
                          {!isBlank && !isCorrect && (
                            <span className="text-[11px] text-rose-600 font-bold flex items-center justify-end gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Yanlış
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="w-full sm:w-auto min-h-[40px] justify-center text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Sonucu Sil
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenReportCard(result);
              }}
              className="w-full sm:w-auto min-h-[40px] justify-center px-4 py-2 border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              Öğrenci Karnesi Al
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto min-h-[40px] justify-center px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Değişiklikleri Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
