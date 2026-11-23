import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService, INITIAL_ADMIN_EMAIL } from '../lib/storage';
import { hashPassword } from '../lib/password';
import { User, Exam, SubscriptionRequest, UserRole } from '../types';
import { useToast } from './Toast';
import {
  Shield,
  Users,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  KeyRound,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Edit2,
  Check,
  X,
  Phone,
  School,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Mail,
  Send,
  Server,
  MessageSquare,
  Paperclip,
  ExternalLink,
  FileText,
  Trash2,
} from 'lucide-react';
import { SupportTicket } from '../types/support';

interface AdminPanelProps {
  onSelectExam: (exam: Exam) => void;
  onNavigateToExams: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onSelectExam,
  onNavigateToExams,
}) => {
  const { currentUser, switchUser, isSuperAdmin, isAdmin } = useAuth();
  const { showToast } = useToast();

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Yetkisiz Erişim (403)</h2>
        <p className="text-slate-600 mb-6 text-xs">
          Yönetici (Admin) paneline yalnızca Admin veya Süper Admin yetkisine sahip kullanıcılar erişebilir. Öğretmenler paket taleplerini görüntüleyemez veya onaylayamaz.
        </p>
        <button
          onClick={onNavigateToExams}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
        >
          Sınavlarıma Dön
        </button>
      </div>
    );
  }

  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [exams, setExams] = useState<Exam[]>(StorageService.getExams());
  const [results, setResults] = useState(StorageService.getAllResults());
  const [subRequests, setSubRequests] = useState<SubscriptionRequest[]>(StorageService.getSubscriptionRequests());
  const [tickets, setTickets] = useState<SupportTicket[]>(() => StorageService.getSupportTickets());
  const [ticketFilter, setTicketFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [selectedTicketForDetail, setSelectedTicketForDetail] = useState<SupportTicket | null>(null);

  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [selectedTab, setSelectedTab] = useState<'requests' | 'users' | 'exams' | 'email-smtp' | 'tickets' | 'settings'>('requests');

  // SMTP Configuration State
  const [smtpProvider, setSmtpProvider] = useState<'gmail' | 'custom'>('custom');
  const [gmailUser, setGmailUser] = useState('');
  const [gmailAppPassword, setGmailAppPassword] = useState('');
  const [smtpHost, setSmtpHost] = useState('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Load current SMTP configuration from server
  React.useEffect(() => {
    fetch('/api/admin/smtp-config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSmtpConfigured(!!data.isConfigured);
          if (data.provider === 'custom') setSmtpProvider('custom');
          if (data.gmailUser) setGmailUser(data.gmailUser);
          if (data.host) setSmtpHost(data.host);
          if (data.port) setSmtpPort(String(data.port));
          if (data.user) setSmtpUser(data.user);
          if (data.secure !== undefined) setSmtpSecure(data.secure);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/smtp-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: smtpProvider,
          gmailUser,
          gmailAppPassword,
          host: smtpHost,
          port: parseInt(smtpPort, 10),
          secure: smtpSecure,
          user: smtpUser,
          pass: smtpPass,
          enabled: true,
        }),
      });
      const data = await res.json();
      setSavingSmtp(false);

      if (data.success) {
        setSmtpConfigured(true);
        showToast('E-posta (SMTP) ayarları kaydedildi. Şimdi test maili gönderebilirsiniz!', 'success');
      } else {
        showToast(data.error || 'Ayar kaydedilemedi.', 'error');
      }
    } catch {
      setSavingSmtp(false);
      showToast('Sunucu ile iletişim kurulamadı.', 'error');
    }
  };

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: INITIAL_ADMIN_EMAIL }),
      });
      const data = await res.json();
      setTestingEmail(false);

      if (data.success) {
        setTestResult({ success: true, message: data.message });
        showToast(`Canlı test e-postası ${INITIAL_ADMIN_EMAIL} adresine ulaştı!`, 'success');
      } else {
        setTestResult({ success: false, message: data.error || 'E-posta gönderilemedi.' });
        showToast(data.error || 'E-posta gönderilemedi.', 'error');
      }
    } catch (err: any) {
      setTestingEmail(false);
      setTestResult({ success: false, message: 'Sunucuya bağlanılamadı.' });
      showToast('Test e-postası gönderilemedi.', 'error');
    }
  };

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editSchool, setEditSchool] = useState('');
  const [editBranch, setEditBranch] = useState('');
  const [editStudentNo, setEditStudentNo] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');

  // Subscription Date Range Modal State
  const [dateModalUser, setDateModalUser] = useState<User | null>(null);
  const [subStartDate, setSubStartDate] = useState('');
  const [subEndDate, setSubEndDate] = useState('');

  // Password reset modal state
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('123456');

  const openDateModal = (u: User) => {
    setDateModalUser(u);
    setSubStartDate(u.subscriptionStartDate ? u.subscriptionStartDate.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setSubEndDate(u.subscriptionEndDate ? u.subscriptionEndDate.slice(0, 10) : new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10));
  };

  const handleSaveDateRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateModalUser) return;

    const startISO = new Date(subStartDate).toISOString();
    const endISO = new Date(subEndDate + 'T23:59:59.000Z').toISOString();
    const isNowActive = new Date(endISO).getTime() > Date.now();

    StorageService.updateUser(dateModalUser.id, {
      subscriptionStartDate: startISO,
      subscriptionEndDate: endISO,
      subscriptionStatus: isNowActive ? 'active' : 'expired',
    });

    showToast(`${dateModalUser.name} için kullanım tarihleri güncellendi (${subStartDate} → ${subEndDate}).`, 'success');
    setDateModalUser(null);
    refreshData();
  };

  const refreshData = () => {
    setUsers(StorageService.getUsers());
    setExams(StorageService.getExams());
    setResults(StorageService.getAllResults());
    setSubRequests(StorageService.getSubscriptionRequests());
    setTickets(StorageService.getSupportTickets());
  };

  // Open Edit User Modal
  const openEditUser = (u: User) => {
    if (u.role === 'superadmin' && !isSuperAdmin) {
      showToast('SuperAdmin hesabı yalnızca SuperAdmin tarafından düzenlenebilir.', 'error');
      return;
    }
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditSchool(u.school || '');
    setEditBranch(u.branch || '');
    setEditStudentNo(u.studentNumber || '');
    setEditGrade(u.gradeLevel || '');
    setEditPhone(u.phone || '');
    setEditRole(u.role);
  };

  const handleSaveUserEdits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // SuperAdmin Protection
    if (editingUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase() && editRole !== 'superadmin') {
      showToast('SuperAdmin rolü değiştirilemez!', 'error');
      return;
    }

    // Role changes are strictly reserved for SuperAdmin
    const finalRole = isSuperAdmin ? editRole : editingUser.role;

    StorageService.updateUser(editingUser.id, {
      name: editName.trim(),
      email: editEmail.trim().toLowerCase(),
      school: editSchool.trim(),
      branch: editBranch.trim(),
      studentNumber: editStudentNo.trim(),
      gradeLevel: editGrade.trim(),
      phone: editPhone.trim(),
      role: finalRole,
    });

    showToast(`${editName} kullanıcısının bilgileri başarıyla güncellendi.`, 'success');
    setEditingUser(null);
    refreshData();
  };

  // Quick Role Toggle (Only SuperAdmin can change user roles)
  const handleRoleChange = (targetUser: User, newRole: UserRole) => {
    if (!isSuperAdmin) {
      showToast('Kullanıcı rolü değiştirme yetkisi yalnızca Süper Admin yetkisindedir.', 'error');
      return;
    }

    if (targetUser.role === 'superadmin' || targetUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) {
      showToast('SuperAdmin rolüyle kimse oynayamaz!', 'error');
      return;
    }

    if (targetUser.id === currentUser?.id) {
      showToast('Kendi rolünüzü buradan değiştiremezsiniz.', 'error');
      return;
    }

    const updated = StorageService.updateUser(targetUser.id, { role: newRole });
    if (updated) {
      showToast(`${targetUser.name} kullanıcısının rolü "${newRole}" olarak güncellendi.`, 'success');
      refreshData();
    }
  };

  // Quick Account Freeze/Unfreeze
  const handleToggleActive = (user: User) => {
    if (user.role === 'superadmin' || user.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) {
      showToast('SuperAdmin hesabı dondurulamaz!', 'error');
      return;
    }
    if (user.id === currentUser?.id) {
      showToast('Kendi hesabınızı donduramazsınız.', 'error');
      return;
    }
    const updated = StorageService.updateUser(user.id, { isActive: !user.isActive });
    if (updated) {
      showToast(`${user.name} hesabı ${updated.isActive ? 'aktifleştirildi' : 'donduruldu'}.`, 'info');
      refreshData();
    }
  };

  // Handle Subscription Approval or Rejection
  const handleResolveSubscriptionRequest = (req: SubscriptionRequest, action: 'approved' | 'rejected') => {
    const success = StorageService.resolveSubscriptionRequest(
      req.id,
      action,
      req.durationMonths,
      action === 'approved' ? `Yönetici (${currentUser?.name}) tarafından onaylandı.` : 'Reddedildi.'
    );

    if (success) {
      showToast(
        action === 'approved'
          ? `${req.userName} için ${req.packageName} onaylandı ve süre +${req.durationMonths} ay uzatıldı!`
          : `${req.userName} talebi reddedildi.`,
        action === 'approved' ? 'success' : 'info'
      );
      refreshData();
    }
  };

  // Direct manual day extension
  const handleExtendDays = (user: User, days: number) => {
    StorageService.extendUserSubscriptionDirectly(user.id, days);
    showToast(`${user.name} kullanıcısına +${days} gün kullanım süresi eklendi.`, 'success');
    refreshData();
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (newPasswordVal.length < 6) {
      showToast('Şifre en az 6 karakter olmalıdır.', 'error');
      return;
    }

    const hashed = await hashPassword(newPasswordVal);
    StorageService.updateUser(resetTargetUser.id, {
      passwordHash: hashed,
      hasPlatformPassword: true,
      authProvider: resetTargetUser.firebaseUid ? 'both' : (resetTargetUser.authProvider || 'email'),
    });
    showToast(`${resetTargetUser.name} kullanıcısının şifresi güncellendi.`, 'success');
    setResetTargetUser(null);
    setNewPasswordVal('123456');
    refreshData();
  };

  const filteredUsers = users.filter((u) => {
    const q = userSearch.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.school && u.school.toLowerCase().includes(q)) ||
      (u.studentNumber && u.studentNumber.includes(userSearch));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const pendingRequests = subRequests.filter((r) => r.status === 'pending');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {isSuperAdmin ? 'SuperAdmin Merkezi Yönetim Paneli' : 'Yönetici (Admin) Paneli'}
              </h1>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 ${
                isSuperAdmin ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-100 text-indigo-900'
              }`}>
                {isSuperAdmin ? '👑 SuperAdmin' : 'Admin'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Giriş Yapan: <strong>{currentUser?.name}</strong> ({currentUser?.email})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onNavigateToExams}
            className="w-full sm:w-auto min-h-[40px] px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Sınavlara Dön
          </button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Bekleyen Paket Talepleri</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-amber-600 font-medium mt-1 block">
            {pendingRequests.length > 0 ? 'Onay bekleyen öğretmenler var' : 'Bekleyen talep yok'}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Toplam Kayıtlı Kullanıcı</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {users.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {users.filter(u => u.role === 'teacher').length} Öğretmen · {users.filter(u => u.role === 'student').length} Öğrenci
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Sistemdeki Sınavlar</span>
            <BookOpen className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {exams.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Tüm dersler</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Okunan Toplam Kağıt</span>
            <FileCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {results.length}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">
            %99.4 OMR Başarı Oranı
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="border-b border-slate-200 px-3 sm:px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 sm:gap-6 text-xs font-semibold min-w-max">
            <button
              onClick={() => setSelectedTab('requests')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'requests'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Abonelik & Paket Talepleri ({pendingRequests.length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('users')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'users'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kullanıcı Yönetimi ({users.length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('exams')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'exams'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tüm Sınavlar ({exams.length})</span>
            </button>

            <button
              onClick={() => setSelectedTab('email-smtp')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'email-smtp'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>E-Posta & SMTP</span>
              <span className={`w-2 h-2 rounded-full ${smtpConfigured ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </button>

            <button
              onClick={() => setSelectedTab('tickets')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'tickets'
                  ? 'border-b-2 border-indigo-600 text-indigo-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-rose-500" />
              <span>Destek Bildirimleri ({tickets.length})</span>
              {tickets.filter((t) => t.status === 'pending').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {tickets.filter((t) => t.status === 'pending').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSelectedTab('settings')}
              className={`py-3.5 sm:py-4 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTab === 'settings'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Sistem Sıfırlama</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SUBSCRIPTION REQUESTS */}
        {selectedTab === 'requests' && (
          <div className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Öğretmenlerden Gelen Paket & Süre Uzatma Talepleri
                </h3>
                <p className="text-xs text-slate-500">
                  15 günlük deneme süresi bitip paket seçen öğretmenlerin taleplerini buradan onaylayabilir veya reddedebilirsiniz.
                </p>
              </div>
            </div>

            {subRequests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                Henüz yapılmış bir paket talebi bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {subRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                      req.status === 'pending'
                        ? 'bg-amber-50/40 border-amber-200 shadow-xs'
                        : req.status === 'approved'
                        ? 'bg-emerald-50/20 border-emerald-200'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 text-sm">{req.userName}</span>
                        <span className="text-xs text-slate-500">({req.userEmail})</span>
                        {req.userPhone && (
                          <span className="text-xs text-slate-600 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {req.userPhone}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-semibold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                          Seçilen Paket: {req.packageName} ({req.durationMonths} Ay)
                        </span>
                        <span className="font-mono font-bold text-slate-800">{req.priceText}</span>
                        {req.school && <span>· {req.school}</span>}
                        <span>· Talep Tarihi: {new Date(req.requestedAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleResolveSubscriptionRequest(req, 'approved')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Onayla (+{req.durationMonths} Ay Tanımla)
                          </button>
                          <button
                            onClick={() => handleResolveSubscriptionRequest(req, 'rejected')}
                            className="px-3 py-2 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reddet
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.status === 'approved' ? '✓ Onaylandı' : '✕ Reddedildi'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {selectedTab === 'users' && (
          <div>
            {/* Filter bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="İsim, e-posta, okul veya öğrenci no ara..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none min-h-[38px]"
                />
              </div>

              {/* Role filter */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'teacher', 'student', 'admin', 'superadmin'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1.5 rounded text-xs font-semibold capitalize cursor-pointer ${
                      roleFilter === r
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'all' ? 'Tümü' : r === 'superadmin' ? 'SuperAdmin' : r === 'teacher' ? 'Öğretmen' : r === 'student' ? 'Öğrenci' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <th className="py-3 px-4">Kullanıcı</th>
                    <th className="py-3 px-4">Okul / Branş / No</th>
                    <th className="py-3 px-4 text-center">Rol</th>
                    <th className="py-3 px-4 text-center">Abonelik / Kalan Süre</th>
                    <th className="py-3 px-4 text-center">Durum</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const isUserSuperAdmin = user.role === 'superadmin';
                    const remaining = StorageService.getRemainingDays(user);

                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              isUserSuperAdmin ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {isUserSuperAdmin ? '👑' : user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isUserSuperAdmin && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                                    Dokunulmaz
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {user.username ? `@${user.username} · ` : ''}
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {user.role === 'student' ? (
                            <div>
                              <span className="font-semibold text-slate-800">No: {user.studentNumber || '-'}</span>
                              <span className="text-[11px] text-slate-500 block">Sınıf: {user.gradeLevel || '-'} · {user.school}</span>
                            </div>
                          ) : (
                            <div>
                              <span className="font-semibold text-slate-800">{user.branch || 'Genel'}</span>
                              <span className="text-[11px] text-slate-500 block">{user.school || 'Belirtilmedi'}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isUserSuperAdmin ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              SuperAdmin
                            </span>
                          ) : isSuperAdmin ? (
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                              className="px-2 py-1 text-xs border border-slate-300 rounded bg-white font-medium cursor-pointer"
                            >
                              <option value="teacher">Öğretmen</option>
                              <option value="admin">Admin</option>
                              <option value="student">Öğrenci</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                              user.role === 'admin'
                                ? 'bg-indigo-100 text-indigo-900 font-bold'
                                : user.role === 'teacher'
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {user.role === 'student' ? (
                            <span className="text-emerald-700 font-bold text-[11px]">Süresiz Ücretsiz</span>
                          ) : isUserSuperAdmin ? (
                            <span className="text-amber-800 font-bold text-[11px]">Süresiz (Yönetici)</span>
                          ) : (
                            <div className="flex flex-col items-center">
                              <span className={`font-bold font-mono text-xs ${
                                remaining === 0 ? 'text-rose-600' : 'text-slate-800'
                              }`}>
                                {remaining === 0 ? 'Süresi Doldu' : `${remaining} Gün Kaldı`}
                              </span>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {user.subscriptionStartDate?.slice(0, 10)} - {user.subscriptionEndDate?.slice(0, 10)}
                              </div>
                              <button
                                onClick={() => openDateModal(user)}
                                className="mt-1 px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-[10px] font-semibold rounded border border-slate-300 flex items-center gap-1 cursor-pointer"
                                title="Başlangıç ve Bitiş Tarihlerini Belirle"
                              >
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                <span>Tarihleri Gir</span>
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isUserSuperAdmin ? (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Aktif
                            </span>
                          ) : (
                            <button
                              onClick={() => handleToggleActive(user)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors ${
                                user.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {user.isActive ? 'Aktif' : 'Donduruldu'}
                            </button>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditUser(user)}
                              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer"
                              title="Kaydı Düzelt / Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Düzelt
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => setResetTargetUser(user)}
                              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                              title="Şifresini Sıfırla"
                            >
                              Şifre
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              onClick={() => {
                                switchUser(user);
                                showToast(`${user.name} hesabına geçildi.`, 'info');
                                if (user.role !== 'admin' && user.role !== 'superadmin') {
                                  onNavigateToExams();
                                }
                              }}
                              className="text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                              title="Bu kullanıcının oturumuna geç"
                            >
                              Geç
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: EXAMS AUDIT */}
        {selectedTab === 'exams' && (
          <div className="p-4 sm:p-6">
            <div className="space-y-3">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  onClick={() => onSelectExam(exam)}
                  className="p-4 rounded-lg border border-slate-200 hover:border-indigo-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group bg-slate-50/40"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-indigo-600 uppercase">
                        {exam.subject} · {exam.gradeLevel}
                      </span>
                      <span className="text-xs text-slate-400">· Oluşturan: {exam.creatorName}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 truncate">
                      {exam.title}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 sm:gap-6 text-xs text-slate-500 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/70 shrink-0">
                    <div>
                      <span>Kağıt:</span>{' '}
                      <strong className="font-mono text-slate-800">{exam.totalPaperCount}</strong>
                    </div>
                    <div>
                      <span>Soru:</span>{' '}
                      <strong className="font-mono text-slate-800">{exam.questionCount}</strong>
                    </div>
                    <div>
                      <span>Ortalama:</span>{' '}
                      <strong className="font-mono text-emerald-700">{exam.averageScore}</strong>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: EMAIL & SMTP SETTINGS */}
        {selectedTab === 'email-smtp' && (
          <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span>Canlı E-Posta & SMTP Gönderim Yapılandırması</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kayıt aktivasyon ve şifre sıfırlama kodlarının öğretmen/öğrenci e-postalarına gerçek zamanlı ulaşmasını sağlar.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  smtpConfigured
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${smtpConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  {smtpConfigured ? 'SMTP Yapılandırıldı' : 'SMTP Henüz Tanımlanmadı'}
                </span>
              </div>
            </div>

            {/* Provider Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSmtpProvider('gmail')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  smtpProvider === 'gmail'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <span>Google Gmail (Önerilen)</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded">Ücretsiz & Pratik</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  16 haneli Google Uygulama Şifresi ile anında canlı e-posta gönderin.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSmtpProvider('custom')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  smtpProvider === 'custom'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-slate-600" />
                  <span>Özel SMTP Sunucusu</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Brevo, SendGrid, Yandex, Hostinger veya kurumsal okul SMTP sunucusu.
                </p>
              </button>
            </div>

            {/* SMTP Form */}
            <form onSubmit={handleSaveSmtp} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
              {smtpProvider === 'gmail' ? (
                <>
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                    <span className="font-bold block">Gmail Uygulama Şifresi Nasıl Alınır? (1 Dakika)</span>
                    <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-amber-800">
                      <li>Google Hesabınıza gidin → <strong>Güvenlik</strong> sekmesini açın (2 Adımlı Doğrulama açık olmalı).</li>
                      <li>Arama çubuğuna <strong>Uygulama Şifreleri</strong> (App Passwords) yazıp tıklayın.</li>
                      <li>Uygulama adı olarak <em>"testimgeldi"</em> yazın ve <strong>Oluştur</strong> deyin. Çıkan 16 harfli şifreyi buraya yapıştırın.</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Gönderici Gmail Adresiniz *
                    </label>
                    <input
                      type="email"
                      required
                      value={gmailUser}
                      onChange={(e) => setGmailUser(e.target.value)}
                      placeholder="ornek@gmail.com"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      16 Haneli Google Uygulama Şifresi (App Password) *
                    </label>
                    <input
                      type="password"
                      required
                      value={gmailAppPassword}
                      onChange={(e) => setGmailAppPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-3 py-2 text-xs font-mono tracking-widest border border-slate-300 rounded-lg bg-white min-h-[40px]"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Normal Google şifreniz değil, Uygulama Şifresi olmalıdır.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host *</label>
                      <input
                        type="text"
                        required
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                        placeholder="smtp-relay.brevo.com / smtp.gmail.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Port *</label>
                      <input
                        type="number"
                        required
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                        placeholder="587"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Kullanıcı Adı *</label>
                      <input
                        type="text"
                        required
                        value={smtpUser}
                        onChange={(e) => setSmtpUser(e.target.value)}
                        placeholder="info@testimgeldi.com"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Şifresi *</label>
                      <input
                        type="password"
                        required
                        value={smtpPass}
                        onChange={(e) => setSmtpPass(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white min-h-[40px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="smtpSecureCheck"
                      checked={smtpSecure}
                      onChange={(e) => setSmtpSecure(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smtpSecureCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                      SSL/TLS Güvenli Bağlantı (Port 465 için işaretleyin, Port 587 için kapalı bırakın)
                    </label>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={savingSmtp}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                >
                  {savingSmtp ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
                </button>

                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={testingEmail}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer min-h-[40px]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{testingEmail ? 'Test Maili Gönderiliyor...' : 'Canlı Test E-Postası Gönder'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                    : 'bg-rose-50 border border-rose-300 text-rose-800'
                }`}>
                  <span className="font-bold shrink-0">{testResult.success ? '✔ Başarılı:' : '❌ Hata:'}</span>
                  <span>{testResult.message}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* TAB: SUPPORT & ISSUE TICKETS */}
        {selectedTab === 'tickets' && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-600" />
                  <span>Kullanıcı Sorun & İstek Bildirimleri</span>
                  <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    {tickets.length} Bildirim
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Öğretmen ve öğrencilerin sistem üzerinden ilettiği teknik sorunlar, hata bildirimleri ve özellik istekleri.
                </p>
              </div>

              {/* Status Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto max-w-full overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setTicketFilter('all')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ticketFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tümü ({tickets.length})
                </button>
                <button
                  onClick={() => setTicketFilter('pending')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                    ticketFilter === 'pending'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Bekleyen</span>
                  <span className="text-[10px] bg-amber-600/50 px-1.5 rounded-full">
                    {tickets.filter((t) => t.status === 'pending').length}
                  </span>
                </button>
                <button
                  onClick={() => setTicketFilter('in_progress')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ticketFilter === 'in_progress'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  İnceleniyor ({tickets.filter((t) => t.status === 'in_progress').length})
                </button>
                <button
                  onClick={() => setTicketFilter('resolved')}
                  className={`px-3 py-1.5 rounded-md font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ticketFilter === 'resolved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Çözüldü ({tickets.filter((t) => t.status === 'resolved').length})
                </button>
              </div>
            </div>

            {/* Tickets List */}
            {tickets.filter((t) => (ticketFilter === 'all' ? true : t.status === ticketFilter)).length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-12 h-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold">Bu kategoride henüz bildirim bulunmuyor.</p>
                <p className="text-xs text-slate-500">
                  Kullanıcılar profil menüsündeki "Sorun & İstek Bildir" butonundan mesaj gönderdiğinde burada listelenecektir.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets
                  .filter((t) => (ticketFilter === 'all' ? true : t.status === ticketFilter))
                  .map((t) => (
                    <div
                      key={t.id}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 space-y-3 transition-all hover:bg-slate-50"
                    >
                      {/* Ticket Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              t.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : t.status === 'in_progress'
                                ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {t.status === 'pending'
                              ? '⏳ Beklemede'
                              : t.status === 'in_progress'
                              ? '🔍 İnceleniyor'
                              : '✔ Çözüldü'}
                          </span>

                          <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold text-[11px]">
                            {t.category}
                          </span>

                          <h4 className="font-bold text-slate-900 text-sm">{t.title}</h4>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          {new Date(t.createdAt).toLocaleString('tr-TR')}
                        </div>
                      </div>

                      {/* User Info Bar */}
                      <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                        <span>
                          Gönderen: <strong>{t.userName}</strong> ({t.userRole === 'teacher' ? 'Öğretmen' : t.userRole === 'student' ? 'Öğrenci' : t.userRole})
                        </span>
                        <span>·</span>
                        <a
                          href={`mailto:${t.email}?subject=testimgeldi Destek: ${encodeURIComponent(t.title)}`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>{t.email}</span>
                        </a>
                      </div>

                      {/* Message Content */}
                      <div className="text-xs text-slate-800 bg-white p-3.5 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed">
                        {t.message}
                      </div>

                      {/* Attachment Preview (if any) */}
                      {t.attachmentDataUrl && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-slate-700">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Ekli Dosya: {t.attachmentName || 'Ekran Görüntüsü'}</span>
                          </div>

                          {t.attachmentDataUrl.startsWith('data:image/') ? (
                            <div className="flex items-start gap-3">
                              <img
                                src={t.attachmentDataUrl}
                                alt="Ekran Görüntüsü"
                                className="max-h-48 rounded border border-slate-200 object-contain bg-slate-50 cursor-pointer hover:opacity-95"
                                onClick={() => setSelectedTicketForDetail(t)}
                                title="Büyütmek için tıklayın"
                              />
                              <div className="text-[11px] text-slate-500 space-y-1">
                                <p>Ekran görüntüsünü tam boyutta incelemek için üzerine tıklayabilirsiniz.</p>
                                <a
                                  href={t.attachmentDataUrl}
                                  download={t.attachmentName || 'ekran-goruntusu.png'}
                                  className="text-indigo-600 hover:underline font-semibold inline-block"
                                >
                                  Görseli İndir
                                </a>
                              </div>
                            </div>
                          ) : (
                            <a
                              href={t.attachmentDataUrl}
                              download={t.attachmentName || 'dokuman.pdf'}
                              className="text-xs text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              <span>{t.attachmentName || 'Dokümanı İndir'}</span>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Admin Controls: Status Switcher & Delete */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-600">Durumu Değiştir:</span>
                          <select
                            value={t.status}
                            onChange={(e) => {
                              StorageService.updateSupportTicketStatus(
                                t.id,
                                e.target.value as any
                              );
                              refreshData();
                              showToast('Bildirim durumu güncellendi.', 'success');
                            }}
                            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 font-semibold focus:outline-indigo-600"
                          >
                            <option value="pending">⏳ Beklemede</option>
                            <option value="in_progress">🔍 İnceleniyor</option>
                            <option value="resolved">✔ Çözüldü</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${t.email}?subject=testimgeldi Destek: ${encodeURIComponent(t.title)}`}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors flex items-center gap-1 border border-indigo-200"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>E-Posta ile Yanıtla</span>
                          </a>

                          <button
                            onClick={() => {
                              if (window.confirm('Bu bildirimi silmek istediğinize emin misiniz?')) {
                                StorageService.deleteSupportTicket(t.id);
                                refreshData();
                                showToast('Bildirim silindi.', 'info');
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Bildirimi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Ticket Image Zoom Modal */}
            {selectedTicketForDetail && selectedTicketForDetail.attachmentDataUrl && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
                <div className="bg-white rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
                  <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                    <span className="font-bold text-xs truncate max-w-md">
                      {selectedTicketForDetail.title} — Ekran Görüntüsü
                    </span>
                    <button
                      onClick={() => setSelectedTicketForDetail(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4 overflow-auto flex justify-center bg-slate-100">
                    <img
                      src={selectedTicketForDetail.attachmentDataUrl}
                      alt="Tam Boyut Ek"
                      className="max-h-[75vh] object-contain rounded shadow"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SYSTEM RESET */}
        {selectedTab === 'settings' && (
          <div className="p-8 max-w-xl mx-auto text-center space-y-4">
            <RotateCcw className="w-10 h-10 text-amber-600 mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Sistem Veritabanını Sıfırla</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tüm sınavları, öğrenci sonuçlarını ve eklenen öğretmenleri silerek sistemi ilk
              kurulumdaki varsayılan durumuna (SuperAdmin: {INITIAL_ADMIN_EMAIL}) döndürür.
            </p>
            <button
              onClick={() => {
                if (window.confirm('Tüm verileri sıfırlayıp baştan yüklemek istiyor musunuz?')) {
                  StorageService.resetDemoData();
                  showToast('Sistem demo verileri baştan yüklendi.', 'success');
                  refreshData();
                }
              }}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Demo Verileri Sıfırla ve Baştan Yükle
            </button>
          </div>
        )}
      </div>

      {/* EDIT USER MODAL (Admin fixes incorrect teacher or student records) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Kullanıcı Kaydını Düzelt / Düzenle
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUserEdits} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ad Soyad</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-Posta Adresi</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rol</label>
                {editingUser.role === 'superadmin' ? (
                  <span className="text-amber-800 font-bold block py-1">👑 SuperAdmin (Değiştirilemez)</span>
                ) : !isSuperAdmin ? (
                  <div className="p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                    <span className="font-bold">
                      {editingUser.role === 'admin' ? 'Yönetici (Admin)' : editingUser.role === 'teacher' ? 'Öğretmen' : 'Öğrenci'}
                    </span>
                    <p className="text-[10px] text-amber-700 mt-0.5">
                      🔒 Kullanıcı rolü değiştirme yetkisi yalnızca Süper Admin ({INITIAL_ADMIN_EMAIL}) yetkisindedir.
                    </p>
                  </div>
                ) : (
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="teacher">Öğretmen</option>
                    <option value="student">Öğrenci</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Okul Adı</label>
                  <input
                    type="text"
                    value={editSchool}
                    onChange={(e) => setEditSchool(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefon</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {editRole === 'teacher' ? (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Branş</label>
                  <input
                    type="text"
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Öğrenci Numarası</label>
                    <input
                      type="text"
                      value={editStudentNo}
                      onChange={(e) => setEditStudentNo(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Sınıf / Şube</label>
                    <input
                      type="text"
                      value={editGrade}
                      onChange={(e) => setEditGrade(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded"
                >
                  Bilgileri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Quick Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">
              Şifre Sıfırla: {resetTargetUser.name}
            </h3>
            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Yeni Şifre Belirleyin
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription Date Range Modal (Start & End Date Picker) */}
      {dateModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Kullanım Süresi Belirle</span>
              </h3>
              <button
                onClick={() => setDateModalUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              <strong>{dateModalUser.name}</strong> ({dateModalUser.email}) için kullanım başlangıç ve bitiş tarihlerini seçiniz.
            </p>

            <form onSubmit={handleSaveDateRange} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Başlangıç Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={subStartDate}
                  onChange={(e) => setSubStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bitiş Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={subEndDate}
                  onChange={(e) => setSubEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDateModalUser(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded"
                >
                  Tarihleri Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
