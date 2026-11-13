import React, { useState, useMemo } from 'react';
import { QuizQuestion } from '../../types/quiz';
import {
  SAMPLE_QUESTION_BANK,
  QUESTION_BANK_SUBJECTS,
  QUESTION_BANK_GRADES,
  QUESTION_BANK_TOPICS,
  BankQuestion,
} from '../../data/questionBank';
import {
  X,
  Search,
  BookOpen,
  Plus,
  Check,
  CheckCheck,
  Filter,
  Sparkles,
  HelpCircle,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../Toast';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (question: QuizQuestion) => void;
  onBatchAddQuestions?: (questions: QuizQuestion[]) => void;
  nextOrderNumber: number;
}

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onAddQuestion,
  onBatchAddQuestions,
  nextOrderNumber,
}) => {
  const { showToast } = useToast();

  const [selectedSubject, setSelectedSubject] = useState<string>('Matematik');
  const [selectedGrade, setSelectedGrade] = useState<string>('8. Sınıf (LGS)');
  const [selectedTopic, setSelectedTopic] = useState<string>('Tümü');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Available topics for currently selected subject
  const availableTopics = useMemo(() => {
    if (selectedSubject === 'Tümü') return ['Tümü'];
    const topics = QUESTION_BANK_TOPICS[selectedSubject] || [];
    return ['Tümü', ...topics];
  }, [selectedSubject]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return SAMPLE_QUESTION_BANK.filter((q) => {
      // Subject filter
      if (selectedSubject !== 'Tümü' && q.subject !== selectedSubject) {
        return false;
      }
      // Grade filter
      if (selectedGrade !== 'Tümü' && q.gradeLevel !== selectedGrade) {
        return false;
      }
      // Topic filter
      if (selectedTopic !== 'Tümü' && q.topic !== selectedTopic) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesText = q.questionText?.toLowerCase().includes(query);
        const matchesTopic = q.topic?.toLowerCase().includes(query);
        const matchesSubject = q.subject?.toLowerCase().includes(query);
        if (!matchesText && !matchesTopic && !matchesSubject) {
          return false;
        }
      }
      return true;
    });
  }, [selectedSubject, selectedGrade, selectedTopic, searchQuery]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map((q) => q.id)));
    }
  };

  const handleAddSingle = (bankQ: BankQuestion) => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      orderNumber: nextOrderNumber,
      questionText: bankQ.questionText,
      diagramImage: bankQ.diagramImage,
      optionsCount: bankQ.optionsCount,
      options: bankQ.options,
      correctAnswer: bankQ.correctAnswer,
      points: bankQ.points || 10,
      topic: bankQ.topic,
      subject: bankQ.subject,
      difficulty: bankQ.difficulty,
      explanation: bankQ.explanation,
    };
    onAddQuestion(newQ);
    showToast(`"${bankQ.topic || bankQ.subject}" sorusu teste eklendi.`, 'success');
  };

  const handleBatchAdd = () => {
    if (selectedIds.size === 0) return;
    const questionsToAdd: QuizQuestion[] = [];
    let currentOrder = nextOrderNumber;

    SAMPLE_QUESTION_BANK.forEach((bankQ) => {
      if (selectedIds.has(bankQ.id)) {
        questionsToAdd.push({
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          orderNumber: currentOrder++,
          questionText: bankQ.questionText,
          diagramImage: bankQ.diagramImage,
          optionsCount: bankQ.optionsCount,
          options: bankQ.options,
          correctAnswer: bankQ.correctAnswer,
          points: bankQ.points || 10,
          topic: bankQ.topic,
          subject: bankQ.subject,
          difficulty: bankQ.difficulty,
          explanation: bankQ.explanation,
        });
      }
    });

    if (onBatchAddQuestions) {
      onBatchAddQuestions(questionsToAdd);
    } else {
      questionsToAdd.forEach((q) => onAddQuestion(q));
    }

    showToast(`${questionsToAdd.length} adet soru başarıyla teste eklendi!`, 'success');
    setSelectedIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white shadow-md">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Örnek Soru Bankası</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
                  MEB & LGS Müfredatı
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ders ve konu seçerek kazanım odaklı hazır soruları tek tıkla testinize ekleyin.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 space-y-3">
          {/* Subject Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {QUESTION_BANK_SUBJECTS.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  setSelectedSubject(sub);
                  setSelectedTopic('Tümü');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedSubject === sub
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Grade, Topic and Search Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Grade Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Sınıf / Seviye:
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {QUESTION_BANK_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Selector */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Konu / Kazanım:
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyword Search */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Soru İçinde Ara:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Kelime veya formül ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Header: Results Count & Select All */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-400">
            <span>
              Toplam <strong className="text-white">{filteredQuestions.length}</strong> soru listeleniyor
            </span>
            {selectedIds.size > 0 && (
              <span className="text-indigo-400 font-semibold">
                ({selectedIds.size} soru seçildi)
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1.5 text-[11px] rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              {selectedIds.size === filteredQuestions.length && filteredQuestions.length > 0
                ? 'Seçimleri Kaldır'
                : 'Tümünü Seç'}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchAdd}
                className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Seçilen {selectedIds.size} Soruyu Ekle
              </button>
            )}
          </div>
        </div>

        {/* Questions Grid / List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/60">
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <BookOpen className="w-12 h-12 mx-auto text-slate-600 stroke-1" />
              <p className="text-sm font-medium">Seçtiğiniz kriterlere uygun soru bulunamadı.</p>
              <p className="text-xs text-slate-500">
                Filtreleri temizleyebilir veya arama terimini değiştirebilirsiniz.
              </p>
              <button
                onClick={() => {
                  setSelectedSubject('Tümü');
                  setSelectedGrade('Tümü');
                  setSelectedTopic('Tümü');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors"
              >
                Tüm Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const isSelected = selectedIds.has(q.id);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/80 ring-1 ring-indigo-500'
                      : 'bg-slate-800/80 border-slate-700/70 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => toggleSelect(q.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-slate-600 hover:border-slate-400 bg-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-xs font-bold text-white bg-slate-700 px-2 py-0.5 rounded">
                        {q.subject}
                      </span>
                      <span className="text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                        {q.topic}
                      </span>
                      <span className="text-[11px] text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                        {q.gradeLevel}
                      </span>
                      {q.difficulty && (
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            q.difficulty === 'Kolay'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : q.difficulty === 'Zor'
                              ? 'bg-rose-500/10 text-rose-400'
                              : 'bg-amber-500/10 text-amber-400'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-mono">
                        ({q.points || 10} Puan)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                        Doğru: <strong className="text-emerald-400">{q.correctAnswer}</strong>
                      </span>
                      <button
                        onClick={() => handleAddSingle(q)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Teste Ekle
                      </button>
                    </div>
                  </div>

                  {/* Question Stem Text */}
                  {q.questionText && (
                    <div className="text-xs text-slate-200 whitespace-pre-line leading-relaxed my-2 pl-7 font-sans">
                      {q.questionText}
                    </div>
                  )}

                  {/* Diagram / Image */}
                  {q.diagramImage && (
                    <div className="my-2 pl-7 flex justify-start">
                      <img
                        src={q.diagramImage}
                        alt="Soru Görseli"
                        className="max-h-36 rounded border border-slate-700 bg-white p-1"
                      />
                    </div>
                  )}

                  {/* Options */}
                  {q.options && q.options.length > 0 && (
                    <div className="pl-7 pt-2 flex flex-wrap gap-3">
                      {q.options.map((opt) => (
                        <div
                          key={opt.key}
                          className={`text-xs px-2.5 py-1 rounded border flex items-center gap-1.5 ${
                            opt.key === q.correctAnswer
                              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-semibold'
                              : 'bg-slate-900/50 border-slate-700/60 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{opt.key})</span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation (if any) */}
                  {q.explanation && (
                    <div className="mt-2.5 pl-7 pt-2 border-t border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs text-slate-400">
            İpucu: Soruların yanındaki kutucukları işaretleyerek topluca testinize ekleyebilirsiniz.
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 min-h-[38px] bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Kapat
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={handleBatchAdd}
                className="px-4 py-2 min-h-[38px] bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Seçilen {selectedIds.size} Soruyu Ekle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
