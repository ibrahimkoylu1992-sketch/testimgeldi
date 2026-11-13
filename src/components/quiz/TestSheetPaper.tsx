import React, { useState, useRef, useEffect } from 'react';
import { QuizDocument, QuizQuestion } from '../../types/quiz';
import { FileText, Layers, Check, Maximize2, ZoomIn, ZoomOut, Edit3 } from 'lucide-react';

interface TestSheetPaperProps {
  quiz: QuizDocument;
  showAnswerKey?: boolean;
  showMiniOpticalGrid?: boolean;
  onEditQuestion?: (question: QuizQuestion) => void;
}

const A4_WIDTH_PX = 794; // 210mm at 96dpi
const A4_HEIGHT_PX = 1123; // 297mm at 96dpi

const ScaledA4Wrapper: React.FC<{
  scale: number;
  children: React.ReactNode;
}> = ({ scale, children }) => {
  const innerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
  });

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.offsetWidth || A4_WIDTH_PX;
      const h = el.offsetHeight || A4_HEIGHT_PX;
      setSize((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  if (Math.abs(scale - 1) < 0.005) {
    return (
      <div className="mx-auto" style={{ width: '210mm' }}>
        <div ref={innerRef}>{children}</div>
      </div>
    );
  }

  return (
    <div
      className="mx-auto relative"
      style={{
        width: `${Math.round(size.width * scale)}px`,
        height: `${Math.round(size.height * scale)}px`,
      }}
    >
      <div
        ref={innerRef}
        style={{
          width: '210mm',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export const TestSheetPaper: React.FC<TestSheetPaperProps> = ({
  quiz,
  showAnswerKey = false,
  showMiniOpticalGrid = true,
  onEditQuestion,
}) => {
  const { settings, questions } = quiz;

  // Active page tab view: 'all' or page index 0, 1, 2... or 'answers'
  const [activeTab, setActiveTab] = useState<'all' | number | 'answers'>('all');

  // Zoom mode: 'fit' automatically scales A4 to viewport width (up to 100%)
  const [zoomMode, setZoomMode] = useState<'fit' | 0.75 | 1 | 1.15>('fit');
  const [fitScale, setFitScale] = useState<number>(1);
  const previewAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = previewAreaRef.current;
    if (!el) return;

    const updateFitScale = () => {
      const availableWidth = el.clientWidth;
      if (!availableWidth) return;
      // Leave slight breathing room (16px) so paper border/shadow never clips
      const computed = Math.min(1, Math.max(0.32, (availableWidth - 16) / A4_WIDTH_PX));
      setFitScale(Number(computed.toFixed(3)));
    };

    updateFitScale();
    const ro = new ResizeObserver(updateFitScale);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeScale = zoomMode === 'fit' ? fitScale : zoomMode;

  // How many questions fit on page 1 vs subsequent pages
  const customPerPage = settings.questionsPerPage && settings.questionsPerPage > 0 ? settings.questionsPerPage : 0;

  const page1Capacity = customPerPage > 0 ? customPerPage : 4;
  const subsequentCapacity = customPerPage > 0 ? customPerPage : 6;

  // Paginate questions
  const pages: QuizQuestion[][] = [];
  if (questions.length === 0) {
    pages.push([]);
  } else {
    const remaining = [...questions];
    const p1 = remaining.splice(0, page1Capacity);
    pages.push(p1);

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
  const renderQuestionBlock = (q: QuizQuestion, interactive: boolean) => {
    return (
      <div
        key={q.id}
        className={`py-3.5 relative group/q ${
          settings.showQuestionDividerLines ? 'border-b border-slate-300' : ''
        } break-inside-avoid page-break-inside-avoid`}
      >
        {/* Subtle Hover Edit Trigger (screen only) */}
        {interactive && onEditQuestion && (
          <button
            type="button"
            onClick={() => onEditQuestion(q)}
            className="no-print opacity-0 group-hover/q:opacity-100 focus:opacity-100 transition-opacity absolute top-2 right-0 px-2 py-1 rounded-md bg-indigo-600 text-white text-[10px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer z-10"
            title="Bu soruyu düzenle"
          >
            <Edit3 className="w-3 h-3" />
            <span>Düzenle</span>
          </button>
        )}

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

        {/* Cropped Image */}
        {q.croppedImage && (
          <div className="my-2 max-w-full overflow-hidden flex justify-center bg-white">
            <img
              src={q.croppedImage}
              alt={`${q.orderNumber}. Soru`}
              className="max-h-56 max-w-full object-contain"
            />
          </div>
        )}

        {/* Diagram / Illustration */}
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
  const renderSingleA4Sheet = (
    pageQuestions: QuizQuestion[],
    pageIndex: number,
    totalPages: number,
    interactive = true
  ) => {
    const isPageOne = pageIndex === 0;
    const isLastPage = pageIndex === totalPages - 1;

    const totalOnPage = pageQuestions.length;
    const midPoint = Math.ceil(totalOnPage / 2);
    const leftCol = settings.twoColumnLayout ? pageQuestions.slice(0, midPoint) : pageQuestions;
    const rightCol = settings.twoColumnLayout ? pageQuestions.slice(midPoint) : [];

    return (
      <div
        key={`a4-page-${pageIndex}-${interactive ? 'screen' : 'print'}`}
        className="a4-sheet bg-white text-slate-950 mx-auto shadow-xl border border-slate-300 print:shadow-none print:border-none select-none font-sans relative flex flex-col justify-between"
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
                Bu sayfada henüz soru bulunmuyor. Üstteki &quot;Soru Listesi&quot; veya soru ekleme butonlarını kullanabilirsiniz.
              </div>
            ) : settings.twoColumnLayout ? (
              <div className="grid grid-cols-2 gap-x-6 relative h-full">
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-900 pointer-events-none" />

                <div className="pr-3 space-y-2">
                  {leftCol.map((q) => renderQuestionBlock(q, interactive))}
                </div>

                <div className="pl-3 space-y-2">
                  {rightCol.map((q) => renderQuestionBlock(q, interactive))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pageQuestions.map((q) => renderQuestionBlock(q, interactive))}
              </div>
            )}
          </div>

          {/* MINI OPTICAL BUBBLE GRID */}
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
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-semibold text-slate-700"
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
        className="a4-sheet bg-white text-slate-950 mx-auto shadow-xl border border-slate-300 print:shadow-none print:border-none select-none font-sans relative flex flex-col justify-between"
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
              {settings.examTitle} - CEVAP ANAHTARI &amp; KAZANIM TABLOSU
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
                  <td className="py-2 px-2 text-center font-bold border-r border-slate-300 tabular-nums">
                    {q.orderNumber}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 font-extrabold text-sm text-emerald-700">
                    {q.correctAnswer}
                  </td>
                  <td className="py-2 px-3 text-center border-r border-slate-300 font-mono tabular-nums">
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
      {/* PAGE TABS & ZOOM CONTROLLER (Hidden when printing) */}
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {/* All Pages Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
              type="button"
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
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
            type="button"
            onClick={() => setActiveTab('answers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'answers'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Cevap Anahtarı</span>
          </button>
        </div>

        {/* Right: Zoom Controls + Metadata */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setZoomMode('fit')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                zoomMode === 'fit'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Sayfayı ekrana tam sığdır"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Ekrana Sığdır</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomMode(0.75)}
              className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer tabular-nums ${
                zoomMode === 0.75
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ZoomOut className="w-3 h-3" />
              <span>%75</span>
            </button>
            <button
              type="button"
              onClick={() => setZoomMode(1)}
              className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer tabular-nums ${
                zoomMode === 1
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              %100
            </button>
            <button
              type="button"
              onClick={() => setZoomMode(1.15)}
              className={`px-2 py-1 text-xs font-semibold rounded-md flex items-center gap-0.5 transition-colors cursor-pointer tabular-nums ${
                zoomMode === 1.15
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ZoomIn className="w-3 h-3" />
              <span>%115</span>
            </button>
          </div>

          <span className="hidden md:inline text-xs text-slate-500">
            A4 (210×297mm) · <span className="tabular-nums font-medium text-slate-700">%{Math.round(activeScale * 100)}</span>
          </span>
        </div>
      </div>

      {/* RENDER SHEETS */}
      {/* 1. On Screen Preview (Auto-scaled, zero horizontal overflow) */}
      <div
        ref={previewAreaRef}
        className={`no-print print:hidden w-full ${zoomMode !== 'fit' && activeScale > fitScale ? 'overflow-x-auto' : 'overflow-x-hidden'}`}
      >
        {activeTab === 'all' && (
          <div className="space-y-8 pb-2">
            {pages.map((pQuestions, pIdx) => (
              <ScaledA4Wrapper key={`wrap-${pIdx}`} scale={activeScale}>
                {renderSingleA4Sheet(pQuestions, pIdx, totalPagesCount, true)}
              </ScaledA4Wrapper>
            ))}
            {showAnswerKey && (
              <ScaledA4Wrapper scale={activeScale}>
                {renderTeacherAnswerKeyPage()}
              </ScaledA4Wrapper>
            )}
          </div>
        )}

        {typeof activeTab === 'number' && (
          <div className="pb-2">
            <ScaledA4Wrapper scale={activeScale}>
              {renderSingleA4Sheet(pages[activeTab] || [], activeTab, totalPagesCount, true)}
            </ScaledA4Wrapper>
          </div>
        )}

        {activeTab === 'answers' && (
          <div className="pb-2">
            <ScaledA4Wrapper scale={activeScale}>
              {renderTeacherAnswerKeyPage()}
            </ScaledA4Wrapper>
          </div>
        )}
      </div>

      {/* 2. Print Output: ALWAYS RENDER ALL PAGES AT TRUE 1:1 A4 SIZE */}
      <div className="hidden print:block space-y-0">
        {pages.map((pQuestions, pIdx) =>
          renderSingleA4Sheet(pQuestions, pIdx, totalPagesCount, false)
        )}
        {showAnswerKey && renderTeacherAnswerKeyPage()}
      </div>
    </div>
  );
};
