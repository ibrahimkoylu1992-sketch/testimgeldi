import React, { useState } from 'react';
import { QuizDocument, QuizQuestion } from '../../types/quiz';
import { FileText, Layers, Check, ChevronLeft, ChevronRight, LayoutTemplate } from 'lucide-react';

interface TestSheetPaperProps {
  quiz: QuizDocument;
  showAnswerKey?: boolean;
  showMiniOpticalGrid?: boolean;
}

export const TestSheetPaper: React.FC<TestSheetPaperProps> = ({
  quiz,
  showAnswerKey = false,
  showMiniOpticalGrid = true,
}) => {
  const { settings, questions } = quiz;

  // Active page tab view: 'all' or page index 0, 1, 2... or 'answers'
  const [activeTab, setActiveTab] = useState<'all' | number | 'answers'>('all');

  // How many questions fit on page 1 vs subsequent pages
  // Page 1 has the large header & student table, so 4-5 questions fit nicely.
  // Subsequent pages only have a slim header, so 6-8 questions fit.
  const customPerPage = settings.questionsPerPage && settings.questionsPerPage > 0 ? settings.questionsPerPage : 0;

  const page1Capacity = customPerPage > 0 ? customPerPage : 4;
  const subsequentCapacity = customPerPage > 0 ? customPerPage : 6;

  // Paginate questions
  const pages: QuizQuestion[][] = [];
  if (questions.length === 0) {
    pages.push([]);
  } else {
    let remaining = [...questions];
    // Page 1
    const p1 = remaining.splice(0, page1Capacity);
    pages.push(p1);

    // Page 2, 3...
    while (remaining.length > 0) {
      pages.push(remaining.splice(0, subsequentCapacity));
    }
  }

  const totalPagesCount = pages.length;

  // Helper to render question text with bold stem detection
  const renderQuestionText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 text-xs text-slate-900 leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Detect bold question stem (commonly begins with "Buna göre", "olduğuna göre", "Aşağıdakilerden", etc.)
          const isStem =
            trimmed.startsWith('Buna göre') ||
            trimmed.startsWith('olduğuna göre') ||
            trimmed.startsWith('Hangisi') ||
            trimmed.startsWith('Yukarıdaki') ||
            trimmed.startsWith('Buna dayanılarak') ||
            trimmed.includes('hangisi');

          return (
            <p
              key={idx}
              className={`${
                isStem ? 'font-bold text-slate-950 pt-1' : 'font-normal text-slate-900'
              }`}
            >
              {trimmed}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to render options row
  const renderOptions = (q: QuizQuestion) => {
    const options = q.options || [];
    const count = q.optionsCount || 4;
    const currentOptions = options.slice(0, count);

    // Check if options are short (e.g. 2², 15) so they fit in 1 horizontal row
    const isShort = currentOptions.every((o) => (o.text?.length || 0) < 12);

    return (
      <div
        className={`pt-2.5 ${
          isShort
            ? 'flex flex-wrap items-center justify-between gap-2'
            : 'grid grid-cols-2 gap-2'
        }`}
      >
        {currentOptions.map((opt) => (
          <div key={opt.key} className="flex items-baseline gap-1 text-xs">
            <span className="font-bold font-sans text-slate-950">
              {opt.key})
            </span>
            <span className="font-medium font-sans text-slate-900">
              {opt.text || ''}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render a single question block
  const renderQuestionBlock = (q: QuizQuestion) => {
    return (
      <div
        key={q.id}
        className={`py-3.5 ${
          settings.showQuestionDividerLines ? 'border-b border-slate-300' : ''
        } break-inside-avoid page-break-inside-avoid`}
      >
        {/* Question Header & Number */}
        <div className="flex items-start gap-2 mb-1.5">
          <span className="font-bold text-sm text-slate-950 font-sans tracking-tight">
            {q.orderNumber})
          </span>
          {q.points && (
            <span className="text-[10px] text-slate-400 font-mono self-center">
              ({q.points} Puan)
            </span>
          )}
          {q.topic && (
            <span className="text-[9px] text-slate-400 font-sans ml-auto italic">
              {q.topic}
            </span>
          )}
        </div>

        {/* Cropped Image (if question was cropped from PDF/document) */}
        {q.croppedImage && (
          <div className="my-2 max-w-full overflow-hidden flex justify-center bg-white">
            <img
              src={q.croppedImage}
              alt={`${q.orderNumber}. Soru`}
              className="max-h-56 max-w-full object-contain"
            />
          </div>
        )}

        {/* Diagram / Illustration (if question has a separate graphic) */}
        {q.diagramImage && !q.croppedImage && (
          <div className="my-2 max-w-full overflow-hidden flex justify-center bg-white">
            <img
              src={q.diagramImage}
              alt={`${q.orderNumber}. Soru Şekli`}
              className="max-h-44 max-w-full object-contain"
            />
          </div>
        )}

        {/* Question Text */}
        {q.questionText && renderQuestionText(q.questionText)}

        {/* Options Row */}
        {q.options && q.options.some((o) => o.text && o.text.trim().length > 0) && (
          renderOptions(q)
        )}
      </div>
    );
  };

  // Render an individual A4 Page
  const renderSingleA4Sheet = (pageQuestions: QuizQuestion[], pageIndex: number, totalPages: number) => {
    const isPageOne = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;

    // Split page questions into 2 columns
    const totalOnPage = pageQuestions.length;
    const midPoint = Math.ceil(totalOnPage / 2);
    const leftCol = settings.twoColumnLayout ? pageQuestions.slice(0, midPoint) : pageQuestions;
    const rightCol = settings.twoColumnLayout ? pageQuestions.slice(midPoint) : [];

    return (
      <div
        key={`a4-page-${pageIndex}`}
        className="a4-sheet bg-white text-slate-950 mx-auto shadow-2xl border border-slate-300 print:shadow-none print:border-none select-none font-sans relative flex flex-col justify-between mb-8 print:mb-0"
        style={{
          width: '210mm',
          minHeight: '297mm',
          height: '297mm',
          padding: '12mm 14mm',
          boxSizing: 'border-box',
          pageBreakAfter: isLastPage ? 'auto' : 'always',
          breakAfter: isLastPage ? 'auto' : 'page',
        }}
      >
        {/* Content Container */}
        <div className="flex-1 flex flex-col">
          {/* HEADER SECTION */}
          {isPageOne ? (
            /* Page 1 Header */
            settings.headerStyle === 'meb_formal' ? (
              <div className="border-2 border-slate-900 p-3 mb-3 text-center shrink-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-300 text-xs font-bold text-slate-800">
                  <span>T.C. MİLLÎ EĞİTİM BAKANLIĞI</span>
                  <span>{settings.schoolName?.toUpperCase()}</span>
                  <span>{settings.academicYear}</span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-tight py-1 text-slate-950">
                  {settings.examTitle}
                </h1>
                <div className="flex items-center justify-between pt-1 border-t border-slate-300 text-[11px] text-slate-600">
                  <span>Ders: {settings.courseName} · {settings.gradeLevel}</span>
                  <span>Süre: {settings.durationText}</span>
                  <span>Tarih: {settings.dateText}</span>
                </div>
              </div>
            ) : (
              /* Standard Turkish Exam Layout matching user sample (ADI, SOYADI, NO) */
              <div className="pb-2.5 mb-2 border-b border-slate-900 shrink-0">
                <div className="text-center mb-3">
                  <h1 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-slate-950">
                    {settings.examTitle}
                  </h1>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {settings.schoolName} · {settings.academicYear}
                  </span>
                </div>

                {settings.showStudentTable && (
                  <div className="flex items-end justify-between text-xs font-semibold text-slate-900 px-2 pt-0.5">
                    <div className="space-y-1.5 w-64">
                      <div className="flex items-center">
                        <span className="w-16 font-bold">ADI:</span>
                        <div className="flex-1 border-b border-dotted border-slate-600 h-4"></div>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 font-bold">SOYADI:</span>
                        <div className="flex-1 border-b border-dotted border-slate-600 h-4"></div>
                      </div>
                      <div className="flex items-center">
                        <span className="w-16 font-bold">NO:</span>
                        <div className="w-24 border-b border-dotted border-slate-600 h-4"></div>
                        <span className="ml-4 font-bold">SINIF:</span>
                        <div className="w-16 border-b border-dotted border-slate-600 h-4"></div>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="font-extrabold text-sm underline tracking-widest text-slate-950">
                        SORULAR
                      </span>
                    </div>

                    {settings.showScoreBox && (
                      <div className="border border-slate-800 p-2 text-center w-28 bg-slate-50/50">
                        <span className="text-[10px] font-bold block text-slate-700 uppercase">
                          ALDIĞI PUAN
                        </span>
                        <div className="h-6 flex items-center justify-center font-bold text-base text-slate-900 font-mono">
                          / 100
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          ) : (
            /* Page 2, 3... Compact Header */
            <div className="pb-2 mb-3 border-b-2 border-slate-900 flex items-center justify-between text-xs font-bold text-slate-900 shrink-0">
              <span className="uppercase">{settings.schoolName}</span>
              <span className="font-extrabold">{settings.examTitle}</span>
              <span className="font-mono text-slate-600">SAYFA {pageIndex + 1} / {totalPages}</span>
            </div>
          )}

          {/* QUESTIONS BODY (2-COLUMN OR 1-COLUMN) */}
          <div className="flex-1 relative">
            {pageQuestions.length === 0 ? (
              <div className="py-24 text-center text-slate-400 italic text-sm">
                Bu sayfada henüz soru bulunmuyor.
              </div>
            ) : settings.twoColumnLayout ? (
              <div className="grid grid-cols-2 gap-x-6 relative h-full">
                {/* Central Vertical Divider Line down the page */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-900 pointer-events-none" />

                {/* Left Column */}
                <div className="pr-3 space-y-2">
                  {leftCol.map((q) => renderQuestionBlock(q))}
                </div>

                {/* Right Column */}
                <div className="pl-3 space-y-2">
                  {rightCol.map((q) => renderQuestionBlock(q))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pageQuestions.map((q) => renderQuestionBlock(q))}
              </div>
            )}
          </div>

          {/* MINI OPTICAL BUBBLE GRID (Only on last page if enabled) */}
          {isLastPage && showMiniOpticalGrid && settings.showMiniOpticalGrid && questions.length > 0 && (
            <div className="mt-4 pt-2.5 border-t-2 border-slate-900 break-inside-avoid shrink-0">
              <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200">
                <span className="text-[10px] font-bold tracking-wider text-slate-900 uppercase">
                  CEVAP KODLAMA ALANI (OPTİK FORM)
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  Doğru şıkkı kurşun kalemle taşmayacak şekilde doldurunuz.
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 py-1">
                {questions.map((q, idx) => {
                  const optLabels = q.optionsCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
                  return (
                    <div
                      key={q.id}
                      className="flex items-center gap-1 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200"
                    >
                      <span className="font-bold w-4 text-right text-slate-800">
                        {idx + 1}.
                      </span>
                      <div className="flex items-center gap-0.5">
                        {optLabels.map((lbl) => (
                          <div
                            key={lbl}
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-semibold text-slate-700 hover:bg-slate-200"
                          >
                            {lbl}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* OFFICIAL FOOTER ON EVERY PAGE */}
        <div className="pt-2 mt-2 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500 shrink-0 font-sans">
          <span>testimgeldi Ölçme ve Değerlendirme Sistemi · testimgeldi.com</span>
          <span className="italic font-medium">Başarılar Dileriz.</span>
          <span className="font-mono font-semibold">
            Sayfa {pageIndex + 1} / {totalPages}
          </span>
        </div>
      </div>
    );
  };

  // Teacher Answer Key Page
  const renderTeacherAnswerKeyPage = () => {
    return (
      <div
        className="a4-sheet bg-white text-slate-950 mx-auto shadow-2xl border border-slate-300 print:shadow-none print:border-none select-none font-sans relative flex flex-col justify-between mb-8 print:mb-0"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '12mm 14mm',
          boxSizing: 'border-box',
          pageBreakBefore: 'always',
          breakBefore: 'page',
        }}
      >
        <div>
          <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
            <span className="text-xs font-bold text-indigo-700 block uppercase tracking-wider">
              ÖĞRETMEN DÖKÜMANI
            </span>
            <h2 className="text-base font-extrabold uppercase text-slate-950 mt-1">
              {settings.examTitle} - CEVAP ANAHTARI & KAZANIM TABLOSU
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {settings.schoolName} · {settings.courseName} ({settings.gradeLevel}) · Toplam {questions.length} Soru
            </p>
          </div>

          <table className="w-full text-xs border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                <th className="py-2 px-2 text-center w-12 border-r border-slate-300">Soru No</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-300">Doğru Şık</th>
                <th className="py-2 px-3 text-center w-16 border-r border-slate-300">Puan</th>
                <th className="py-2 px-3 text-left border-r border-slate-300">Konu / Kazanım</th>
                <th className="py-2 px-3 text-left">Açıklama / Çözüm İpucu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50">
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-300">
                    {q.orderNumber}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 font-extrabold text-sm text-emerald-700">
                    {q.correctAnswer}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 font-mono">
                    {q.points} P
                  </td>
                  <td className="py-2 px-3 border-r border-slate-300 font-medium text-slate-700">
                    {q.topic || 'Genel Soru'}
                  </td>
                  <td className="py-2 px-3 text-slate-500 italic text-[11px]">
                    {q.explanation || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-500">
          <span>testimgeldi Optik Okuma Sistemi</span>
          <span className="font-mono">Cevap Anahtarı Sayfası</span>
        </div>
      </div>
    );
  };

  return (
    <div id="printable-quiz-sheet" className="w-full">
      {/* PAGE TABS CONTROLLER (Hidden when printing) */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {/* All Pages Tab */}
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tüm Sayfalar ({totalPagesCount})</span>
          </button>

          {/* Individual Page Tabs */}
          {pages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                activeTab === idx
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Sayfa {idx + 1}</span>
            </button>
          ))}

          {/* Answer Key Tab */}
          <button
            onClick={() => setActiveTab('answers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'answers'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Cevap Anahtarı</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="hidden sm:inline">
            Sayfa boyutu: <strong>A4 (210×297mm)</strong>
          </span>
          <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            Toplam {totalPagesCount} Sayfa
          </span>
        </div>
      </div>

      {/* RENDER SHEETS */}
      {/* 1. On Screen Preview: Depends on activeTab */}
      <div className="print:hidden">
        {activeTab === 'all' && (
          <div className="space-y-8">
            {pages.map((pQuestions, pIdx) =>
              renderSingleA4Sheet(pQuestions, pIdx, totalPagesCount)
            )}
            {showAnswerKey && renderTeacherAnswerKeyPage()}
          </div>
        )}

        {typeof activeTab === 'number' && (
          <div>
            {renderSingleA4Sheet(pages[activeTab] || [], activeTab, totalPagesCount)}
          </div>
        )}

        {activeTab === 'answers' && renderTeacherAnswerKeyPage()}
      </div>

      {/* 2. Print Output: ALWAYS RENDER ALL PAGES FOR BROWSER PRINT / PDF */}
      <div className="hidden print:block">
        {pages.map((pQuestions, pIdx) =>
          renderSingleA4Sheet(pQuestions, pIdx, totalPagesCount)
        )}
        {showAnswerKey && renderTeacherAnswerKeyPage()}
      </div>
    </div>
  );
};
