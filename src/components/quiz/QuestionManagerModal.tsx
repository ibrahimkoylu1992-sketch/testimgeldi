import React from 'react';
import { QuizQuestion } from '../../types/quiz';
import {
  X,
  Layers,
  BookOpen,
  Crop,
  Plus,
  ArrowUp,
  ArrowDown,
  Copy,
  Edit3,
  Trash2,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface QuestionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  totalPoints: number;
  onMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  onDuplicateQuestion: (question: QuizQuestion) => void;
  onEditQuestion: (question: QuizQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenQuestionBank: () => void;
  onOpenPdfCropper: () => void;
  onOpenManualModal: () => void;
  onLoadSampleQuiz: () => void;
}

export const QuestionManagerModal: React.FC<QuestionManagerModalProps> = ({
  isOpen,
  onClose,
  questions,
  totalPoints,
  onMoveQuestion,
  onDuplicateQuestion,
  onEditQuestion,
  onDeleteQuestion,
  onOpenQuestionBank,
  onOpenPdfCropper,
  onOpenManualModal,
  onLoadSampleQuiz,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-slate-950/65 backdrop-blur-xs no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base truncate">
                Soru Listesi & Sıralama Yönetimi
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="tabular-nums font-medium text-slate-700">
                  {questions.length} Soru
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-medium text-slate-700">
                  Toplam {totalPoints} Puan
                </span>
                <span aria-hidden="true">·</span>
                <span>A4 düzeni değişikliklerle anında güncellenir</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold text-xs rounded-lg border border-amber-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Soru Bankası</span>
            </button>
            <button
              type="button"
              onClick={onOpenPdfCropper}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Crop className="w-3.5 h-3.5" />
              <span>PDF&apos;den Kırp</span>
            </button>
            <button
              type="button"
              onClick={onOpenManualModal}
              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Manuel Soru</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Kapat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white">
          {questions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-4">
              <FileText className="w-12 h-12 mx-auto text-slate-300" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-800">
                  Bu test kağıdında henüz soru bulunmuyor
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  PDF dosyasından soru kırpabilir, kazanım odaklı soru bankasından hazır soru seçebilir veya kendiniz soru yazabilirsiniz.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onOpenPdfCropper}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Crop className="w-3.5 h-3.5" />
                  <span>PDF&apos;den Soru Kırp</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenQuestionBank}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Soru Bankasından Seç</span>
                </button>
                <button
                  type="button"
                  onClick={onLoadSampleQuiz}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Örnek Soruları Yükle</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="py-3.5 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-slate-50 rounded-xl transition-colors group"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Question Index */}
                    <span className="w-7 h-7 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0 tabular-nums mt-0.5">
                      {q.orderNumber}
                    </span>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Image Preview */}
                      {(q.croppedImage || q.diagramImage) && (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={q.croppedImage || q.diagramImage}
                            alt={`Soru ${q.orderNumber}`}
                            className="h-14 max-w-[140px] object-contain border border-slate-200 rounded-lg bg-white p-1"
                          />
                          <span className="text-[11px] font-semibold text-indigo-700">
                            {q.croppedImage ? 'Görsel / PDF Kırpması' : 'Soru Şekli'}
                          </span>
                        </div>
                      )}

                      {/* Text Preview */}
                      {q.questionText && (
                        <p className="text-xs sm:text-sm text-slate-800 line-clamp-2 leading-relaxed">
                          {q.questionText}
                        </p>
                      )}

                      {/* Unboxed Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-emerald-700">
                          Doğru: {q.correctAnswer}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-medium text-slate-700">
                          {q.points} Puan
                        </span>
                        {q.topic && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="truncate max-w-[220px] sm:max-w-[260px]">{q.topic}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row Actions */}
                  <div className="flex items-center justify-end sm:justify-start gap-1 shrink-0 pt-1 sm:pt-0.5 pl-10 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => onMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Yukarı Taşı"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-200/70 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
                      title="Aşağı Taşı"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateQuestion(q)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                      title="Kopyala"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditQuestion(q)}
                      className="p-2 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                      title="Soruyu Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                      title="Soruyu Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Toplam <strong className="text-slate-900 tabular-nums">{questions.length}</strong> soru ·{' '}
              <strong className="text-slate-900 tabular-nums">{totalPoints}</strong> puan
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer whitespace-nowrap"
          >
            Tamam &amp; A4 Önizlemeye Dön
          </button>
        </div>
      </div>
    </div>
  );
};
