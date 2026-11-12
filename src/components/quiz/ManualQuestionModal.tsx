import React, { useState, useEffect } from 'react';
import { QuizQuestion, QuizQuestionOption } from '../../types/quiz';
import { MATH_SYMBOLS } from '../../lib/quizSampleData';
import { useToast } from '../Toast';
import {
  X,
  Check,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface ManualQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuestion: (question: QuizQuestion) => void;
  editingQuestion?: QuizQuestion | null;
  nextOrderNumber: number;
}

export const ManualQuestionModal: React.FC<ManualQuestionModalProps> = ({
  isOpen,
  onClose,
  onSaveQuestion,
  editingQuestion,
  nextOrderNumber,
}) => {
  const { showToast } = useToast();

  const [orderNumber, setOrderNumber] = useState<number>(nextOrderNumber);
  const [questionText, setQuestionText] = useState<string>('');
  const [diagramImage, setDiagramImage] = useState<string>('');
  const [optionsCount, setOptionsCount] = useState<4 | 5>(4);
  const [options, setOptions] = useState<QuizQuestionOption[]>([
    { key: 'A', text: '' },
    { key: 'B', text: '' },
    { key: 'C', text: '' },
    { key: 'D', text: '' },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [points, setPoints] = useState<number>(20);
  const [topic, setTopic] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');

  // Synchronize on open or edit
  useEffect(() => {
    if (editingQuestion) {
      setOrderNumber(editingQuestion.orderNumber);
      setQuestionText(editingQuestion.questionText || '');
      setDiagramImage(editingQuestion.diagramImage || editingQuestion.croppedImage || '');
      setOptionsCount(editingQuestion.optionsCount);
      setOptions(
        editingQuestion.options && editingQuestion.options.length > 0
          ? editingQuestion.options
          : [
              { key: 'A', text: '' },
              { key: 'B', text: '' },
              { key: 'C', text: '' },
              { key: 'D', text: '' },
            ]
      );
      setCorrectAnswer(editingQuestion.correctAnswer || 'A');
      setPoints(editingQuestion.points || 20);
      setTopic(editingQuestion.topic || '');
      setExplanation(editingQuestion.explanation || '');
    } else {
      setOrderNumber(nextOrderNumber);
      setQuestionText('');
      setDiagramImage('');
      setOptionsCount(4);
      setOptions([
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ]);
      setCorrectAnswer('A');
      setPoints(20);
      setTopic('');
      setExplanation('');
    }
  }, [editingQuestion, nextOrderNumber, isOpen]);

  // Adjust options array when optionsCount changes
  const handleToggleOptionsCount = (count: 4 | 5) => {
    setOptionsCount(count);
    const keys: ('A' | 'B' | 'C' | 'D' | 'E')[] = count === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
    const updated = keys.map((k) => {
      const existing = options.find((o) => o.key === k);
      return existing || { key: k, text: '' };
    });
    setOptions(updated);
    if (count === 4 && correctAnswer === 'E') {
      setCorrectAnswer('A');
    }
  };

  const handleInsertSymbol = (sym: string) => {
    setQuestionText((prev) => prev + sym);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setDiagramImage(event.target?.result as string);
      showToast('Soru görseli eklendi.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleOptionTextChange = (key: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.key === key ? { ...opt, text } : opt))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!questionText.trim() && !diagramImage) {
      showToast('Lütfen soru metni yazınız veya bir soru görseli ekleyiniz.', 'error');
      return;
    }

    const questionToSave: QuizQuestion = {
      id: editingQuestion ? editingQuestion.id : 'q_man_' + Date.now(),
      orderNumber: Number(orderNumber) || nextOrderNumber,
      questionText: questionText.trim() || undefined,
      diagramImage: diagramImage || undefined,
      croppedImage: editingQuestion?.croppedImage,
      optionsCount,
      options,
      correctAnswer,
      points: Number(points) || 20,
      topic: topic.trim() || undefined,
      explanation: explanation.trim() || undefined,
    };

    onSaveQuestion(questionToSave);
    showToast(`${questionToSave.orderNumber}. Soru başarıyla kaydedildi.`, 'success');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {editingQuestion ? 'Soruyu Düzenle' : 'Manuel Soru Yaz / Oluştur'}
              </h3>
              <p className="text-xs text-slate-500">
                Soru metnini girin, matematik simgeleri ve şıkları tanımlayın.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
          {/* Top metadata row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Soru Numarası</label>
              <input
                type="number"
                min="1"
                required
                value={orderNumber}
                onChange={(e) => setOrderNumber(Number(e.target.value))}
                className="w-full px-3 py-1.5 font-bold font-mono border border-slate-300 rounded-lg text-center"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Soru Puanı</label>
              <input
                type="number"
                min="1"
                required
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-1.5 font-bold font-mono border border-slate-300 rounded-lg text-center"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Kazanım / Konu</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Örn: EBOB - EKOK"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Soru Metni & Matematik Sembolleri */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">
                Soru Metni & Açıklaması
              </label>
              <span className="text-[11px] text-slate-400">
                Matematiksel sembolleri aşağıdan tek tıkla ekleyebilirsiniz.
              </span>
            </div>

            {/* Quick Math Symbols Bar */}
            <div className="flex flex-wrap gap-1 p-2 bg-slate-50 border border-slate-200 rounded-t-lg mb-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase mr-1 self-center">
                Semboller:
              </span>
              {MATH_SYMBOLS.map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleInsertSymbol(sym)}
                  className="px-2 py-0.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded text-xs font-mono font-bold text-slate-800 transition-colors cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Örnek: (x - 3) ve (y + 4) sayıları aralarında asaldır.&#10;&#10;Buna göre, y sayısı x sayısının kaç katıdır?"
              className="w-full px-3 py-2 border border-slate-300 rounded-b-lg font-sans text-xs focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {/* Soru Görseli / Şekil Ekleme */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Soru Görseli / Şekil (İsteğe Bağlı)
              </span>

              {diagramImage && (
                <button
                  type="button"
                  onClick={() => setDiagramImage('')}
                  className="text-rose-600 hover:text-rose-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Görseli Kaldır
                </button>
              )}
            </div>

            {diagramImage ? (
              <div className="text-center bg-white p-2 border border-slate-200 rounded-lg">
                <img
                  src={diagramImage}
                  alt="Soru Şekli"
                  className="max-h-36 mx-auto object-contain rounded"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-medium cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Şekil / Fotoğraf Yükle</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[11px] text-slate-400">
                  Soruda geometri şekli, kutu, tablo veya grafik varsa yükleyebilirsiniz.
                </span>
              </div>
            )}
          </div>

          {/* Şık Sayısı ve Şık Metinleri */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-800">
                Seçenekler & Doğru Cevap
              </label>

              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleToggleOptionsCount(4)}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                    optionsCount === 4 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  4 Şık (A - D / LGS)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleOptionsCount(5)}
                  className={`px-3 py-1 text-xs font-semibold rounded cursor-pointer ${
                    optionsCount === 5 ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  5 Şık (A - E / YKS)
                </button>
              </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {options.map((opt) => {
                const isSelected = correctAnswer === opt.key;
                return (
                  <div
                    key={opt.key}
                    onClick={() => setCorrectAnswer(opt.key)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <button
                      type="button"
                      className={`w-7 h-7 rounded-full font-bold flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {opt.key}
                    </button>
                    <input
                      type="text"
                      value={opt.text || ''}
                      onChange={(e) => handleOptionTextChange(opt.key, e.target.value)}
                      placeholder={`Şık içeriği (Örn: 2², 15, Evet)`}
                      className="flex-1 px-2.5 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-400 bg-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-700 uppercase shrink-0">
                        Doğru
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">
              * Doğru cevabı belirlemek için ilgili seçeneğin harf kutusuna tıklayınız.
            </p>
          </div>

          {/* Çözüm / Açıklama */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Çözüm Notu / Açıklama (Cevap anahtarı için)
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Örn: 28/36 sadeleşirse 7/9 olur. x=10, y=5 bulunur."
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingQuestion ? 'Değişiklikleri Kaydet' : 'Soruyu Ekle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
