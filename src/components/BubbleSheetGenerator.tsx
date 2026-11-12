import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import { Printer, Plus, Trash2, Layers, Check, Download, School } from 'lucide-react';

interface SheetSubjectSection {
  id: string;
  name: string;
  questionCount: number;
}

export const BubbleSheetGenerator: React.FC = () => {
  const { currentUser, addCustomSchool } = useAuth();
  const { showToast } = useToast();

  const teacherSchools = currentUser
    ? StorageService.getUserSchools(currentUser)
    : ['Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu', 'Merkez Anadolu Lisesi'];
  const teacherBranches = currentUser
    ? StorageService.getUserBranches(currentUser)
    : ['Matematik', 'Türkçe', 'Fen Bilimleri'];

  const [examTitle, setExamTitle] = useState('testimgeldi - Çoklu Ders Optik Değerlendirme Formu');
  const [schoolName, setSchoolName] = useState(currentUser?.school || teacherSchools[0] || 'Cumhuriyet Ortaokulu');
  const [optionCount, setOptionCount] = useState<number>(4); // 4 or 5
  const [layoutMode, setLayoutMode] = useState<'single' | 'double'>('double'); // 1 or 2 per A4
  const [showIdGrid, setShowIdGrid] = useState<boolean>(true);

  // Inline custom school addition
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [newSchoolInput, setNewSchoolInput] = useState('');

  const handleCreateCustomSchool = () => {
    const trimmed = newSchoolInput.trim();
    if (!trimmed) return;
    addCustomSchool(trimmed);
    setSchoolName(trimmed);
    setNewSchoolInput('');
    setIsAddingSchool(false);
    showToast(`"${trimmed}" okulu eklendi ve seçildi.`, 'success');
  };

  // Subject sections list (allows 1 or multiple subjects on the same sheet!)
  const [sections, setSections] = useState<SheetSubjectSection[]>([
    { id: 'sec_1', name: teacherBranches[0] || 'Matematik', questionCount: 20 },
    { id: 'sec_2', name: teacherBranches[1] || 'Fen Bilimleri', questionCount: 20 },
  ]);

  const [newSubjectName, setNewSubjectName] = useState(teacherBranches[2] || 'Türkçe');
  const [newSubjectCount, setNewSubjectCount] = useState(15);
  const [isAddingSection, setIsAddingSection] = useState(false);

  const options = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];
  const booklets = ['A', 'B', 'C', 'D'];
  const idDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const idColumns = 4;

  // Robust print function with isolated iframe
  const handlePrint = () => {
    try {
      const printableElem = document.getElementById('printable-optical-sheets');
      if (!printableElem) {
        window.print();
        return;
      }

      const printIframe = document.createElement('iframe');
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);

      const doc = printIframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${examTitle}</title>
              <meta charset="utf-8" />
              <style>
                @page { size: A4 portrait; margin: 8mm; }
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #000; }
                * { box-sizing: border-box; }
                .no-print { display: none !important; }
                .print-break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
              </style>
              <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
            </head>
            <body>
              <div style="width: 100%; max-width: 210mm; margin: 0 auto;">
                ${printableElem.innerHTML}
              </div>
            </body>
          </html>
        `);
        doc.close();

        setTimeout(() => {
          printIframe.contentWindow?.focus();
          printIframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3000);
        }, 400);

        showToast('Yazdırma penceresi açıldı.', 'info');
        return;
      }
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
    }

    // Direct fallback
    window.print();
  };

  // High Resolution A4 PNG / PDF-ready Image Exporter
  const handleDownloadImage = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1240;
      canvas.height = 1754;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const formsCount = layoutMode === 'double' ? 2 : 1;
      const formHeight = layoutMode === 'double' ? 820 : 1670;
      const padding = 35;

      for (let f = 0; f < formsCount; f++) {
        const formY = padding + f * (formHeight + 45);

        // Border
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = 3;
        ctx.strokeRect(padding, formY, canvas.width - padding * 2, formHeight);

        // Corner Markers
        const mSize = 20;
        ctx.fillStyle = '#020617';
        ctx.fillRect(padding + 10, formY + 10, mSize, mSize);
        ctx.fillRect(canvas.width - padding - 10 - mSize, formY + 10, mSize, mSize);
        ctx.fillRect(padding + 10, formY + formHeight - 10 - mSize, mSize, mSize);
        ctx.fillRect(canvas.width - padding - 10 - mSize, formY + formHeight - 10 - mSize, mSize, mSize);

        // Header Title
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(examTitle.toUpperCase(), canvas.width / 2, formY + 45);

        ctx.fillStyle = '#475569';
        ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(`${schoolName} · Toplam ${totalQuestions} Soru · Kitapçık: A/B/C/D`, canvas.width / 2, formY + 70);

        ctx.beginPath();
        ctx.moveTo(padding + 20, formY + 86);
        ctx.lineTo(canvas.width - padding - 20, formY + 86);
        ctx.strokeStyle = '#CBD5E1';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Student Info
        ctx.fillStyle = '#1E293B';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('ÖĞRENCİ ADI SOYADI: ___________________________', padding + 40, formY + 115);
        ctx.fillText('SINIF / ŞUBE: _______________   TARİH: ___________', padding + 40, formY + 140);

        // Booklet
        ctx.fillText('KİTAPÇIK: ', padding + 40, formY + 172);
        booklets.forEach((b, bIdx) => {
          const bx = padding + 130 + bIdx * 32;
          const by = formY + 168;
          ctx.strokeStyle = '#0F172A';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(bx, by, 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(b, bx, by + 4);
        });

        // Student ID Grid
        if (showIdGrid) {
          const idBoxX = canvas.width - padding - 240;
          ctx.textAlign = 'left';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('ÖĞRENCİ NO (KODLAYINIZ):', idBoxX, formY + 112);

          for (let col = 0; col < 4; col++) {
            const colX = idBoxX + col * 28;
            ctx.strokeStyle = '#64748B';
            ctx.strokeRect(colX, formY + 120, 22, 18);

            for (let row = 0; row < 10; row++) {
              const digitY = formY + 155 + row * 16;
              ctx.strokeStyle = '#94A3B8';
              ctx.beginPath();
              ctx.arc(colX + 11, digitY, 6.5, 0, Math.PI * 2);
              ctx.stroke();
              ctx.font = 'bold 9px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(row.toString(), colX + 11, digitY + 3);
            }
          }
        }

        // Subject sections
        const numCols = Math.min(sections.length, 3);
        const colWidth = (canvas.width - padding * 2 - 80) / numCols;
        const secStartY = formY + 330;

        sections.forEach((sec, sIdx) => {
          const colX = padding + 40 + sIdx * colWidth;

          // Section title
          ctx.fillStyle = '#0F172A';
          ctx.fillRect(colX, secStartY, colWidth - 20, 22);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sec.name.toUpperCase() + ` (${sec.questionCount} Soru)`, colX + (colWidth - 20) / 2, secStartY + 15);

          // Bubbles
          const maxRows = Math.min(sec.questionCount, 22);
          for (let q = 1; q <= maxRows; q++) {
            const qY = secStartY + 30 + (q - 1) * 20;
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = '#1E293B';
            ctx.textAlign = 'right';
            ctx.fillText(`${q}.`, colX + 20, qY + 4);

            options.forEach((opt, oIdx) => {
              const bx = colX + 35 + oIdx * 22;
              const by = qY;
              ctx.strokeStyle = '#64748B';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
              ctx.stroke();

              ctx.font = '9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText(opt, bx, by + 3);
            });
          }
        });
      }

      const link = document.createElement('a');
      link.download = `testimgeldi-optik-form-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('A4 Yüksek Kalite Optik Form Resmi (PNG/PDF Baskı Hazır) İndirildi!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      showToast('İndirme sırasında hata oluştu.', 'error');
    }
  };

  const handleAddSection = () => {
    if (!newSubjectName.trim()) return;
    const newSec: SheetSubjectSection = {
      id: 'sec_' + Date.now(),
      name: newSubjectName.trim(),
      questionCount: Number(newSubjectCount) || 15,
    };
    setSections([...sections, newSec]);
    setNewSubjectName('');
    setIsAddingSection(false);
  };

  const handleRemoveSection = (id: string) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((s) => s.id !== id));
  };

  const totalQuestions = sections.reduce((sum, s) => sum + s.questionCount, 0);

  // Render an individual optical form
  const renderSingleSheet = (formIdx: number) => {
    return (
      <div
        key={formIdx}
        className="bg-white border-2 border-slate-900 p-5 rounded-none relative text-slate-900 select-none print-break-inside-avoid"
        style={{ minHeight: layoutMode === 'double' ? '138mm' : '265mm' }}
      >
        {/* Corner fiducial markers for OMR readers */}
        <div className="absolute top-2 left-2 w-4 h-4 bg-slate-950" />
        <div className="absolute top-2 right-2 w-4 h-4 bg-slate-950" />
        <div className="absolute bottom-2 left-2 w-4 h-4 bg-slate-950" />
        <div className="absolute bottom-2 right-2 w-4 h-4 bg-slate-950" />

        {/* Header */}
        <div className="text-center pb-2.5 border-b-2 border-slate-900 mb-3">
          <div className="flex items-center justify-between px-6">
            <span className="text-[10px] font-mono tracking-widest text-slate-500 font-bold uppercase">
              TC-OMR-MULTI
            </span>
            <div className="text-center">
              <h2 className="text-sm font-extrabold uppercase tracking-tight text-slate-900">
                {examTitle}
              </h2>
              <span className="text-[11px] font-semibold text-slate-600 block">
                {schoolName} · Toplam {totalQuestions} Soru
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 font-bold">A4 BASKI</span>
          </div>
        </div>

        {/* Top Info Grid: Student Name & Student ID Bubble Matrix & Booklet */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-slate-300 mb-3 text-xs">
          {/* Left: Written Student info */}
          <div className="col-span-6 space-y-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                Öğrenci Adı Soyadı:
              </span>
              <div className="h-6 border border-slate-400 bg-slate-50/40 rounded-none px-2 flex items-center font-medium text-slate-800 text-xs">
                &nbsp;
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                  Sınıf / Şube:
                </span>
                <div className="h-5 border border-slate-400 bg-slate-50/40 rounded-none"></div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-700 block mb-0.5">
                  Tarih:
                </span>
                <div className="h-5 border border-slate-400 bg-slate-50/40 rounded-none"></div>
              </div>
            </div>

            {/* Booklet Selection */}
            <div className="pt-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-800 block mb-1">
                Kitapçık Türü
              </span>
              <div className="flex items-center gap-3">
                {booklets.map((b) => (
                  <div key={b} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-700 mb-0.5">{b}</span>
                    <div className="w-5 h-5 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold text-[9px] text-slate-600">
                      {b}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Student ID Coding Grid */}
          {showIdGrid && (
            <div className="col-span-6 border-l border-slate-300 pl-4">
              <div className="text-[10px] font-bold uppercase text-slate-800 mb-1 flex items-center justify-between">
                <span>Öğrenci Numarası</span>
                <span className="text-[9px] font-normal text-slate-500">(Kodlayınız)</span>
              </div>
              <div className="flex gap-1.5 mb-1">
                {Array.from({ length: idColumns }).map((_, cIdx) => (
                  <div
                    key={cIdx}
                    className="w-5 h-5 border border-slate-600 bg-slate-100 flex items-center justify-center text-xs font-mono font-bold"
                  ></div>
                ))}
              </div>
              <div className="space-y-0.5">
                {idDigits.map((digit) => (
                  <div key={digit} className="flex gap-1.5 items-center">
                    {Array.from({ length: idColumns }).map((_, cIdx) => (
                      <div
                        key={cIdx}
                        className="w-5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-mono font-medium text-slate-600"
                      >
                        {digit}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MULTI-SUBJECT SECTIONS GRID */}
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {sections.map((sec, secIdx) => {
              return (
                <div
                  key={sec.id}
                  className="border border-slate-800 p-2.5 bg-slate-50/20"
                >
                  <div className="bg-slate-900 text-white px-2 py-1 text-center font-bold uppercase text-[10px] tracking-wide mb-2 flex items-center justify-between">
                    <span>{sec.name}</span>
                    <span className="font-mono text-[9px] font-normal">{sec.questionCount} Soru</span>
                  </div>

                  <div className="space-y-1">
                    {Array.from({ length: sec.questionCount }).map((_, rIdx) => {
                      const qNum = rIdx + 1;
                      return (
                        <div key={qNum} className="flex items-center gap-1.5 py-0.5">
                          <span className="w-5 text-right font-mono font-bold text-slate-800 text-[10px] tabular-nums">
                            {qNum}.
                          </span>
                          <div className="flex items-center gap-1">
                            {options.map((opt) => (
                              <div
                                key={opt}
                                className="w-4 h-4 rounded-full border border-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-800 bg-white"
                              >
                                {opt}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optical Footer instruction */}
        <div className="mt-4 pt-2 border-t border-slate-300 flex items-center justify-between text-[9px] text-slate-500 font-mono">
          <span>testimgeldi Multi-OMR Engine © 2026</span>
          <div className="flex items-center gap-2">
            <span>Doğru:</span>
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-900" />
            <span>Hatalı:</span>
            <span className="line-through">✕</span>
          </div>
          <span>www.testimgeldi.com</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Control Panel */}
      <div className="no-print bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-indigo-600" />
              Çoklu Ders Optik Form Şablonu Oluşturucu & Yazdır
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Tek bir optik kağıda birden fazla ders (Matematik, Fizik, Türkçe vb.) ekleyerek A4 baskıya uygun çıktı alın.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadImage}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              title="Yüksek çözünürlüklü A4 PNG olarak doğrudan bilgisayarınıza indirin"
            >
              <Download className="w-4 h-4" />
              Optik Formu İndir (A4 PNG / PDF Baskı)
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Yazdır / PDF Olarak Kaydet
            </button>
          </div>
        </div>

        {/* Basic Settings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sınav / Form Başlığı</label>
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-700">Okul Adı</label>
              {!isAddingSchool && (
                <button
                  type="button"
                  onClick={() => setIsAddingSchool(true)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Yeni Ekle
                </button>
              )}
            </div>

            {isAddingSchool ? (
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
                  className="flex-1 px-2.5 py-1 text-xs border border-indigo-400 rounded-lg focus:outline-none"
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
                  onClick={() => setIsAddingSchool(false)}
                  className="px-1.5 py-1 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <select
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                {teacherSchools.map((sch) => (
                  <option key={sch} value={sch}>{sch}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Sayfa Düzeni</label>
            <div className="flex rounded-lg border border-slate-300 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setLayoutMode('double')}
                className={`flex-1 py-1 text-xs font-semibold rounded cursor-pointer ${
                  layoutMode === 'double' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                1 Sayfada 2 Form (Tasarruflu)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('single')}
                className={`flex-1 py-1 text-xs font-semibold rounded cursor-pointer ${
                  layoutMode === 'single' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Tam Sayfa (1 Form)
              </button>
            </div>
          </div>
        </div>

        {/* Subject Sections Manager */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              Optik Formdaki Ders Bölümleri ({sections.length} Ders · Toplam {totalQuestions} Soru)
            </span>

            {!isAddingSection && (
              <button
                type="button"
                onClick={() => setIsAddingSection(true)}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Yeni Ders Ekle</span>
              </button>
            )}
          </div>

          {/* New Section Input Row */}
          {isAddingSection && (
            <div className="p-3 bg-white border border-indigo-300 rounded-lg flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[150px]">
                <select
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                >
                  {teacherBranches.map((br) => (
                    <option key={br} value={br}>{br}</option>
                  ))}
                </select>
              </div>

              <div className="w-28">
                <select
                  value={newSubjectCount}
                  onChange={(e) => setNewSubjectCount(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  {[5, 10, 15, 20, 25, 30, 40].map((c) => (
                    <option key={c} value={c}>{c} Soru</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddSection}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer"
              >
                Dersi Ekle
              </button>
              <button
                type="button"
                onClick={() => setIsAddingSection(false)}
                className="px-2 py-1.5 text-slate-500 hover:text-slate-700 text-xs cursor-pointer"
              >
                İptal
              </button>
            </div>
          )}

          {/* List of defined subject sections */}
          <div className="flex flex-wrap gap-2 pt-1">
            {sections.map((sec) => (
              <div
                key={sec.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs shadow-xs"
              >
                <span className="font-bold text-slate-900">{sec.name}</span>
                <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {sec.questionCount} Soru
                </span>
                {sections.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSection(sec.id)}
                    className="text-slate-400 hover:text-rose-600 ml-1 cursor-pointer"
                    title="Dersi Sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Sheet Viewport */}
      <div className="bg-slate-200 p-6 md:p-8 rounded-xl shadow-inner max-w-4xl mx-auto overflow-x-auto">
        <div className="text-center text-xs text-slate-500 mb-3 no-print font-medium flex items-center justify-center gap-2">
          <span>Aşağıdaki alan A4 baskı çıktısı önizlemesidir. Yazıcıdan çıktı alabilir veya yüksek çözünürlüklü indirebilirsiniz.</span>
        </div>

        <div id="printable-optical-sheets" className="bg-white mx-auto shadow-xl p-8 space-y-8" style={{ width: '210mm' }}>
          {layoutMode === 'double' ? (
            <div className="space-y-6">
              {renderSingleSheet(1)}
              <div className="border-t-2 border-dashed border-slate-400 my-4 text-center text-[10px] text-slate-400 font-mono no-print">
                ✂️ Buradan Kesiniz (2. Öğrenci Formu)
              </div>
              {renderSingleSheet(2)}
            </div>
          ) : (
            renderSingleSheet(1)
          )}
        </div>
      </div>
    </div>
  );
};
