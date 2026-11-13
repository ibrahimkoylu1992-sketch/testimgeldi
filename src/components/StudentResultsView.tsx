import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/storage';
import { StudentResult, Exam } from '../types';
import { GraduationCap, BookOpen, Award, CheckCircle2, Printer, Search, School, Hash, Save } from 'lucide-react';
import { useToast } from './Toast';

interface StudentResultsViewProps {
  onOpenReportCard: (result: StudentResult, exam: Exam) => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ onOpenReportCard }) => {
  const { currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const allExams = StorageService.getExams();
  const allResults = StorageService.getAllResults();

  // Extract all distinct schools present in exams, users, and teacher-defined schools
  const availableSchools = Array.from(
    new Set([
      'Cumhuriyet Ortaokulu',
      'Merkez Anadolu Lisesi',
      'Gazi İmam Hatip Ortaokulu',
      'Atatürk Fen Lisesi',
      ...allExams.map((e) => e.school).filter(Boolean),
      ...StorageService.getUsers().map((u) => u.school).filter(Boolean),
      ...StorageService.getUsers().flatMap((u) => u.mySchools || u.customSchools || []),
    ])
  ) as string[];

  const [selectedSchool, setSelectedSchool] = useState<string>(
    currentUser?.school || availableSchools[0] || 'Cumhuriyet Ortaokulu'
  );
  const [studentNumberInput, setStudentNumberInput] = useState<string>(
    currentUser?.studentNumber || '1042'
  );

  // Exact matching for student's school and student number
  const studentResults = allResults.filter((r) => {
    const exam = allExams.find((e) => e.id === r.examId);
    const matchesNo = r.studentNumber.trim() === studentNumberInput.trim();
    const examSchool = r.school || exam?.school || '';
    const matchesSchool =
      !selectedSchool ||
      selectedSchool === 'all' ||
      examSchool.toLowerCase().includes(selectedSchool.toLowerCase()) ||
      selectedSchool.toLowerCase().includes(examSchool.toLowerCase());

    return matchesNo && matchesSchool;
  });

  const handleSaveToProfile = () => {
    if (!currentUser) return;
    StorageService.updateUser(currentUser.id, {
      school: selectedSchool,
      studentNumber: studentNumberInput,
    });
    refreshUser();
    showToast('Okul ve numara bilgileriniz profilinize kaydedildi.', 'success');
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-5 sm:p-8 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Öğrenci Sınav Sonuçları & Karnelerim</h1>
            <p className="text-xs text-emerald-100">
              Okulunuzu ve öğrenci numaranızı eşleştirerek öğretmenin okuduğu optik sınav sonuçlarınızı görüntüleyin.
            </p>
          </div>
        </div>
      </div>

      {/* School and Student Number Matcher Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <School className="w-4 h-4 text-emerald-600" />
            Öğrenci ve Okul Eşleştirme Sorgusu
          </span>
          <button
            onClick={handleSaveToProfile}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Profilime Kaydet
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tanımlı Okulunuzu Seçin
            </label>
            <div className="relative">
              <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none"
              >
                {availableSchools.map((sch) => (
                  <option key={sch} value={sch}>{sch}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Okul / Öğrenci Numaranız
            </label>
            <div className="relative">
              <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentNumberInput}
                onChange={(e) => setStudentNumberInput(e.target.value)}
                placeholder="Örn: 1042 veya 2101"
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Sorgulanan: <strong>{selectedSchool}</strong> · No: <strong className="font-mono">{studentNumberInput}</strong>
          </span>
          <span>
            Eşleşen Sınav Sonucu: <strong className="text-emerald-700">{studentResults.length} Adet</strong>
          </span>
        </div>
      </div>

      {/* Results List */}
      {studentResults.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 mb-1">Eşleşen Sınav Sonucu Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {selectedSchool} okulunda <strong>{studentNumberInput}</strong> numaralı öğrenciye ait değerlendirilmiş optik kağıt bulunmuyor. Lütfen okul veya numaranızı kontrol ediniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentResults.map((result) => {
            const exam: Partial<Exam> & { title: string; subject: string; gradeLevel: string; school?: string } =
              allExams.find((e) => e.id === result.examId) || {
                id: result.examId,
                title: 'Deneme Sınavı',
                subject: 'Genel',
                gradeLevel: '8. Sınıf',
                school: result.school || 'Cumhuriyet Ortaokulu',
                questionCount: Object.keys(result.answers).length,
                optionCount: 4,
                booklets: [{ booklet: result.booklet, answers: {} }],
                scoringType: 'equal',
                questionPoints: {},
                penalty: 'none',
                totalPaperCount: 1,
              };

            return (
              <div
                key={result.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase">
                      {exam.subject} · {exam.gradeLevel}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(result.scannedAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{exam.title}</h3>
                  <span className="text-[11px] text-slate-400 block mb-4">
                    Okul: {result.school || exam.school || 'Cumhuriyet Ortaokulu'}
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-2 text-center mb-3 p-3 bg-slate-50 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Puan</span>
                      <span className="text-lg font-black text-indigo-700 font-mono tabular-nums">
                        {result.totalScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Net</span>
                      <span className="text-lg font-bold text-slate-800 font-mono tabular-nums">
                        {result.netScore}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Doğru</span>
                      <span className="text-lg font-bold text-emerald-600 font-mono tabular-nums">
                        {result.correctCount}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Yanlış</span>
                      <span className="text-lg font-bold text-rose-600 font-mono tabular-nums">
                        {result.wrongCount}
                      </span>
                    </div>
                  </div>

                  {/* Multi-subject net breakdown chips */}
                  {exam.sections && exam.sections.length > 0 && (
                    <div className="mb-3 p-2 bg-indigo-50/40 border border-indigo-100 rounded-lg">
                      <span className="text-[10px] font-bold text-indigo-900 block mb-1">
                        Ders Bazlı Netler:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {exam.sections.map((sec) => {
                          const activeKey = exam.booklets?.[0]?.answers || {};
                          let secCorrect = 0;
                          let secWrong = 0;
                          const start = sec.startIndex ?? (sec.questionStart - 1);
                          for (let q = 1; q <= sec.questionCount; q++) {
                            const globalQ = start + q;
                            const studentAns = result.answers[globalQ];
                            const correctAns = activeKey[globalQ];
                            if (studentAns) {
                              if (studentAns === correctAns) secCorrect++;
                              else secWrong++;
                            }
                          }
                          let penaltyDeduction = 0;
                          if (exam.penalty === '3to1') {
                            penaltyDeduction = exam.penaltyMode === 'floor' ? Math.floor(secWrong / 3) : secWrong / 3;
                          } else if (exam.penalty === '4to1') {
                            penaltyDeduction = exam.penaltyMode === 'floor' ? Math.floor(secWrong / 4) : secWrong / 4;
                          }
                          const secNet = Math.max(0, secCorrect - penaltyDeduction);

                          return (
                            <span
                              key={sec.id}
                              className="inline-flex items-center gap-1 text-[11px] bg-white border border-indigo-200 text-slate-800 px-2 py-0.5 rounded shadow-2xs font-medium"
                            >
                              <span>{sec.name}:</span>
                              <strong className="text-indigo-700 font-mono">{secNet.toFixed(1)} Net</strong>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Kitapçık: <strong>{result.booklet}</strong></span>
                  <button
                    onClick={() => onOpenReportCard(result, exam as Exam)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Karnemi Görüntüle &amp; Yazdır</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
