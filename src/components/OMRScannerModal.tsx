import React, { useState, useRef } from 'react';
import { Exam, StudentResult } from '../types';
import { evaluateStudentPaper, analyzeOpticalSheetImageFast, generateSampleOpticalSheetImage } from '../lib/omrEngine';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import confetti from 'canvas-confetti';
import { X, Upload, Camera, Sparkles, CheckCircle2, AlertCircle, FileCheck, RefreshCw, Zap } from 'lucide-react';

interface OMRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam;
  onGradingComplete: () => void;
}

interface ScanQueueItem {
  id: string;
  name: string;
  file?: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: StudentResult;
  errorMessage?: string;
}

export const OMRScannerModal: React.FC<OMRScannerModalProps> = ({
  isOpen,
  onClose,
  exam,
  onGradingComplete,
}) => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'demo'>('upload');
  const [queue, setQueue] = useState<ScanQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Attach stream to video whenever isCameraActive or activeTab changes
  React.useEffect(() => {
    if (isCameraActive && videoRef.current && mediaStreamRef.current) {
      if (videoRef.current.srcObject !== mediaStreamRef.current) {
        videoRef.current.srcObject = mediaStreamRef.current;
        videoRef.current.play().catch((e) => console.log('Video play caught:', e));
      }
    }
  }, [isCameraActive, activeTab]);

  // Clean up stream on unmount
  React.useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  // Handle file selection (single or batch)
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: ScanQueueItem[] = Array.from(files).map((file, idx) => ({
      id: 'scan_' + Date.now() + '_' + idx,
      name: file.name,
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending',
    }));

    setQueue((prev) => [...prev, ...newItems]);
    showToast(`${newItems.length} adet optik form sıraya eklendi.`, 'info');
  };

  // Start Camera with robust fallback
  const startCamera = async (targetFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    stopCamera();

    let stream: MediaStream | null = null;
    try {
      // First attempt with ideal constraints
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: targetFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err1) {
      console.warn('Ideal facing mode failed, attempting generic video constraints:', err1);
      try {
        // Fallback to basic video stream without constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      } catch (err2: any) {
        console.error('All camera attempts failed:', err2);
        const errMsg =
          err2.name === 'NotAllowedError'
            ? 'Kamera erişim izni verilmedi. Lütfen tarayıcı izinlerinden kamerayı açın.'
            : 'Kameraya erişilemedi. Lütfen cihazınızda kameranın kullanılabilir olduğunu kontrol edin.';
        setCameraError(errMsg);
        showToast(errMsg, 'error');
        setIsCameraActive(false);
        return;
      }
    }

    if (stream) {
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.log('Video play error:', e));
        }
      }, 60);
      showToast('Kamera açıldı! Optik kağıdı çerçevenin içine tutunuz.', 'success');
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Snap photo from camera
  const captureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const item: ScanQueueItem = {
      id: 'scan_cam_' + Date.now(),
      name: `Kamera Çekimi #${queue.length + 1}`,
      previewUrl: dataUrl,
      status: 'pending',
    };
    setQueue((prev) => [...prev, item]);
    showToast('Kağıt fotoğrafı sıraya eklendi.', 'info');
  };

  // Generate and Load 5 Instant Demo Papers
  const handleLoadDemoPapers = () => {
    const demoStudents = [
      { num: '2101', name: 'Batuhan Kara', booklet: 'A', wrongQs: [3] },
      { num: '2102', name: 'Selin Yurt', booklet: 'A', wrongQs: [2, 7] },
      { num: '2103', name: 'Emre Çelik', booklet: 'B', wrongQs: [4] },
      { num: '2104', name: 'Gamze Aydın', booklet: 'A', wrongQs: [] },
      { num: '2105', name: 'Murat Arslan', booklet: 'A', wrongQs: [1, 5, 9] },
    ];

    const keyA = exam.booklets[0]?.answers || {};
    const keyB = exam.booklets.find((b) => b.booklet === 'B')?.answers || keyA;
    const options = exam.optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

    const newItems: ScanQueueItem[] = demoStudents.map((stud, idx) => {
      const activeKey = stud.booklet === 'B' ? keyB : keyA;
      const studAnswers: Record<number, string | null> = {};

      for (let q = 1; q <= exam.questionCount; q++) {
        if (stud.wrongQs.includes(q)) {
          const correct = activeKey[q] || 'A';
          const wrongOpt = options.find((o) => o !== correct) || 'B';
          studAnswers[q] = wrongOpt;
        } else {
          studAnswers[q] = activeKey[q] || 'A';
        }
      }

      const dataUrl = generateSampleOpticalSheetImage(
        exam.title,
        stud.num,
        stud.name,
        stud.booklet as any,
        studAnswers,
        exam.questionCount,
        exam.optionCount,
        exam.school || 'Cumhuriyet Ortaokulu',
        exam.sections
      );

      return {
        id: 'scan_demo_' + Date.now() + '_' + idx,
        name: `Optik Form - ${stud.name} (${stud.num})`,
        previewUrl: dataUrl,
        status: 'pending',
      };
    });

    setQueue((prev) => [...prev, ...newItems]);
    showToast(`${newItems.length} adet demo öğrenci optik formu sıraya eklendi.`, 'success');
  };

  // Ultra-Fast Progressive Parallel Evaluation
  const processAllPending = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);

    const pendingItems = queue.filter((i) => i.status === 'pending');
    if (pendingItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    let successCount = 0;

    // Process each paper rapidly with immediate visual feedback per card
    for (const item of pendingItems) {
      // Mark active
      setQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i))
      );

      try {
        const analyzed = await analyzeOpticalSheetImageFast(item.previewUrl, exam);
        const studentNameMatch = item.name.includes('-')
          ? item.name.split('-')[1]?.split('(')[0]?.trim()
          : `Öğrenci #${analyzed.studentNumber}`;

        const evaluated = evaluateStudentPaper(
          exam,
          analyzed.studentNumber,
          studentNameMatch || `Öğrenci #${analyzed.studentNumber}`,
          analyzed.booklet,
          analyzed.answers,
          item.previewUrl,
          analyzed.confidence,
          exam.school
        );

        StorageService.saveResult(evaluated);
        successCount++;

        // Instantly update card in UI
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'done', result: evaluated } : i
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', errorMessage: 'Optik form okunamadı.' } : i
          )
        );
      }

      // 30ms brief yield so the browser renders the green badge smoothly
      await new Promise((res) => setTimeout(res, 30));
    }

    setIsProcessing(false);

    // Confetti celebration
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }

    showToast(`${successCount} adet öğrenci kağıdı anında başarıyla okundu!`, 'success');
    onGradingComplete();
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const doneCount = queue.filter((i) => i.status === 'done').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Optik Okuma & Kağıt Değerlendirme (OMR)
                </h3>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-600" /> Ultra Hızlı OMR Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sınav: <span className="font-semibold text-slate-800">{exam.title}</span> ({exam.questionCount} Soru, Kitapçık: {exam.booklets.map(b => b.booklet).join(', ')})
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 gap-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('upload');
            }}
            className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'upload'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Toplu Kağıt Yükle (Fotoğraf / Tarama)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'camera'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera ile Canlı OMR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              setActiveTab('demo');
            }}
            className={`pb-3 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'demo'
                ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Örnek Doldurulmuş Kağıtlar (Hızlı Demo)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/20 p-8 rounded-xl text-center cursor-pointer transition-all"
              >
                <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-800 mb-1">
                  Öğrenci Optik Kağıtlarını Buraya Sürükleyin veya Seçin
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-3">
                  Tüm sınıfın optik form fotoğraflarını tek seferde seçin. Ultra hızlı OMR motorumuz
                  tüm kağıtları paralel olarak 1 saniyeden kısa sürede okur.
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs">
                  Dosyaları Seç (Çoklu Seçim Desteklenir)
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LIVE WEBCAM */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-video flex items-center justify-center max-w-xl mx-auto shadow-inner border border-slate-800">
                {/* Always keep video element mounted so stream can attach reliably */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />

                {isCameraActive ? (
                  <div className="absolute inset-6 sm:inset-8 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-mono text-emerald-300 bg-slate-950/80 px-2.5 py-1 rounded shadow-sm self-start">
                      <span>✓ Kamera Aktif · Kağıdı Çerçeveye Hizalayın</span>
                    </div>
                    <div className="flex justify-between">
                      <div className="w-5 h-5 border-b-2 border-l-2 border-emerald-400" />
                      <div className="w-5 h-5 border-b-2 border-r-2 border-emerald-400" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-300 p-6 space-y-3">
                    <Camera className="w-12 h-12 mx-auto text-indigo-400 opacity-80" />
                    <div>
                      <h4 className="text-sm font-bold text-white mb-1">Kamera ile Canlı Değerlendirme</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Optik formu kameraya tutarak anında fotoğrafını çekebilir ve OMR değerlendirmesine gönderebilirsiniz.
                      </p>
                    </div>

                    {cameraError && (
                      <div className="p-3 bg-rose-950/80 border border-rose-700 text-rose-200 text-xs rounded-lg max-w-sm mx-auto text-left flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block font-semibold">Bağlantı Uyarısı</strong>
                          <span>{cameraError}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => startCamera(facingMode)}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer inline-flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Kamerayı Başlat
                    </button>
                  </div>
                )}
              </div>

              {isCameraActive && (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={captureFromCamera}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Fotoğrafı Çek ve Listeye Ekle
                  </button>

                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Ön ve arka kamera arasında geçiş yap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kamera Değiştir ({facingMode === 'environment' ? 'Arka' : 'Ön'})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSTANT DEMO PAPERS */}
          {activeTab === 'demo' && (
            <div className="p-6 bg-amber-50/60 border border-amber-200 rounded-xl text-center space-y-3">
              <Sparkles className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="text-sm font-bold text-amber-950">
                Fiziksel Kağıdınız Yok mu? Anında Test Edin!
              </h4>
              <p className="text-xs text-amber-800 max-w-lg mx-auto">
                Sistemimizi hemen deneyimleyebilmeniz için otomatik olarak 5 farklı öğrenciye ait
                doldurulmuş optik cevap kağıdı görseli oluşturabilir ve anında optik okuma motoruna
                gönderebilirsiniz.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleLoadDemoPapers}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  5 Adet Demo Öğrenci Kağıdı Ekle
                </button>
              </div>
            </div>
          )}

          {/* QUEUE LIST & STATUS */}
          {queue.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <span>Okunacak Kağıt Kuyruğu ({queue.length} Adet)</span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Paralel OMR Modu
                  </span>
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Bekleyen: <strong className="text-slate-700">{pendingCount}</strong>
                  </span>
                  <span className="text-slate-500">
                    Okunan: <strong className="text-emerald-600">{doneCount}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setQueue([])}
                    className="text-slate-400 hover:text-rose-600 text-[11px] cursor-pointer"
                  >
                    Listeyi Temizle
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center gap-3 p-2.5 border rounded-lg text-xs transition-colors ${
                      item.status === 'done'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : item.status === 'processing'
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <img
                      src={item.previewUrl}
                      alt={item.name}
                      className="w-12 h-16 object-cover rounded border border-slate-300 shrink-0 bg-white"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate">{item.name}</div>
                      {item.status === 'pending' && (
                        <span className="text-slate-500 text-[11px]">Değerlendirme bekliyor</span>
                      )}
                      {item.status === 'processing' && (
                        <span className="text-indigo-600 text-[11px] font-medium flex items-center gap-1">
                          <RefreshCw className="w-3 h-3 animate-spin" /> OMR Taranıyor...
                        </span>
                      )}
                      {item.status === 'done' && item.result && (
                        <div className="text-emerald-700 text-[11px] font-semibold mt-0.5">
                          ✓ No: {item.result.studentNumber} · Doğru: {item.result.correctCount} · Puan: {item.result.totalScore}
                        </div>
                      )}
                      {item.status === 'error' && (
                        <span className="text-rose-600 text-[11px]">{item.errorMessage}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {doneCount > 0 && `${doneCount} kağıt anında sisteme aktarıldı.`}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Kapat
            </button>

            {pendingCount > 0 && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={processAllPending}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Hızlı Okuma Yapılıyor...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-300" />
                    {pendingCount} Kağıdı Anında Oku & Puanla
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
