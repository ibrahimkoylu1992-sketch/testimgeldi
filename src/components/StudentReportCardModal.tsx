import React from 'react';
import { Exam, StudentResult } from '../types';
import { Printer, X, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface StudentReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  result: StudentResult | null;
  classAverage?: number;
}

export const StudentReportCardModal: React.FC<StudentReportCardModalProps> = ({
  isOpen,
  onClose,
  exam,
  result,
  classAverage = 75,
}) => {
  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const bookletKey =
    exam.booklets.find((b) => b.booklet === result.booklet)?.answers || exam.booklets[0]?.answers || {};

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-2 sm:my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls (no-print) */}
        <div className="no-print px-4 sm:px-6 py-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50">
          <span className="text-xs font-bold text-slate-800 truncate">
            Öğrenci Sınav Sonuç Belgesi (Karne)
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 min-h-[36px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Yazdır / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Report Card Sheet */}
        <div className="p-4 sm:p-8 print:p-4 text-slate-900">
          {/* Header */}
          <div className="text-center pb-4 border-b-2 border-slate-900 mb-5 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5">
              <span className="text-xs font-mono font-bold tracking-widest text-indigo-600">
                testimgeldi OMR
              </span>
              <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-tight text-slate-900">
                SINAV SONUÇ BELGESİ
              </h1>
              <span className="text-xs font-mono text-slate-500">
                {new Date(result.scannedAt).toLocaleDateString('tr-TR')}
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-1">{exam.title}</p>
          </div>

          {/* Student & Exam Details Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 border border-slate-300 bg-slate-50/50 rounded-lg mb-5 sm:mb-6 text-xs">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Öğrenci Adı Soyadı:</span>{' '}
                <strong className="text-slate-900 text-sm">{result.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Öğrenci Numarası:</span>{' '}
                <strong className="font-mono text-slate-900">{result.studentNumber}</strong>
              </div>
              <div>
                <span className="text-slate-500">Ders / Branş:</span>{' '}
                <span className="font-medium text-slate-800">{exam.subject}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Kitapçık Türü:</span>{' '}
                <strong className="text-indigo-700 font-bold">{result.booklet} Kitapçığı</strong>
              </div>
              <div>
                <span className="text-slate-500">Soru Sayısı:</span>{' '}
                <span className="font-medium text-slate-800">{exam.questionCount} Soru</span>
              </div>
              <div>
                <span className="text-slate-500">Değerlendirme:</span>{' '}
                <span className="font-medium text-slate-800">
                  {exam.penalty === '3to1'
                    ? `3 Yanlış 1 Doğru (${exam.penaltyMode === 'floor' ? 'Tam Kural' : 'Kesirli Net'})`
                    : exam.penalty === '4to1'
                    ? `4 Yanlış 1 Doğru (${exam.penaltyMode === 'floor' ? 'Tam Kural' : 'Kesirli Net'})`
                    : 'Yanlış Cezası Yok'}
                </span>
              </div>
            </div>
          </div>

          {/* Scores KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3 mb-5 sm:mb-6 text-center">
            <div className="col-span-2 sm:col-span-1 p-3 border border-indigo-200 bg-indigo-50/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-indigo-700 block mb-0.5">
                Toplam Puan
              </span>
              <span className="text-xl font-black text-indigo-900 font-mono tabular-nums">
                {result.totalScore}
              </span>
            </div>

            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                Net Sayısı
              </span>
              <span className="text-xl font-bold text-slate-800 font-mono tabular-nums">
                {result.netScore}
              </span>
            </div>

            <div className="p-3 border border-emerald-200 bg-emerald-50/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">
                Doğru
              </span>
              <span className="text-xl font-bold text-emerald-800 font-mono tabular-nums">
                {result.correctCount}
              </span>
            </div>

            <div className="p-3 border border-rose-200 bg-rose-50/40 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-rose-700 block mb-0.5">
                Yanlış
              </span>
              <span className="text-xl font-bold text-rose-800 font-mono tabular-nums">
                {result.wrongCount}
              </span>
            </div>

            <div className="p-3 border border-slate-200 bg-slate-50 rounded-lg">
              <span className="text-[10px] uppercase font-bold text-slate-600 block mb-0.5">
                Boş
              </span>
              <span className="text-xl font-bold text-slate-800 font-mono tabular-nums">
                {result.blankCount}
              </span>
            </div>
          </div>

          {/* Class comparison progress bar */}
          <div className="mb-6 p-4 border border-slate-200 rounded-lg bg-white text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-slate-600 font-medium">Sınıf Ortalaması Kıyaslaması:</span>
              <span className="text-slate-800">
                Öğrenci: <strong className="font-mono">{result.totalScore}</strong> / Sınıf Ortalaması:{' '}
                <strong className="font-mono">{classAverage.toFixed(1)}</strong>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden relative">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${Math.min(100, result.totalScore)}%` }}
              />
              {/* marker for class avg */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-slate-900"
                style={{ left: `${Math.min(100, classAverage)}%` }}
                title={`Sınıf Ort: ${classAverage}`}
              />
            </div>
          </div>

          {/* DERS BAZLI BAŞARI VE NET TABLOSU (Çoklu Sınav ise) */}
          {exam.sections && exam.sections.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
                <span>Ders Bazlı Başarı ve Net Çizelgesi</span>
              </h3>
              <div className="border border-slate-300 rounded-lg overflow-x-auto text-xs">
                <table className="w-full min-w-[540px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700 text-[11px]">
                      <th className="py-2 px-3">Ders / Branş</th>
                      <th className="py-2 px-2 text-center">Soru</th>
                      <th className="py-2 px-2 text-center text-emerald-700">Doğru</th>
                      <th className="py-2 px-2 text-center text-rose-700">Yanlış</th>
                      <th className="py-2 px-2 text-center text-slate-600">Boş</th>
                      <th className="py-2 px-2 text-center text-indigo-700 font-bold">Net</th>
                      <th className="py-2 px-2 text-center">Başarı %</th>
                      <th className="py-2 px-3 text-right">Puan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {exam.sections.map((sec) => {
                      let correct = 0;
                      let wrong = 0;
                      let blank = 0;
                      let earnedPoints = 0;
                      const qCount = sec.questionCount;
                      const defaultQPoint = 100 / exam.questionCount;

                      for (let i = 0; i < qCount; i++) {
                        const start = sec.startIndex ?? (sec.questionStart - 1);
                        const globalQ = start + i + 1;
                        const sAns = result.answers[globalQ] || null;
                        const cAns = bookletKey[globalQ] || 'A';
                        const pts = exam.questionPoints[globalQ] ?? defaultQPoint;

                        if (sAns === null) {
                          blank++;
                        } else if (sAns === cAns) {
                          correct++;
                          earnedPoints += pts;
                        } else {
                          wrong++;
                        }
                      }

                      let penaltyDeduction = 0;
                      if (exam.penalty === '3to1') {
                        penaltyDeduction = exam.penaltyMode === 'floor' ? Math.floor(wrong / 3) : wrong / 3;
                      } else if (exam.penalty === '4to1') {
                        penaltyDeduction = exam.penaltyMode === 'floor' ? Math.floor(wrong / 4) : wrong / 4;
                      }
                      const net = Math.max(0, correct - penaltyDeduction);
                      const successRate = qCount > 0 ? (correct / qCount) * 100 : 0;

                      return (
                        <tr key={sec.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-3 font-bold font-sans text-slate-900">{sec.name}</td>
                          <td className="py-1.5 px-2 text-center">{qCount}</td>
                          <td className="py-1.5 px-2 text-center text-emerald-700 font-bold">{correct}</td>
                          <td className="py-1.5 px-2 text-center text-rose-700 font-bold">{wrong}</td>
                          <td className="py-1.5 px-2 text-center text-slate-500">{blank}</td>
                          <td className="py-1.5 px-2 text-center text-indigo-700 font-black">{net.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-center">%{successRate.toFixed(1)}</td>
                          <td className="py-1.5 px-3 text-right font-bold text-slate-900">{earnedPoints.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-100/80 font-bold border-t-2 border-slate-300">
                      <td className="py-2 px-3 font-sans text-slate-900">GENEL TOPLAM</td>
                      <td className="py-2 px-2 text-center">{exam.questionCount}</td>
                      <td className="py-2 px-2 text-center text-emerald-700">{result.correctCount}</td>
                      <td className="py-2 px-2 text-center text-rose-700">{result.wrongCount}</td>
                      <td className="py-2 px-2 text-center text-slate-500">{result.blankCount}</td>
                      <td className="py-2 px-2 text-center text-indigo-800 font-black">{result.netScore}</td>
                      <td className="py-2 px-2 text-center">
                        %{exam.questionCount > 0 ? ((result.correctCount / exam.questionCount) * 100).toFixed(1) : 0}
                      </td>
                      <td className="py-2 px-3 text-right text-indigo-900 font-black">{result.totalScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Soru Bazlı Cevap Tablosu */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Soru Bazlı Yanıt ve Çözüm Tablosu
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-x-auto text-xs">
              <table className="w-full min-w-[460px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 font-semibold text-slate-700">
                    <th className="py-2 px-3">Soru No</th>
                    <th className="py-2 px-3 text-center">Öğrenci Yanıtı</th>
                    <th className="py-2 px-3 text-center">Doğru Yanıt</th>
                    <th className="py-2 px-3 text-center">Durum</th>
                    <th className="py-2 px-3 text-right">Kazanılan Puan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {exam.sections && exam.sections.length > 0 ? (
                    // Section-grouped rows with 1..N per section
                    exam.sections.flatMap((sec) => {
                      const headerRow = (
                        <tr key={`sec-header-${sec.id}`} className="bg-slate-200/80 font-sans font-bold text-slate-800 border-y border-slate-300">
                          <td colSpan={5} className="py-1.5 px-3 text-[11px] tracking-wide">
                            📚 {sec.name} ({sec.questionCount} Soru · Sorular 1 - {sec.questionCount})
                          </td>
                        </tr>
                      );

                      const questionRows = Array.from({ length: sec.questionCount }).map((_, rIdx) => {
                        const inSecNum = rIdx + 1;
                        const start = sec.startIndex ?? (sec.questionStart - 1);
                        const globalQ = start + rIdx + 1;
                        const studentAns = result.answers[globalQ] || null;
                        const correctAns = bookletKey[globalQ] || 'A';
                        const isBlank = studentAns === null;
                        const isCorrect = !isBlank && studentAns === correctAns;
                        const qPoints = exam.questionPoints[globalQ] ?? (100 / exam.questionCount);

                        return (
                          <tr key={globalQ} className={isCorrect ? 'bg-emerald-50/20' : isBlank ? '' : 'bg-rose-50/20'}>
                            <td className="py-1.5 px-3 font-semibold text-slate-900">
                              <span className="font-sans font-bold mr-1">{sec.name}</span>
                              <span className="font-mono">Soru {inSecNum}</span>
                              <span className="text-[10px] text-slate-400 font-sans ml-1">(Genel #{globalQ})</span>
                            </td>
                            <td className="py-1.5 px-3 text-center font-bold">
                              {studentAns || <span className="text-slate-400 font-normal">Boş</span>}
                            </td>
                            <td className="py-1.5 px-3 text-center text-indigo-700 font-bold">
                              {correctAns}
                            </td>
                            <td className="py-1.5 px-3 text-center">
                              {isCorrect && (
                                <span className="text-emerald-700 font-bold font-sans text-[11px]">
                                  Doğru
                                </span>
                              )}
                              {!isCorrect && !isBlank && (
                                <span className="text-rose-700 font-bold font-sans text-[11px]">
                                  Yanlış
                                </span>
                              )}
                              {isBlank && (
                                <span className="text-slate-400 font-sans text-[11px]">Boş</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-right tabular-nums">
                              {isCorrect ? qPoints.toFixed(1) : '0.0'}
                            </td>
                          </tr>
                        );
                      });

                      return [headerRow, ...questionRows];
                    })
                  ) : (
                    Array.from({ length: exam.questionCount }).map((_, i) => {
                      const qNum = i + 1;
                      const studentAns = result.answers[qNum] || null;
                      const correctAns = bookletKey[qNum] || 'A';
                      const isBlank = studentAns === null;
                      const isCorrect = !isBlank && studentAns === correctAns;
                      const qPoints = exam.questionPoints[qNum] ?? (100 / exam.questionCount);

                      return (
                        <tr key={qNum} className={isCorrect ? 'bg-emerald-50/20' : isBlank ? '' : 'bg-rose-50/20'}>
                          <td className="py-1.5 px-3 font-semibold text-slate-900">{qNum}. Soru</td>
                          <td className="py-1.5 px-3 text-center font-bold">
                            {studentAns || <span className="text-slate-400 font-normal">Boş</span>}
                          </td>
                          <td className="py-1.5 px-3 text-center text-indigo-700 font-bold">
                            {correctAns}
                          </td>
                          <td className="py-1.5 px-3 text-center">
                            {isCorrect && (
                              <span className="text-emerald-700 font-bold font-sans text-[11px]">
                                Doğru
                              </span>
                            )}
                            {!isCorrect && !isBlank && (
                              <span className="text-rose-700 font-bold font-sans text-[11px]">
                                Yanlış
                              </span>
                            )}
                            {isBlank && (
                              <span className="text-slate-400 font-sans text-[11px]">Boş</span>
                            )}
                          </td>
                          <td className="py-1.5 px-3 text-right tabular-nums">
                            {isCorrect ? qPoints.toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono text-center sm:text-left">
            <span>testimgeldi Optik Okuma Sistemi · testimgeldi.com</span>
            <span>Öğretmen İmzası: ____________________</span>
          </div>
        </div>
      </div>
    </div>
  );
};
