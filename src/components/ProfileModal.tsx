import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../lib/storage';
import { useToast } from './Toast';
import {
  User,
  Mail,
  Phone,
  School,
  BookOpen,
  Plus,
  X,
  Check,
  ShieldCheck,
  Clock,
  GraduationCap,
  MessageSquare,
  Send,
} from 'lucide-react';
import { SupportTicketModal } from './support/SupportTicketModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupportTicket?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSupportTicket,
}) => {
  const {
    currentUser,
    refreshUser,
    switchUser,
    addCustomBranch,
    removeCustomBranch,
    addCustomSchool,
    removeCustomSchool,
    addCustomClass,
    removeCustomClass,
  } = useAuth();
  const { showToast } = useToast();

  if (!isOpen || !currentUser) return null;

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [school, setSchool] = useState(currentUser.school || '');
  const [studentNumber, setStudentNumber] = useState(currentUser.studentNumber || '');
  const [gradeLevel, setGradeLevel] = useState(currentUser.gradeLevel || '');

  // Teacher custom branches, classes, and schools
  const [branches, setBranches] = useState<string[]>(() =>
    StorageService.getUserBranches(currentUser)
  );
  const [newBranch, setNewBranch] = useState('');

  const [classes, setClasses] = useState<string[]>(() =>
    StorageService.getUserClasses(currentUser)
  );
  const [newClass, setNewClass] = useState('');

  const [schools, setSchools] = useState<string[]>(() =>
    StorageService.getUserSchools(currentUser)
  );
  const [newSchoolInput, setNewSchoolInput] = useState('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  // Keep state synchronized with currentUser whenever opened
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setPhone(currentUser.phone || '');
      setSchool(currentUser.school || '');
      setStudentNumber(currentUser.studentNumber || '');
      setGradeLevel(currentUser.gradeLevel || '');
      setBranches(StorageService.getUserBranches(currentUser));
      setClasses(StorageService.getUserClasses(currentUser));
      setSchools(StorageService.getUserSchools(currentUser));
    }
  }, [currentUser, isOpen]);

  const handleAddBranch = () => {
    const trimmed = newBranch.trim();
    if (!trimmed) return;
    if (branches.includes(trimmed)) {
      showToast('Bu branş zaten listenizde ekli.', 'info');
      return;
    }
    const updated = addCustomBranch(trimmed);
    setBranches(updated);
    setNewBranch('');
    showToast(`"${trimmed}" branşı başarıyla listenize eklendi.`, 'success');
  };

  const handleRemoveBranch = (br: string) => {
    if (branches.length <= 1) {
      showToast('En az 1 branş bulunmalıdır.', 'error');
      return;
    }
    const updated = removeCustomBranch(br);
    setBranches(updated);
    showToast(`"${br}" branşı listeden kaldırıldı.`, 'info');
  };

  const handleAddClass = () => {
    const trimmed = newClass.trim();
    if (!trimmed) return;
    if (classes.includes(trimmed)) {
      showToast('Bu sınıf zaten listenizde ekli.', 'info');
      return;
    }
    const updated = addCustomClass(trimmed);
    setClasses(updated);
    setNewClass('');
    showToast(`"${trimmed}" sınıfı başarıyla listenize eklendi.`, 'success');
  };

  const handleRemoveClass = (cl: string) => {
    if (classes.length <= 1) {
      showToast('En az 1 sınıf bulunmalıdır.', 'error');
      return;
    }
    const updated = removeCustomClass(cl);
    setClasses(updated);
    showToast(`"${cl}" sınıfı listeden kaldırıldı.`, 'info');
  };

  const handleAddSchool = () => {
    const trimmed = newSchoolInput.trim();
    if (!trimmed) return;
    if (schools.includes(trimmed)) {
      showToast('Bu okul zaten listenizde ekli.', 'info');
      return;
    }
    const updated = addCustomSchool(trimmed);
    setSchools(updated);
    if (!school) setSchool(trimmed);
    setNewSchoolInput('');
    showToast(`"${trimmed}" okulu başarıyla listenize eklendi.`, 'success');
  };

  const handleRemoveSchool = (sch: string) => {
    if (schools.length <= 1) {
      showToast('En az 1 okul bulunmalıdır.', 'error');
      return;
    }
    const updated = removeCustomSchool(sch);
    setSchools(updated);
    if (school === sch) setSchool(updated[0] || '');
    showToast(`"${sch}" okulu listeden kaldırıldı.`, 'info');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedSchool = school.trim() || schools[0] || 'Cumhuriyet Ortaokulu';
    const updatedUser = StorageService.updateUser(currentUser.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      school: selectedSchool,
      studentNumber: currentUser.role === 'student' ? studentNumber.trim() : undefined,
      gradeLevel: currentUser.role === 'student' ? gradeLevel.trim() : undefined,
      myBranches: branches,
      customBranches: branches,
      myClasses: classes,
      customClasses: classes,
      mySchools: schools,
      customSchools: schools,
    });

    if (updatedUser) {
      switchUser(updatedUser);
    } else {
      refreshUser();
    }
    showToast('Profil ve tercihleriniz başarıyla kaydedildi.', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Kullanıcı Profilim & Tercihler</h3>
              <p className="text-xs text-slate-500">
                Kişisel bilgilerinizi, telefonunuzu ve ilgilendiğiniz ders/sınıfları yönetin.
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

        <form onSubmit={handleSaveProfile} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Kişisel Bilgiler */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
              1. Genel Bilgiler & İletişim
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ad Soyad</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  E-Posta Adresi
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefon Numarası (Güvenlik & Doğrulama İçin)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555 123 4567"
                    className="w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  İleride iki adımlı güvenli giriş (SMS OTP) için kullanılacaktır.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Okul Adı</label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    placeholder="Örn: Cumhuriyet Ortaokulu"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Öğrenciye özel bilgiler */}
            {currentUser.role === 'student' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Öğrenci No</label>
                  <input
                    type="text"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sınıf</label>
                  <input
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Öğretmene Özel Branş ve Sınıf Filtreleri */}
          {currentUser.role !== 'student' && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                  2. İlgilendiğim Branşlar (Yalnızca Bunları Göreyim)
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Sınav oluştururken yalnızca burada eklediğiniz dersler listenizde çıkar, gereksiz diğer dersleri görmezsiniz.
                </p>

                {/* Add new branch */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddBranch();
                      }
                    }}
                    placeholder="Yeni branş ekle (Örn: Matematik, Geometri, Robotik)"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>

                {/* Branches pills */}
                <div className="flex flex-wrap gap-2">
                  {branches.map((br) => (
                    <div
                      key={br}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg font-semibold"
                    >
                      <span>{br}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBranch(br)}
                        className="text-indigo-400 hover:text-indigo-800 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                  3. Girdiğim Sınıflar & Şubeler (Yalnızca Bunları Göreyim)
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Yalnızca kendi girdiğiniz şubeleri tanımlayın; sınav oluştururken sadece bunlar görünecektir.
                </p>

                {/* Add new class */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                    placeholder="Yeni sınıf ekle (Örn: 8-A, 11-Sayısal, Mezun-B)"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>

                {/* Classes pills */}
                <div className="flex flex-wrap gap-2">
                  {classes.map((cl) => (
                    <div
                      key={cl}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-300 text-slate-800 rounded-lg font-semibold"
                    >
                      <span>{cl}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cl)}
                        className="text-slate-400 hover:text-slate-800 ml-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Okullar */}
              <div className="pt-2">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                  4. Görev Yaptığım / İlgilendiğim Okullar
                </h4>
                <p className="text-[11px] text-slate-500 mb-3">
                  Sınav hazırladığınız okulları tanımlayın. Sınav oluştururken bu okullardan birini seçebilirsiniz.
                </p>

                {/* Add new school */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSchoolInput}
                    onChange={(e) => setNewSchoolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSchool();
                      }
                    }}
                    placeholder="Yeni okul adı ekle (Örn: Cumhuriyet Ortaokulu)"
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddSchool}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ekle
                  </button>
                </div>

                {/* Schools pills */}
                <div className="flex flex-wrap gap-2">
                  {schools.map((sch) => (
                    <div
                      key={sch}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg font-semibold"
                    >
                      <School className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{sch}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSchool(sch)}
                        className="text-emerald-400 hover:text-rose-700 ml-1 cursor-pointer"
                        title="Okulu Kaldır"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Destek ve Sorun/İstek Bildirimi */}
          <div className="pt-4 border-t border-slate-200">
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-amber-950 text-xs">Sorun veya Yeni İstek Bildir</h5>
                  <p className="text-[11px] text-amber-800">
                    Sistemde yaşadığınız bir teknik sorunu veya eklenmesini istediğiniz bir özelliği doğrudan Süper Admin'e iletin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (onOpenSupportTicket) {
                    onOpenSupportTicket();
                  } else {
                    setIsSupportModalOpen(true);
                  }
                }}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Bildirim Formu Aç</span>
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400">
              testimgeldi v2.4 · Güvenli Profil Yönetimi
            </span>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto min-h-[42px] px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Profili & Tercihleri Kaydet
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Support Ticket Modal inside Profile */}
      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
