import React, { useState } from 'react';
import { SupportTicket, SupportTicketCategory } from '../../types/support';
import { StorageService } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import {
  X,
  Send,
  MessageSquare,
  Upload,
  Image as ImageIcon,
  CheckCircle,
  HelpCircle,
  Paperclip,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: SupportTicketCategory;
  defaultTitle?: string;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'Hata / Teknik Sorun',
  defaultTitle = '',
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState(defaultTitle);
  const [category, setCategory] = useState<SupportTicketCategory>(defaultCategory);
  const [email, setEmail] = useState(currentUser?.email || '');
  const [message, setMessage] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      showToast('Dosya boyutu en fazla 8 MB olabilir.', 'error');
      return;
    }

    setAttachmentName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachmentDataUrl(event.target?.result as string);
      showToast('Ekli dosya / ekran görüntüsü yüklendi.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !message.trim() || !email.trim()) {
      showToast('Lütfen başlık, e-posta ve mesaj alanlarını doldurunuz.', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const newTicket: SupportTicket = {
        id: 'ticket_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: title.trim(),
        category,
        email: email.trim(),
        userName: currentUser?.name || 'Kullanıcı',
        userRole: currentUser?.role || 'teacher',
        userId: currentUser?.id,
        message: message.trim(),
        attachmentDataUrl: attachmentDataUrl || undefined,
        attachmentName: attachmentName || undefined,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      StorageService.saveSupportTicket(newTicket);
      showToast('Sorun / istek bildiriminiz başarıyla sistem yöneticisine iletildi!', 'success');

      // Reset form
      setTitle('');
      setMessage('');
      setAttachmentDataUrl(null);
      setAttachmentName(null);
      onClose();
    } catch (err) {
      console.error('Error saving support ticket:', err);
      showToast('Bildirim kaydedilirken bir hata oluştu.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">
                Sorun & İstek Bildir
              </h3>
              <p className="text-[11px] text-slate-300">
                Sistem yöneticisine (Süper Admin) doğrudan mesaj ve ekran görüntüsü iletin.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Category & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kategori:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 font-medium text-slate-800 focus:bg-white focus:outline-indigo-600"
              >
                <option value="Hata / Teknik Sorun">Hata / Teknik Sorun</option>
                <option value="Öneri & İstek">Öneri & İstek</option>
                <option value="Optik Okuma Yardımı">Optik Okuma Yardımı</option>
                <option value="Kullanıcı & Üyelik">Kullanıcı & Üyelik</option>
                <option value="Diğer">Diğer</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Bildirim Başlığı: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Örn: Kamerada köşe kareleri yakalanmıyor..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-600"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Geri Dönüş E-Posta Adresiniz: <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="ornek@okul.k12.tr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-600"
            />
          </div>

          {/* Detailed Message */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Açıklama / Mesajınız: <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Karşılaştığınız sorunu veya istediğiniz yeni özelliği mümkün olduğunca açık ve adım adım yazınız..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-indigo-600 leading-relaxed resize-none"
            />
          </div>

          {/* Attachment Upload */}
          <div className="border border-dashed border-slate-300 rounded-xl p-3 bg-slate-50/70">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-700">Ekli Dosya veya Ekran Görüntüsü (İsteğe Bağlı)</span>
              </div>
              {attachmentDataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentDataUrl(null);
                    setAttachmentName(null);
                  }}
                  className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  Kaldır
                </button>
              )}
            </div>

            {!attachmentDataUrl ? (
              <label className="flex flex-col items-center justify-center py-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer transition-colors text-center px-4">
                <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                <span className="font-semibold text-indigo-700">Ekran görüntüsü veya dosya seçin</span>
                <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG veya PDF (Maks. 8 MB)</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
                {attachmentDataUrl.startsWith('data:image/') ? (
                  <img
                    src={attachmentDataUrl}
                    alt="Ek"
                    className="w-14 h-14 object-cover rounded border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-bold text-xs">
                    PDF
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 truncate">{attachmentName}</div>
                  <div className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="w-3 h-3" />
                    Gönderilmeye hazır
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <span className="text-[11px] text-slate-400">
              Bildiriminiz doğrudan Süper Admin paneline kaydedilir.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{submitting ? 'Gönderiliyor...' : 'Bildirimi Gönder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
