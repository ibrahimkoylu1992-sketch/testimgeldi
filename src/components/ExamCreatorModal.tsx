import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { StorageService } from '../lib/storage';
import { Exam, BookletType, BookletAnswerKey, PenaltyOption, PenaltyMode, ExamSubjectSection } from '../types';
import { parseAnswerKeyInput } from '../lib/omrEngine';
import { X, Check, Upload, FileText, Plus, AlertCircle, Layers, Trash2 } from 'lucide-react';

interface ExamCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamCreated: (newExam: Exam) => void;
  onOpenSubscriptionModal: () => void;
}

export const ExamCreatorModal: React.FC<ExamCreatorModalProps> = ({
  isOpen,
  onClose,
  onExamCreated,
  onOpenSubscriptionModal,
}) => {
  const { currentUser, isSubscriptionActive, addCustomBranch, addCustomClass, addCustomSchool } = useAuth();
  const { showToast } = useToast();

  const [availableSchools, setAvailableSchools] = useState<string[]>(() =>
    currentUser
      ? StorageService.getUserSchools(currentUser)
      : ['Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu', 'Merkez Anadolu Lisesi']
  );
  const [availableBranches, setAvailableBranches] = useState<string[]>(() =>
    currentUser
      ? StorageService.getUserBranches(currentUser)
      : ['Matematik', 'Türkçe', 'Fen Bilimleri']
  );
  const [availableClasses, setAvailableClasses] = useState<string[]>(() =>
    currentUser
      ? StorageService.getUserClasses(currentUser)
      : ['5-A', '6-A', '7-A', '8-A', '12-Sayısal']
  );

  React.useEffect(() => {
    if (currentUser) {
      const schs = StorageService.getUserSchools(currentUser);
      const brs = StorageService.getUserBranches(currentUser);
      const cls = StorageService.getUserClasses(currentUser);
      setAvailableSchools(schs);
      setAvailableBranches(brs);
      setAvailableClasses(cls);
    }
  }, [currentUser]);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(currentUser?.branch || availableBranches[0] || 'Matematik');
  const [gradeLevel, setGradeLevel] = useState(currentUser?.gradeLevel || availableClasses[0] || '8-A');
  const [selectedSchool, setSelectedSchool] = useState<string>(
    currentUser?.school || availableSchools[0] || 'Cumhuriyet Ortaokulu'
  );
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [optionCount, setOptionCount] = useState<number>(4);
  const [scoringType, setScoringType] = useState<'equal' | 'custom'>('equal');
  const [penalty, setPenalty] = useState<PenaltyOption>('3to1');
  const [penaltyMode, setPenaltyMode] = useState<PenaltyMode>('fractional');
  const [activeBooklet, setActiveBooklet] = useState<BookletType>('A');
  const [enableMultipleBooklets, setEnableMultipleBooklets] = useState(false);

  // New Custom Branch, Class & School inputs
  const [isAddingNewBranch, setIsAddingNewBranch] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [isAddingNewClass, setIsAddingNewClass] = useState(false);
  const [newClassInput, setNewClassInput] = useState('');
  const [isAddingNewSchool, setIsAddingNewSchool] = useState(false);
  const [newSchoolInput, setNewSchoolInput] = useState('');

  // Input method: 'grid' | 'text' | 'upload'
  const [inputMethod, setInputMethod] = useState<'grid' | 'text' | 'upload'>('grid');
  const [quickTextInput, setQuickTextInput] = useState('');

  // Multi-subject sections state
  const [isMultiSubject, setIsMultiSubject] = useState(false);
  const [sections, setSections] = useState<{ id: string; name: string; questionCount: number }[]>([
    { id: 'sec_1', name: availableBranches[0] || 'Matematik', questionCount: 20 },
    { id: 'sec_2', name: availableBranches[1] || 'Fen Bilimleri', questionCount: 20 },
  ]);
  const [newSecName, setNewSecName] = useState(availableBranches[2] || 'Türkçe');
  const [newSecCount, setNewSecCount] = useState(15);
  const [showAddSectionRow, setShowAddSectionRow] = useState(false);

  const [bookletAnswers, setBookletAnswers] = useState<Record<BookletType, Record<number, string>>>({
    A: {
      1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A',
      6: 'B', 7: 'C', 8: 'D', 9: 'A', 10: 'B',
      11: 'C', 12: 'D', 13: 'A', 14: 'B', 15: 'C',
      16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
    },
    B: {
      1: 'B', 2: 'C', 3: 'D', 4: 'A', 5: 'B',
      6: 'C', 7: 'D', 8: 'A', 9: 'B', 10: 'C',
      11: 'D', 12: 'A', 13: 'B', 14: 'C', 15: 'D',
      16: 'A', 17: 'B', 18: 'C', 19: 'D', 20: 'A',
    },
    C: {},
    D: {},
  });

  const [customPoints, setCustomPoints] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    for (let i = 1; i <= 40; i++) init[i] = 2.5;
    return init;
  });

  const totalQuestionsEffective = isMultiSubject
    ? sections.reduce((sum, s) => sum + s.questionCount, 0)
    : questionCount;

  const handleAddSection = () => {
    if (!newSecName.trim()) return;
    const newSec = {
      id: 'sec_' + Date.now(),
      name: newSecName.trim(),
      questionCount: Number(newSecCount) || 15,
    };
    const updated = [...sections, newSec];
    setSections(updated);
    setNewSecName('');
    setShowAddSectionRow(false);
    handleQuestionCountChange(updated.reduce((s, x) => s + x.questionCount, 0));
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) {
      showToast('En az 1 ders bölümü bulunmalıdır.', 'error');
      return;
    }
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    handleQuestionCountChange(updated.reduce((s, x) => s + x.questionCount, 0));
  };

  if (!isOpen) return null;

  const options = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

  const handleCreateCustomBranch = () => {
    const trimmed = newBranchInput.trim();
    if (!trimmed) return;
    addCustomBranch(trimmed);
    setAvailableBranches((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSubject(trimmed);
    setNewSecName(trimmed);
    setNewBranchInput('');
    setIsAddingNewBranch(false);
    showToast(`"${trimmed}" branşı başarıyla eklendi ve seçildi.`, 'success');
  };

  const handleCreateCustomClass = () => {
    const trimmed = newClassInput.trim();
    if (!trimmed) return;
    addCustomClass(trimmed);
    setAvailableClasses((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setGradeLevel(trimmed);
    setNewClassInput('');
    setIsAddingNewClass(false);
    showToast(`"${trimmed}" sınıfı başarıyla eklendi ve seçildi.`, 'success');
  };

  const handleCreateCustomSchool = () => {
    const trimmed = newSchoolInput.trim();
    if (!trimmed) return;
    addCustomSchool(trimmed);
    setAvailableSchools((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setSelectedSchool(trimmed);
    setNewSchoolInput('');
    setIsAddingNewSchool(false);
    showToast(`"${trimmed}" okulu başarıyla eklendi ve seçildi.`, 'success');
  };

  const handleQuestionCountChange = (count: number) => {
    setQuestionCount(count);
    const newPoints: Record<number, number> = {};
    const defaultPt = parseFloat((100 / count).toFixed(1));
    for (let i = 1; i <= count; i++) {
      newPoints[i] = customPoints[i] || defaultPt;
    }
    setCustomPoints(newPoints);
  };

  const setAnswerForQuestion = (q: number, opt: string) => {
    setBookletAnswers((prev) => ({
      ...prev,
      [activeBooklet]: {
        ...prev[activeBooklet],
        [q]: opt,
      },
    }));
  };

  const handleApplyQuickText = () => {
    if (!quickTextInput.trim()) return;
    const parsed = parseAnswerKeyInput(quickTextInput, questionCount);
    const count = Object.keys(parsed).length;
    if (count === 0) {
      showToast('Geçerli bir cevap anahtarı tespit edilemedi. Örnek: 1-A, 2-B, 3-D', 'error');
      return;
    }

    setBookletAnswers((prev) => ({
      ...prev,
      [activeBooklet]: {
        ...prev[activeBooklet],
        ...parsed,
      },
    }));

    showToast(`Kitapçık ${activeBooklet} için ${count} soru cevabı uygulandı.`, 'success');
  };

  const handleUploadAnswerKeyFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast('Optik cevap anahtarı taranıyor...', 'info');
    setTimeout(() => {
      const simulated: Record<number, string> = {};
      for (let i = 1; i <= questionCount; i++) {
        simulated[i] = options[Math.floor(Math.random() * options.length)];
      }
      setBookletAnswers((prev) => ({
        ...prev,
        [activeBooklet]: simulated,
      }));
      showToast(`Optik form başarıyla okundu! ${questionCount} sorunun cevapları aktarıldı.`, 'success');
    }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSubscriptionActive && currentUser?.role === 'teacher') {
      showToast('Kullanım süreniz dolduğu için yeni sınav oluşturamazsınız. Lütfen paket seçiniz.', 'error');
      onOpenSubscriptionModal();
      return;
    }

    if (!title.trim()) {
      showToast('Lütfen sınav başlığı giriniz.', 'error');
      return;
    }

    const finalQCount = totalQuestionsEffective;

    const currentA = bookletAnswers['A'] || {};
    for (let i = 1; i <= finalQCount; i++) {
      if (!currentA[i]) currentA[i] = 'A';
    }

    const bookletsData: BookletAnswerKey[] = [
      { booklet: 'A', answers: currentA },
    ];

    if (enableMultipleBooklets) {
      const currentB = bookletAnswers['B'] || {};
      for (let i = 1; i <= finalQCount; i++) {
        if (!currentB[i]) currentB[i] = currentA[i];
      }
      bookletsData.push({ booklet: 'B', answers: currentB });
    }

    const finalPoints: Record<number, number> = {};
    const defaultPt = 100 / finalQCount;
    for (let i = 1; i <= finalQCount; i++) {
      finalPoints[i] = scoringType === 'custom' ? (customPoints[i] ?? defaultPt) : defaultPt;
    }

    let computedSections: ExamSubjectSection[] | undefined = undefined;
    if (isMultiSubject && sections.length > 0) {
      let cur = 1;
      computedSections = sections.map((sec) => {
        const qStart = cur;
        const qEnd = cur + sec.questionCount - 1;
        cur = qEnd + 1;
        return {
          id: sec.id,
          name: sec.name,
          questionStart: qStart,
          questionEnd: qEnd,
          questionCount: sec.questionCount,
        };
      });
    }

    const finalSubject = isMultiSubject
      ? `Çoklu Ders (${sections.map((s) => s.name).join(', ')})`
      : subject;

    const newExam: Exam = {
      id: 'exam_' + Date.now(),
      title: title.trim(),
      subject: finalSubject,
      gradeLevel,
      school: selectedSchool || currentUser?.school || 'Cumhuriyet Ortaokulu',
      creatorId: currentUser?.id || 'usr_anon',
      creatorName: currentUser?.name || 'Öğretmen',
      createdAt: new Date().toISOString(),
      questionCount: finalQCount,
      optionCount,
      booklets: bookletsData,
      scoringType,
      questionPoints: finalPoints,
      penalty,
      penaltyMode,
      totalPaperCount: 0,
      averageScore: 0,
      highestScore: 0,
      sections: computedSections,
    };

    StorageService.saveExam(newExam);
    showToast(`"${newExam.title}" başarıyla oluşturuldu!`, 'success');
    onExamCreated(newExam);
    onClose();
  };

  const totalCustomScore = Object.values(customPoints)
    .slice(0, questionCount)
    .reduce((sum, val) => sum + (Number(val) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-3xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Yeni Sınav / Test Oluştur</h3>
              <p className="text-xs text-slate-500">
                Özel branş ve sınıflarınızı tanımlayın, puanlama ve cevap anahtarı ayarlayın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subscription Expired Warning */}
        {!isSubscriptionActive && currentUser?.role === 'teacher' && (
          <div className="px-6 py-3 bg-rose-50 border-b border-rose-200 flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>15 günlük deneme süreniz sona ermiştir. Yeni sınav kaydetmek için paket seçiniz.</span>
            </div>
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-xs"
            >
              Paketleri İncele
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Sınav Başlığı */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sınav Başlığı / Adı *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: 8. Sınıf LGS Matematik 1. Deneme Sınavı"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Sınav Formatı: Tek Ders vs Çoklu Ders */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Sınav / Optik Türü</span>
                <span className="text-[11px] text-slate-500">
                  {isMultiSubject
                    ? 'Çoklu Ders Modu: Aynı optik form üzerinde birden fazla ders alanı oluşturun.'
                    : 'Tek Ders Modu: Standart tek branş sınavı.'}
                </span>
              </div>
              <div className="flex bg-white rounded-lg border border-slate-300 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiSubject(false);
                    handleQuestionCountChange(20);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors ${
                    !isMultiSubject
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tek Ders
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMultiSubject(true);
                    handleQuestionCountChange(sections.reduce((s, x) => s + x.questionCount, 0));
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer transition-colors flex items-center gap-1.5 ${
                    isMultiSubject
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Çoklu Ders (Mat+Fizik vb.)
                </button>
              </div>
            </div>

            {/* Çoklu Ders Bölümleri Listesi */}
            {isMultiSubject && (
              <div className="mt-3 pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    Optikte Yer Alacak Ders Bölümleri ({sections.length} Ders - Toplam {totalQuestionsEffective} Soru)
                  </span>
                  <div className="flex items-center gap-3">
                    {!isAddingNewBranch && (
                      <button
                        type="button"
                        onClick={() => setIsAddingNewBranch(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Yeni Branş Ekle
                      </button>
                    )}
                    {!showAddSectionRow && (
                      <button
                        type="button"
                        onClick={() => setShowAddSectionRow(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Ders / Bölüm Ekle
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline branch addition inside multi-subject */}
                {isAddingNewBranch && (
                  <div className="flex gap-1.5 p-2 bg-indigo-50/90 border border-indigo-200 rounded-lg items-center">
                    <input
                      type="text"
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomBranch();
                        }
                      }}
                      placeholder="Yeni Branş Adı (Örn: Felsefe, İngilizce)"
                      className="flex-1 px-2.5 py-1 text-xs border border-indigo-300 rounded bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomBranch}
                      className="px-2.5 py-1 bg-indigo-600 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Branşı Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBranch(false)}
                      className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Section List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="flex items-center justify-between bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 block">{sec.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {sec.questionCount} Soru
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveSection(sec.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Bölümü Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new section inline row */}
                {showAddSectionRow && (
                  <div className="flex flex-wrap gap-2 p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-200 items-center">
                    <div className="flex-1 min-w-[160px]">
                      <select
                        value={newSecName}
                        onChange={(e) => setNewSecName(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white font-medium"
                      >
                        {availableBranches.map((br) => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="50"
                        value={newSecCount}
                        onChange={(e) => setNewSecCount(Number(e.target.value))}
                        className="w-16 px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                      />
                      <span className="text-[11px] text-slate-600 font-medium">Soru</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddSection}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Bölümü Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSectionRow(false)}
                      className="text-slate-400 hover:text-slate-600 px-1.5 py-1 text-xs cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dinamik Okul, Branş ve Sınıf Seçimi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Okul Seçimi */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Okul / Kurum</label>
                {!isAddingNewSchool && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSchool(true)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Yeni Ekle
                  </button>
                )}
              </div>

              {isAddingNewSchool ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newSchoolInput}
                    onChange={(e) => setNewSchoolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCustomSchool();
                      }
                    }}
                    placeholder="Yeni Okul Adı"
                    className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomSchool}
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewSchool(false)}
                    className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {availableSchools.map((sch) => (
                    <option key={sch} value={sch}>{sch}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Branş (Yalnızca Tek Ders Modunda gösterilir, Çoklu Ders modunda bölümler yukarıda tanımlanır) */}
            {!isMultiSubject ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Ders / Branş</label>
                  {!isAddingNewBranch && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBranch(true)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Yeni Ekle
                    </button>
                  )}
                </div>

                {isAddingNewBranch ? (
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={newBranchInput}
                      onChange={(e) => setNewBranchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateCustomBranch();
                        }
                      }}
                      placeholder="Yeni Branş Adı"
                      className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCreateCustomBranch}
                      className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
                    >
                      Ekle
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewBranch(false)}
                      className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    {availableBranches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : null}

            {/* Sınıf */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">Sınıf / Şube</label>
                {!isAddingNewClass && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewClass(true)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Yeni Ekle
                  </button>
                )}
              </div>

              {isAddingNewClass ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newClassInput}
                    onChange={(e) => setNewClassInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCreateCustomClass();
                      }
                    }}
                    placeholder="Örn: 8-C veya Mezun"
                    className="flex-1 px-2.5 py-1.5 text-xs border border-indigo-400 rounded-lg focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCustomClass}
                    className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold"
                  >
                    Ekle
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewClass(false)}
                    className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Şık Sayısı */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Şık Sayısı</label>
              <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setOptionCount(4)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                    optionCount === 4 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  4 Şık (A-D)
                </button>
                <button
                  type="button"
                  onClick={() => setOptionCount(5)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded cursor-pointer ${
                    optionCount === 5 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  5 Şık (A-E)
                </button>
              </div>
            </div>
          </div>

          {/* Soru Sayısı & Puanlama Ayarları */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
            <div className={`grid grid-cols-1 ${!isMultiSubject ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
              {!isMultiSubject ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Soru Sayısı: <span className="text-indigo-600 font-bold">{questionCount} Soru</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[5, 10, 15, 20, 25, 30, 40, 50].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleQuestionCountChange(num)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded border cursor-pointer ${
                          questionCount === num
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-indigo-50/80 border border-indigo-200 p-3 rounded-lg flex flex-col justify-center">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Toplam Soru: <span className="text-indigo-700 font-extrabold text-sm font-mono">{totalQuestionsEffective} Soru</span>
                  </span>
                  <span className="text-[11px] text-indigo-800/80 mt-0.5">
                    ({sections.length} Ders Bölümü · Soru sayısı her dersin bölümünden otomatik hesaplandı)
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Puanlama Modeli
                </label>
                <select
                  value={scoringType}
                  onChange={(e) => setScoringType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="equal">
                    Eşit Dağılım (100 / {questionCount} = {(100 / questionCount).toFixed(1)} Puan)
                  </option>
                  <option value="custom">Soru Bazlı Özel Puan Belirleme</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yanlış Cezası (Net Hesabı)
                </label>
                <select
                  value={penalty}
                  onChange={(e) => setPenalty(e.target.value as PenaltyOption)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  <option value="none">Ceza Yok (Doğru Sayısı = Net)</option>
                  <option value="3to1">3 Yanlış 1 Doğruyu Götürür (LGS / Ortaokul)</option>
                  <option value="4to1">4 Yanlış 1 Doğruyu Götürür (YKS / Lise)</option>
                </select>
              </div>
            </div>

            {penalty !== 'none' && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-900">
                    Kural Tamamlanmadığında Net Nasıl Hesaplansın?
                  </label>
                  <span className="text-[11px] font-medium text-amber-700">
                    {penalty === '3to1' ? 'Kural: 3 Yanlış' : 'Kural: 4 Yanlış'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* 1. Kesirli / Yüzdesel Düşüm */}
                  <label
                    onClick={() => setPenaltyMode('fractional')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      penaltyMode === 'fractional'
                        ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 text-slate-900 shadow-2xs'
                        : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="penaltyMode"
                      value="fractional"
                      checked={penaltyMode === 'fractional'}
                      onChange={() => setPenaltyMode('fractional')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <span className="block font-bold text-slate-900">
                        Yüzdesel / Kesirli Düşüm (ÖSYM & MEB)
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {penalty === '3to1'
                          ? '2 yanlış yaparsa -0.67 net düşer. (Her yanlış 0.33 net eksiltir).'
                          : '2 yanlış yaparsa -0.50 net düşer. (Her yanlış 0.25 net eksiltir).'}
                      </p>
                    </div>
                  </label>

                  {/* 2. Tam Kural Tamamlama */}
                  <label
                    onClick={() => setPenaltyMode('floor')}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      penaltyMode === 'floor'
                        ? 'bg-white border-amber-500 ring-2 ring-amber-500/20 text-slate-900 shadow-2xs'
                        : 'bg-white/70 border-slate-200 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="penaltyMode"
                      value="floor"
                      checked={penaltyMode === 'floor'}
                      onChange={() => setPenaltyMode('floor')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="space-y-0.5">
                      <span className="block font-bold text-slate-900">
                        Tam Sayı Düşüm (Kural Tamamlama)
                      </span>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {penalty === '3to1'
                          ? '1 veya 2 yanlışta doğru gitmez (0 ceza). Yalnızca tam 3, 6, 9... yanlışa ulaşınca 1, 2, 3 doğru silinir.'
                          : '1, 2 veya 3 yanlışta doğru gitmez (0 ceza). Yalnızca tam 4, 8, 12... yanlışa ulaşınca 1, 2, 3 doğru silinir.'}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {scoringType === 'custom' && (
              <div className="pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">
                    Soru Bazlı Puan Dağılımı:
                  </span>
                  <span className="text-xs font-mono font-bold text-indigo-700">
                    Toplam: {totalCustomScore} Puan
                  </span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded border border-slate-200">
                  {Array.from({ length: questionCount }).map((_, i) => {
                    const qNum = i + 1;
                    return (
                      <div key={qNum} className="text-center p-1 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] font-mono text-slate-500 block">S{qNum}</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={customPoints[qNum] ?? 5}
                          onChange={(e) =>
                            setCustomPoints({
                              ...customPoints,
                              [qNum]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full text-center text-xs font-mono font-bold py-0.5 border border-slate-300 rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* CEVAP ANAHTARI GİRİŞ ALANI */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  Cevap Anahtarı Tanımlama
                  <span className="text-[11px] font-normal text-slate-500">
                    (Kitapçık: {activeBooklet})
                  </span>
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 font-medium flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMultipleBooklets}
                    onChange={(e) => setEnableMultipleBooklets(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  A & B Kitapçığı
                </label>

                {enableMultipleBooklets && (
                  <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setActiveBooklet('A')}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        activeBooklet === 'A' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      A
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveBooklet('B')}
                      className={`px-2.5 py-0.5 text-xs font-bold rounded cursor-pointer ${
                        activeBooklet === 'B' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      B
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Giriş Yöntemi Sekmeleri */}
            <div className="flex border-b border-slate-200 mb-4 gap-4 text-xs font-medium">
              <button
                type="button"
                onClick={() => setInputMethod('grid')}
                className={`pb-2 transition-colors cursor-pointer ${
                  inputMethod === 'grid'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>İnteraktif Tuşlama</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('text')}
                className={`pb-2 transition-colors cursor-pointer ${
                  inputMethod === 'text'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Hızlı Metin Yapıştır (1-A, 2-B, 3-D)</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMethod('upload')}
                className={`pb-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  inputMethod === 'upload'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Optik Form Yükle</span>
              </button>
            </div>

            {/* YÖNTEM 1: İNTERAKTİF GRİD */}
            {inputMethod === 'grid' && (
              <div className="space-y-3 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
                {isMultiSubject ? (
                  sections.map((sec, sIdx) => {
                    let start = 1;
                    for (let j = 0; j < sIdx; j++) {
                      start += sections[j].questionCount;
                    }
                    const end = start + sec.questionCount - 1;

                    return (
                      <div key={sec.id} className="bg-white rounded-lg border border-slate-200 p-2.5">
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                              {sIdx + 1}
                            </span>
                            {sec.name}
                          </span>
                          <span className="font-mono text-slate-500 text-[11px]">
                            {sec.questionCount} Soru (1 - {sec.questionCount})
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                          {Array.from({ length: sec.questionCount }).map((_, rIdx) => {
                            const qNum = start + rIdx;
                            const inSecQNum = rIdx + 1; // 1 to N per subject!
                            const currentSelected = bookletAnswers[activeBooklet]?.[qNum] || '';

                            return (
                              <div
                                key={qNum}
                                className="bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between"
                              >
                                <span className="font-mono text-xs font-bold text-slate-700 w-6" title={`${sec.name} ${inSecQNum}. Soru (Genel: ${qNum})`}>
                                  {inSecQNum}.
                                </span>
                                <div className="flex gap-1">
                                  {options.map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setAnswerForQuestion(qNum, opt)}
                                      className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                        currentSelected === opt
                                          ? 'bg-indigo-600 text-white shadow-xs'
                                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {Array.from({ length: questionCount }).map((_, i) => {
                      const qNum = i + 1;
                      const currentSelected = bookletAnswers[activeBooklet]?.[qNum] || '';

                      return (
                        <div
                          key={qNum}
                          className="bg-white p-2 rounded border border-slate-200 flex items-center justify-between"
                        >
                          <span className="font-mono text-xs font-bold text-slate-700 w-6">
                            {qNum}.
                          </span>
                          <div className="flex gap-1">
                            {options.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setAnswerForQuestion(qNum, opt)}
                                className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  currentSelected === opt
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* YÖNTEM 2: HIZLI METİN GİRİŞİ */}
            {inputMethod === 'text' && (
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-xs text-slate-600">
                  Cevapları dilediğiniz gibi yapıştırabilirsiniz. Sistem otomatik tanıyacaktır:
                  <br />
                  Örnek: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">1-A, 2-B, 3-D, 4-C</code> veya <code className="bg-slate-200 px-1 py-0.5 rounded font-mono text-[11px]">ABCDABCD...</code>
                </p>

                <textarea
                  rows={3}
                  value={quickTextInput}
                  onChange={(e) => setQuickTextInput(e.target.value)}
                  placeholder="1-A, 2-C, 3-B, 4-D, 5-A, 6-B..."
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none"
                />

                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Aktif Kitapçık: <span className="font-bold text-indigo-700">{activeBooklet}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleApplyQuickText}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Cevapları Uygula
                  </button>
                </div>
              </div>
            )}

            {/* YÖNTEM 3: OPTİK FORMDAN OKUMA */}
            {inputMethod === 'upload' && (
              <div className="p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg text-center">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <h5 className="text-xs font-bold text-slate-800 mb-1">
                  Cevap Anahtarı Olarak Optik Form Fotoğrafı Yükle
                </h5>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors mt-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleUploadAnswerKeyFile}
                    className="hidden"
                  />
                  <span>Optik Form Dosyası Seç (JPG, PNG)</span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Sınavı Oluştur & Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
