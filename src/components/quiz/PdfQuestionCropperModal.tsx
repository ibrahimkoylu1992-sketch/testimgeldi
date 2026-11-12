import React, { useState, useRef, useEffect, useCallback } from 'react';
import { QuizQuestion } from '../../types/quiz';
import { useToast } from '../Toast';
import {
  X,
  Upload,
  Crop,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Sparkles,
  HelpCircle,
  Clipboard,
  Maximize2,
  Move,
  Check,
  RotateCcw,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker to reliable CDN
if (typeof window !== 'undefined' && 'Worker' in window) {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('PDF worker config warning:', e);
  }
}

interface PdfQuestionCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddQuestion: (question: QuizQuestion) => void;
  nextOrderNumber: number;
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PdfQuestionCropperModal: React.FC<PdfQuestionCropperModalProps> = ({
  isOpen,
  onClose,
  onAddQuestion,
  nextOrderNumber,
}) => {
  const { showToast } = useToast();

  const [documentType, setDocumentType] = useState<'sample' | 'pdf' | 'image'>('sample');
  const [docTitle, setDocTitle] = useState('8. Sınıf Matematik Tarama Sınavı (Örnek Belge)');
  const [loadingDoc, setLoadingDoc] = useState(false);

  // PDF.js state & caching
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomScale, setZoomScale] = useState(1.0); // 1.0 for fast rasterization

  // Loaded Image state
  const [loadedImage, setLoadedImage] = useState<HTMLImageElement | null>(null);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cropping interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'create' | 'move' | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [cropBox, setCropBox] = useState<CropBox | null>(null);

  // Processed Question Form state
  const [croppedDataUrl, setCroppedDataUrl] = useState<string | null>(null);
  const [questionNumber, setQuestionNumber] = useState(nextOrderNumber);
  const [correctAnswer, setCorrectAnswer] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [optionsCount, setOptionsCount] = useState<4 | 5>(4);
  const [questionPoints, setQuestionPoints] = useState<number>(20);
  const [topicName, setTopicName] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [addedCount, setAddedCount] = useState<number>(0);

  // Keep question number synchronized with parent
  useEffect(() => {
    setQuestionNumber(nextOrderNumber + addedCount);
  }, [nextOrderNumber, addedCount]);

  // Render image to main canvas
  const renderImageToCanvas = useCallback((img: HTMLImageElement, scale: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }, []);

  // Render PDF page to canvas with fast caching
  const renderPdfPage = useCallback(async (pageNumber: number, doc: any, scale: number) => {
    if (!doc) return;
    setLoadingDoc(true);
    try {
      const page = await doc.getPage(pageNumber);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const viewport = page.getViewport({ scale: scale * 1.3 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      setLoadingDoc(false);
    } catch (e) {
      console.error('PDF page render error:', e);
      setLoadingDoc(false);
      showToast('PDF sayfası işlenirken bir sorun oluştu.', 'error');
    }
  }, [showToast]);

  // Load sample image
  const loadSampleDocument = useCallback(() => {
    setLoadingDoc(true);
    setDocumentType('sample');
    setDocTitle('8. Sınıf Matematik 1. Tarama Sınavı (Örnek Şablon)');
    setPdfDoc(null);
    setCurrentPage(1);
    setTotalPages(1);
    setCropBox(null);
    setCroppedDataUrl(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/aistudio/image_6e1294eb.png';
    img.onload = () => {
      setLoadedImage(img);
      setLoadingDoc(false);
      renderImageToCanvas(img, zoomScale);
    };
    img.onerror = () => {
      setLoadingDoc(false);
      showToast('Örnek sınav belgesi yüklenemedi.', 'error');
    };
  }, [zoomScale, renderImageToCanvas, showToast]);

  useEffect(() => {
    if (isOpen && documentType === 'sample' && !loadedImage) {
      loadSampleDocument();
    }
  }, [isOpen, documentType, loadedImage, loadSampleDocument]);

  // Re-render when zoomScale changes
  useEffect(() => {
    if (documentType === 'pdf' && pdfDoc) {
      renderPdfPage(currentPage, pdfDoc, zoomScale);
    } else if (loadedImage) {
      renderImageToCanvas(loadedImage, zoomScale);
    }
  }, [zoomScale, currentPage, pdfDoc, documentType, loadedImage, renderImageToCanvas, renderPdfPage]);

  // Clipboard Paste Handler (Ctrl+V or Snipping Tool)
  const handlePasteEvent = useCallback((event: ClipboardEvent) => {
    if (!isOpen || croppedDataUrl) return;
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          event.preventDefault();
          setLoadingDoc(true);
          setDocumentType('image');
          setDocTitle('Panodan Yapıştırılan Görsel');
          setPdfDoc(null);
          setCurrentPage(1);
          setTotalPages(1);
          setCropBox(null);

          const reader = new FileReader();
          reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
              setLoadedImage(img);
              setLoadingDoc(false);
              renderImageToCanvas(img, zoomScale);
              showToast('Panodaki ekran alıntısı başarıyla yüklendi!', 'success');
            };
            img.src = e.target?.result as string;
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    }
  }, [isOpen, croppedDataUrl, zoomScale, renderImageToCanvas, showToast]);

  useEffect(() => {
    window.addEventListener('paste', handlePasteEvent);
    return () => window.removeEventListener('paste', handlePasteEvent);
  }, [handlePasteEvent]);

  // Manual Clipboard paste button
  const handleClipboardButtonClick = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new Image();
              img.onload = () => {
                setLoadedImage(img);
                setDocumentType('image');
                setDocTitle('Panodan Yapıştırılan Soru');
                renderImageToCanvas(img, zoomScale);
                showToast('Panodaki görsel yüklendi!', 'success');
              };
              img.src = e.target?.result as string;
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      showToast('Panoda görsel bulunamadı. Lütfen Win+Shift+S ile ekran alıntısı alıp tekrar deneyin veya Ctrl+V yapın.', 'info');
    } catch (e) {
      showToast('Pano izni verilemedi. Lütfen sayfada Ctrl+V tuşlarına basarak yapıştırın.', 'info');
    }
  };

  // File Upload Handler (PDF or Image)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCropBox(null);
    setCroppedDataUrl(null);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      setLoadingDoc(true);
      setDocumentType('pdf');
      setDocTitle(file.name);
      setLoadedImage(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadedPdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(loadedPdf);
        setTotalPages(loadedPdf.numPages);
        setCurrentPage(1);
        await renderPdfPage(1, loadedPdf, zoomScale);
        showToast(`PDF yüklendi: ${loadedPdf.numPages} sayfa`, 'success');
      } catch (err) {
        console.error('PDF parsing error:', err);
        showToast('PDF dosyası açılamadı. Görsel (PNG/JPG) yüklemeyi de deneyebilirsiniz.', 'error');
        setLoadingDoc(false);
      }
    } else {
      // Image file (Loads instantaneously!)
      setLoadingDoc(true);
      setDocumentType('image');
      setDocTitle(file.name);
      setPdfDoc(null);
      setCurrentPage(1);
      setTotalPages(1);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setLoadedImage(img);
          setLoadingDoc(false);
          renderImageToCanvas(img, zoomScale);
          showToast('Soru görseli başarıyla yüklendi.', 'success');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Preset Crop Box Selectors
  const applyPresetCrop = (preset: 'left_top' | 'left_bottom' | 'right_top' | 'right_bottom' | 'full_width' | 'clear') => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (preset === 'clear') {
      setCropBox(null);
      return;
    }

    const cw = canvas.width;
    const ch = canvas.height;

    let newBox: CropBox;

    switch (preset) {
      case 'left_top':
        newBox = {
          x: Math.round(cw * 0.04),
          y: Math.round(ch * 0.18),
          w: Math.round(cw * 0.44),
          h: Math.round(ch * 0.28),
        };
        break;
      case 'left_bottom':
        newBox = {
          x: Math.round(cw * 0.04),
          y: Math.round(ch * 0.50),
          w: Math.round(cw * 0.44),
          h: Math.round(ch * 0.32),
        };
        break;
      case 'right_top':
        newBox = {
          x: Math.round(cw * 0.52),
          y: Math.round(ch * 0.04),
          w: Math.round(cw * 0.44),
          h: Math.round(ch * 0.42),
        };
        break;
      case 'right_bottom':
        newBox = {
          x: Math.round(cw * 0.52),
          y: Math.round(ch * 0.50),
          w: Math.round(cw * 0.44),
          h: Math.round(ch * 0.35),
        };
        break;
      case 'full_width':
        newBox = {
          x: Math.round(cw * 0.04),
          y: Math.round(ch * 0.15),
          w: Math.round(cw * 0.92),
          h: Math.round(ch * 0.35),
        };
        break;
    }

    setCropBox(newBox);
    showToast('Hazır alan seçildi. Şimdi "Seçili Alanı Kırp"a basınız.', 'info');
  };

  // Mouse / Touch coordinates
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(canvas.width, clientX - rect.left));
    const y = Math.max(0, Math.min(canvas.height, clientY - rect.top));

    return { x, y };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (croppedDataUrl) return;
    const coords = getCanvasCoordinates(e);

    // If clicking inside existing cropBox, allow moving it!
    if (
      cropBox &&
      coords.x >= cropBox.x &&
      coords.x <= cropBox.x + cropBox.w &&
      coords.y >= cropBox.y &&
      coords.y <= cropBox.y + cropBox.h
    ) {
      setDragMode('move');
      setIsDragging(true);
      setStartPos({ x: coords.x - cropBox.x, y: coords.y - cropBox.y });
      return;
    }

    // Otherwise create new selection
    setDragMode('create');
    setIsDragging(true);
    setStartPos(coords);
    setCropBox({ x: coords.x, y: coords.y, w: 0, h: 0 });
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !startPos) return;
    const current = getCanvasCoordinates(e);

    if (dragMode === 'move' && cropBox) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const newX = Math.max(0, Math.min(canvas.width - cropBox.w, current.x - startPos.x));
      const newY = Math.max(0, Math.min(canvas.height - cropBox.h, current.y - startPos.y));
      setCropBox({ ...cropBox, x: newX, y: newY });
      return;
    }

    if (dragMode === 'create') {
      const x = Math.min(startPos.x, current.x);
      const y = Math.min(startPos.y, current.y);
      const w = Math.abs(current.x - startPos.x);
      const h = Math.abs(current.y - startPos.y);
      setCropBox({ x, y, w, h });
    }
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragMode(null);

    if (cropBox && (cropBox.w < 20 || cropBox.h < 20)) {
      setCropBox(null);
      setStartPos(null);
    }
  };

  // Crop the selected region into a PNG data URL
  const handlePerformCrop = () => {
    if (!cropBox || !canvasRef.current || cropBox.w < 20 || cropBox.h < 20) {
      showToast('Lütfen önce belgeden sorunun üzerini seçiniz veya hızlı şablonlardan birine tıklayınız.', 'info');
      return;
    }

    const sourceCanvas = canvasRef.current;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropBox.w;
    cropCanvas.height = cropBox.h;
    const cropCtx = cropCanvas.getContext('2d');

    if (!cropCtx) return;

    cropCtx.drawImage(
      sourceCanvas,
      cropBox.x,
      cropBox.y,
      cropBox.w,
      cropBox.h,
      0,
      0,
      cropBox.w,
      cropBox.h
    );

    const dataUrl = cropCanvas.toDataURL('image/png');
    setCroppedDataUrl(dataUrl);
    showToast('Soru kırpıldı! Doğru cevabı belirleyip teste ekleyin.', 'success');
  };

  // Confirm and add the cropped question
  const handleConfirmAddQuestion = () => {
    if (!croppedDataUrl) return;

    const optLabels = optionsCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    const newQ: QuizQuestion = {
      id: 'q_crop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      orderNumber: Number(questionNumber) || nextOrderNumber + addedCount,
      questionText: questionText.trim() || undefined,
      croppedImage: croppedDataUrl,
      optionsCount,
      options: optLabels.map((key) => ({ key: key as any, text: '' })),
      correctAnswer,
      points: Number(questionPoints) || 20,
      topic: topicName.trim() || undefined,
    };

    onAddQuestion(newQ);
    setAddedCount((prev) => prev + 1);
    setCroppedDataUrl(null);
    setCropBox(null);
    setQuestionText('');
    setTopicName('');
    showToast(`${newQ.orderNumber}. Soru teste eklendi!`, 'success');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-xs no-print overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                  Hızlı Soru Kırpma & Ekran Alıntısı Aracı
                </h3>
                {addedCount > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    +{addedCount} Soru Eklendi
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate max-w-md">
                {docTitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Upload, Paste, Presets, Zoom */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* File & Clipboard actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>PDF / Resim Yükle</span>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={handleClipboardButtonClick}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Windows Snipping Tool (Win+Shift+S) ile kopyaladığınız ekran görüntüsünü yapıştırın"
            >
              <Clipboard className="w-3.5 h-3.5" />
              <span>Panodan Yapıştır (Ctrl+V)</span>
            </button>

            <button
              type="button"
              onClick={loadSampleDocument}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Örnek Şablon</span>
            </button>
          </div>

          {/* Quick Presets for Fast 1-Click Cropping */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-1.5">Hızlı Şablon:</span>
            <button
              onClick={() => applyPresetCrop('left_top')}
              className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 text-[11px] transition-colors"
            >
              Sol Üst
            </button>
            <button
              onClick={() => applyPresetCrop('left_bottom')}
              className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 text-[11px] transition-colors"
            >
              Sol Alt
            </button>
            <button
              onClick={() => applyPresetCrop('right_top')}
              className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 text-[11px] transition-colors"
            >
              Sağ Üst
            </button>
            <button
              onClick={() => applyPresetCrop('right_bottom')}
              className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 text-[11px] transition-colors"
            >
              Sağ Alt
            </button>
            <button
              onClick={() => applyPresetCrop('full_width')}
              className="px-2 py-0.5 bg-white hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium rounded border border-slate-200 text-[11px] transition-colors"
            >
              Tam Genişlik
            </button>
          </div>

          {/* Zoom & Page Navigation Controls */}
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] px-1 font-semibold text-slate-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="p-1 text-slate-600 hover:text-slate-900 disabled:opacity-30"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.2))}
                className="p-1 text-slate-600 hover:text-slate-900"
                title="Küçült"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-600">
                %{Math.round(zoomScale * 100)}
              </span>
              <button
                onClick={() => setZoomScale((s) => Math.min(2.0, s + 0.2))}
                className="p-1 text-slate-600 hover:text-slate-900"
                title="Büyüt"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas & Cropper Body */}
        <div className="flex-1 overflow-auto bg-slate-800 p-4 relative flex justify-center items-start select-none">
          {loadingDoc && (
            <div className="absolute inset-0 z-30 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-medium">Belge sayfası işleniyor, lütfen bekleyin...</p>
            </div>
          )}

          <div
            className="relative cursor-crosshair shadow-2xl rounded bg-white overflow-hidden"
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {/* The rendered document canvas */}
            <canvas ref={canvasRef} className="block" />

            {/* Selection Crop Box overlay */}
            {cropBox && cropBox.w > 5 && cropBox.h > 5 && (
              <div
                className="absolute border-2 border-indigo-500 bg-indigo-500/20 shadow-lg pointer-events-none"
                style={{
                  left: `${cropBox.x}px`,
                  top: `${cropBox.y}px`,
                  width: `${cropBox.w}px`,
                  height: `${cropBox.h}px`,
                }}
              >
                {/* Visual Label */}
                <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  Seçilen Soru ({Math.round(cropBox.w)} × {Math.round(cropBox.h)} px)
                </div>
                {/* 4 Corner points */}
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            <span>
              İpucu: Ekran Alıntısı Aracı ile kopyaladığınız soruyu <strong>Ctrl + V</strong> ile anında yapıştırabilirsiniz.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {cropBox && (
              <button
                onClick={() => setCropBox(null)}
                className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Seçimi Sıfırla
              </button>
            )}

            <button
              onClick={handlePerformCrop}
              disabled={!cropBox || cropBox.w < 20}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Crop className="w-4 h-4" />
              <span>Seçili Alanı Kırp</span>
            </button>
          </div>
        </div>

        {/* STEP 2 MODAL OVERLAY: Configure Answer & Points */}
        {croppedDataUrl && (
          <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
              <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Kırpılan Soruyu Sınava Ekle</span>
                </div>
                <button
                  onClick={() => setCroppedDataUrl(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Preview Image */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex justify-center">
                  <img
                    src={croppedDataUrl}
                    alt="Kırpılan Soru"
                    className="max-h-48 object-contain rounded"
                  />
                </div>

                {/* Soru No & Puan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Soru Sıra No:
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={questionNumber}
                      onChange={(e) => setQuestionNumber(Number(e.target.value))}
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:bg-white focus:outline-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Puan Değeri:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={questionPoints}
                      onChange={(e) => setQuestionPoints(Number(e.target.value))}
                      className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 font-bold text-slate-800 focus:bg-white focus:outline-indigo-600"
                    />
                  </div>
                </div>

                {/* Şık Sayısı & Doğru Cevap */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">
                      Doğru Cevap Anahtarı:
                    </label>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setOptionsCount(4)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          optionsCount === 4
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        4 Şıklı (A-D)
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptionsCount(5)}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                          optionsCount === 5
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        5 Şıklı (A-E)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {(optionsCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D']).map(
                      (opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setCorrectAnswer(opt as any)}
                          className={`py-2 rounded-xl font-extrabold text-sm border-2 transition-all cursor-pointer ${
                            correctAnswer === opt
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Konu / Kazanım */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Konu / Kazanım (İsteğe Bağlı):
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: Üslü İfadeler, Çarpanlar ve Katlar"
                    value={topicName}
                    onChange={(e) => setTopicName(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:bg-white focus:outline-indigo-600"
                  />
                </div>
              </div>

              <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCroppedDataUrl(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
                >
                  Geri
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddQuestion}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Soru {questionNumber}'i Teste Ekle</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
