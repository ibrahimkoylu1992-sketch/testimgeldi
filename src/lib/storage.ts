import { User, Exam, StudentResult, SubscriptionRequest, SubscriptionPackage } from '../types';
import { QuizDocument } from '../types/quiz';
import { SupportTicket } from '../types/support';
import { DEFAULT_SAMPLE_QUIZ } from './quizSampleData';
import {
  pushRecordToCloud,
  deleteRecordFromCloud,
  fetchCollectionFromCloud,
} from './firebaseSync';
import { hashPassword } from './password';
import { normalizeUsername } from './username';

const STORAGE_KEYS = {
  USERS: 'testcrafta_users_v2',
  CURRENT_USER: 'testcrafta_current_user_v2',
  REMEMBER_ME: 'testcrafta_remember_me_v1',
  REMEMBERED_IDENTIFIER: 'testcrafta_remembered_id_v1',
  EXAMS: 'testcrafta_exams_v2',
  RESULTS: 'testcrafta_student_results_v2',
  RESET_CODES: 'testcrafta_password_resets_v2',
  SUBSCRIPTION_REQUESTS: 'testcrafta_sub_requests_v2',
  EMAIL_VERIFICATIONS: 'testcrafta_email_verifications_v2',
  QUIZZES: 'testcrafta_quizzes_v1',
  SUPPORT_TICKETS: 'testcrafta_support_tickets_v1',
};

export const INITIAL_ADMIN_EMAIL = 'ibrahimkoylu1992@gmail.com';
export const INITIAL_ADMIN_PASSWORD = '123456';
export const SYSTEM_SENDER_EMAIL = 'info@testimgeldi.com';

export const SUBSCRIPTION_PACKAGES: SubscriptionPackage[] = [
  {
    id: 'pack_trial_15d',
    name: 'Ücretsiz Deneme (15 Günlük)',
    badge: '15 Gün Hediye',
    durationMonths: 0.5,
    price: '0 ₺',
    description: 'Yeni kayıt olan her öğretmen için 15 gün boyunca tüm sistem özellikleri sınırsız ve ücretsizdir.',
    features: [
      '15 Gün Sınırsız Optik Kağıt Okuma (OMR)',
      'MEB Formatında 2 Sütunlu A4 Test & Quiz Hazırlama',
      'PDF Soru Kırpıcı & Win+Shift+S Panodan Yapıştırma (Ctrl + V)',
      'Kazanım Odaklı Örnek Soru Bankası',
      'Telefon Kamerasıyla Canlı Optik Okutma',
      'Öğrenci Karnesi & Veliye WhatsApp Gönderimi',
    ],
  },
  {
    id: 'pack_premium_12m',
    name: 'Premium Paket (12 Aylık)',
    badge: 'En Popüler',
    durationMonths: 12,
    price: '999 ₺',
    description: 'Tüm yıl boyunca kesintisiz sınav hazırlama, soru bazlı puanlama ve optik değerlendirme.',
    features: [
      '12 Ay Tam Yetkili Kesintisiz Kullanım',
      'Sınırsız Sınav Oluşturma & Sınırsız Kağıt Değerlendirme',
      'A4 Baskıya Hazır Test & Quiz Hazırlayıcı (Tüm Özellikler)',
      'Çoklu Kitapçık (A/B/C/D) ve Çoklu Branş Denemeleri',
      'Detaylı Madde, Çeldirici ve Kazanım Başarı Analizleri',
      'Öncelikli Teknik Destek & Sistem Güncellemeleri',
    ],
  },
  {
    id: 'pack_student_free',
    name: 'Öğrenci & Veli Hesabı',
    badge: 'Her Zaman Ücretsiz :)',
    durationMonths: 0,
    price: '0 ₺',
    description: 'Öğrenciler ve veliler için sınav sonuçlarını inceleme ve karne takibi her zaman ücretsizdir.',
    features: [
      'Öğrenciler ve Veliler İçin Her Zaman Ücretsiz :)',
      'Sınav Sonuçları, Net Puanı ve Doğru/Yanlış Tablosu',
      'Kazanım Bazlı Eksik Konu Analizi',
      'Sınıf ve Şube Başarı Sıralaması',
      'Renkli Karne Görüntüleme ve PDF İndirme',
    ],
  },
];

const now = new Date();
const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

const DEFAULT_USERS: User[] = [
  {
    id: 'user_superadmin_admin',
    name: 'İbrahim Köylü',
    email: INITIAL_ADMIN_EMAIL,
    passwordHash: INITIAL_ADMIN_PASSWORD,
    role: 'superadmin', // Superadmin role: can never be touched or demoted
    school: 'testimgeldi Yönetim Merkezi',
    branch: 'Sistem Yöneticisi',
    phone: '+90 555 123 4567',
    createdAt: '2026-01-15T09:00:00.000Z',
    isActive: true,
    subscriptionStatus: 'lifetime',
    subscriptionStartDate: '2026-01-01T00:00:00.000Z',
    subscriptionEndDate: '2099-12-31T23:59:59.000Z',
    myBranches: ['Matematik', 'Geometri', 'Mantık & Muhakeme'],
    myClasses: ['8-A', '8-B', '12-Sayısal', '12-Eşit Ağırlık'],
    customBranches: ['Matematik', 'Geometri', 'Mantık & Muhakeme'],
    customClasses: ['8-A', '8-B', '12-Sayısal', '12-Eşit Ağırlık'],
    mySchools: ['Merkez Anadolu Lisesi', 'Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu'],
    customSchools: ['Merkez Anadolu Lisesi', 'Cumhuriyet Ortaokulu', 'Gazi İmam Hatip Ortaokulu'],
  },
  {
    id: 'user_teacher_ayse',
    name: 'Ayşe Yılmaz',
    email: 'ayse.ogretmen@testimgeldi.com',
    passwordHash: '123456',
    role: 'teacher',
    school: 'Cumhuriyet Ortaokulu',
    branch: 'Fen Bilimleri',
    phone: '+90 542 987 6543',
    createdAt: now.toISOString(),
    isActive: true,
    subscriptionStatus: 'trial',
    subscriptionStartDate: now.toISOString(),
    subscriptionEndDate: fifteenDaysLater.toISOString(),
    myBranches: ['Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji'],
    myClasses: ['7-A', '7-B', '8-A', '8-C'],
    customBranches: ['Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji'],
    customClasses: ['7-A', '7-B', '8-A', '8-C'],
    mySchools: ['Cumhuriyet Ortaokulu', 'Atatürk Fen Lisesi'],
    customSchools: ['Cumhuriyet Ortaokulu', 'Atatürk Fen Lisesi'],
  },
  {
    id: 'user_teacher_expired_demo',
    name: 'Mehmet Kaya (Süresi Dolan Demo)',
    email: 'mehmet.hoca@testimgeldi.com',
    passwordHash: '123456',
    role: 'teacher',
    school: 'Gazi İmam Hatip Ortaokulu',
    branch: 'Türkçe',
    phone: '+90 533 222 1100',
    createdAt: thirtyDaysAgo.toISOString(),
    isActive: true,
    subscriptionStatus: 'expired',
    subscriptionStartDate: thirtyDaysAgo.toISOString(),
    subscriptionEndDate: oneDayAgo.toISOString(),
    myBranches: ['Türkçe', 'Edebiyat', 'Dil Bilgisi'],
    myClasses: ['6-A', '7-A', '8-B'],
    customBranches: ['Türkçe', 'Edebiyat', 'Dil Bilgisi'],
    customClasses: ['6-A', '7-A', '8-B'],
    mySchools: ['Gazi İmam Hatip Ortaokulu', 'Mehmet Akif İmam Hatip Lisesi'],
    customSchools: ['Gazi İmam Hatip Ortaokulu', 'Mehmet Akif İmam Hatip Lisesi'],
  },
  {
    id: 'user_student_elif',
    name: 'Elif Sena Kaya',
    email: 'elif.ogrenci@testimgeldi.com',
    passwordHash: '123456',
    role: 'student', // Student role: 100% free lifetime access
    school: 'Cumhuriyet Ortaokulu',
    studentNumber: '1042',
    gradeLevel: '8-A',
    createdAt: now.toISOString(),
    isActive: true,
    subscriptionStatus: 'lifetime',
    subscriptionStartDate: now.toISOString(),
    subscriptionEndDate: '2099-12-31T23:59:59.000Z',
    mySchools: ['Cumhuriyet Ortaokulu'],
  },
];

const DEFAULT_EXAMS: Exam[] = [
  {
    id: 'exam_demo_matematik_20',
    title: '8. Sınıf LGS Matematik 1. Deneme Sınavı',
    subject: 'Matematik',
    gradeLevel: '8-A',
    creatorId: 'user_superadmin_admin',
    creatorName: 'testimgeldi Yöneticisi',
    createdAt: '2026-10-24T14:30:00.000Z',
    questionCount: 20,
    optionCount: 4,
    booklets: [
      {
        booklet: 'A',
        answers: {
          1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'A',
          6: 'B', 7: 'C', 8: 'A', 9: 'D', 10: 'C',
          11: 'B', 12: 'D', 13: 'A', 14: 'C', 15: 'B',
          16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
        },
      },
      {
        booklet: 'B',
        answers: {
          1: 'B', 2: 'D', 3: 'A', 4: 'C', 5: 'B',
          6: 'A', 7: 'D', 8: 'C', 9: 'B', 10: 'A',
          11: 'C', 12: 'B', 13: 'D', 14: 'A', 15: 'C',
          16: 'B', 17: 'D', 18: 'A', 19: 'D', 20: 'C',
        },
      },
    ],
    scoringType: 'equal',
    questionPoints: Array.from({ length: 20 }, (_, i) => [i + 1, 5]).reduce(
      (acc, [k, v]) => ({ ...acc, [k]: v }),
      {}
    ),
    penalty: '3to1',
    totalPaperCount: 5,
    averageScore: 78.3,
    highestScore: 95.0,
  },
];

const DEFAULT_STUDENT_RESULTS: StudentResult[] = [
  {
    id: 'res_1',
    examId: 'exam_demo_matematik_20',
    studentNumber: '1042',
    studentName: 'Elif Sena Kaya',
    booklet: 'A',
    scannedAt: '2026-10-28T10:15:00.000Z',
    answers: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'A',
      6: 'B', 7: 'C', 8: 'A', 9: 'D', 10: 'C',
      11: 'B', 12: 'D', 13: 'A', 14: 'C', 15: 'B',
      16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'C',
    },
    evaluatedAnswers: [],
    correctCount: 19,
    wrongCount: 1,
    blankCount: 0,
    netScore: 18.67,
    totalScore: 93.35,
    confidenceScore: 0.99,
  },
  {
    id: 'res_2',
    examId: 'exam_demo_matematik_20',
    studentNumber: '1105',
    studentName: 'Ahmet Eren Demir',
    booklet: 'A',
    scannedAt: '2026-10-28T10:16:00.000Z',
    answers: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'B',
      6: 'B', 7: 'C', 8: 'A', 9: 'D', 10: 'C',
      11: 'B', 12: 'D', 13: null, 14: 'C', 15: 'B',
      16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
    },
    evaluatedAnswers: [],
    correctCount: 18,
    wrongCount: 1,
    blankCount: 1,
    netScore: 17.67,
    totalScore: 88.35,
    confidenceScore: 0.98,
  },
  {
    id: 'res_3',
    examId: 'exam_demo_matematik_20',
    studentNumber: '1240',
    studentName: 'Zeynep Su Yıldırım',
    booklet: 'B',
    scannedAt: '2026-10-28T10:17:00.000Z',
    answers: {
      1: 'B', 2: 'D', 3: 'A', 4: 'C', 5: 'B',
      6: 'A', 7: 'D', 8: 'C', 9: 'B', 10: 'A',
      11: 'C', 12: 'B', 13: 'D', 14: 'A', 15: 'C',
      16: 'B', 17: 'D', 18: 'A', 19: 'D', 20: 'D',
    },
    evaluatedAnswers: [],
    correctCount: 19,
    wrongCount: 1,
    blankCount: 0,
    netScore: 18.67,
    totalScore: 93.35,
    confidenceScore: 0.99,
  },
  {
    id: 'res_4',
    examId: 'exam_demo_matematik_20',
    studentNumber: '1318',
    studentName: 'Kerem Öztürk',
    booklet: 'A',
    scannedAt: '2026-10-28T10:18:00.000Z',
    answers: {
      1: 'A', 2: 'A', 3: 'B', 4: 'D', 5: 'A',
      6: 'C', 7: 'C', 8: 'A', 9: 'B', 10: 'C',
      11: 'B', 12: 'D', 13: 'A', 14: null, 15: 'B',
      16: 'D', 17: 'C', 18: 'B', 19: 'C', 20: 'D',
    },
    evaluatedAnswers: [],
    correctCount: 15,
    wrongCount: 4,
    blankCount: 1,
    netScore: 13.67,
    totalScore: 68.35,
    confidenceScore: 0.97,
  },
  {
    id: 'res_5',
    examId: 'exam_demo_matematik_20',
    studentNumber: '1480',
    studentName: 'Can Berk Aksoy',
    booklet: 'A',
    scannedAt: '2026-10-28T10:19:00.000Z',
    answers: {
      1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'A',
      6: 'B', 7: 'C', 8: 'A', 9: 'D', 10: 'C',
      11: 'B', 12: 'D', 13: 'A', 14: 'C', 15: 'B',
      16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
    },
    evaluatedAnswers: [],
    correctCount: 20,
    wrongCount: 0,
    blankCount: 0,
    netScore: 20.0,
    totalScore: 100.0,
    confidenceScore: 1.0,
  },
];

const DEFAULT_SUB_REQUESTS: SubscriptionRequest[] = [
  {
    id: 'req_sub_1',
    userId: 'user_teacher_expired_demo',
    userName: 'Mehmet Kaya',
    userEmail: 'mehmet.hoca@testimgeldi.com',
    userPhone: '+90 533 222 1100',
    school: 'Gazi İmam Hatip Ortaokulu',
    packageId: 'pack_premium_12m',
    packageName: 'Premium Paket (12 Aylık)',
    durationMonths: 12,
    priceText: '999 ₺',
    status: 'pending',
    requestedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
];

export const StorageService = {
  // --- USERS ---
  getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        return DEFAULT_USERS;
      }
      let users: User[] = JSON.parse(data);

      // 1. Remove info@testimgeldi.com from user accounts (info@testimgeldi.com is only for system email sending)
      const prevLen = users.length;
      users = users.filter((u) => u.email.toLowerCase() !== 'info@testimgeldi.com');
      let modified = prevLen !== users.length;

      // 2. Ensure ibrahimkoylu1992@gmail.com exists as superadmin without overwriting updated password
      const adminIdx = users.findIndex((u) => u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase());
      if (adminIdx === -1) {
        users.unshift(DEFAULT_USERS[0]);
        modified = true;
      } else {
        if (users[adminIdx].role !== 'superadmin' || users[adminIdx].subscriptionStatus !== 'lifetime' || users[adminIdx].name !== 'İbrahim Köylü') {
          users[adminIdx].role = 'superadmin';
          users[adminIdx].subscriptionStatus = 'lifetime';
          users[adminIdx].name = 'İbrahim Köylü';
          if (users[adminIdx].passwordHash === undefined || users[adminIdx].passwordHash === null) {
            users[adminIdx].passwordHash = INITIAL_ADMIN_PASSWORD;
          }
          modified = true;
        }
      }

      // 3. Migrate any old domain emails
      users.forEach((u) => {
        if (u.email.endsWith('@testcrafta.com')) {
          u.email = u.email.replace('@testcrafta.com', '@testimgeldi.com');
          modified = true;
        }
      });

      if (modified) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      }

      // Also migrate stored current user if needed
      try {
        const cur = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        if (cur) {
          const parsedCur = JSON.parse(cur);
          if (parsedCur.email?.toLowerCase() === 'info@testimgeldi.com') {
            const superAdmin = users.find((u) => u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) || DEFAULT_USERS[0];
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(superAdmin));
          }
        }
      } catch {}

      return users;
    } catch {
      return DEFAULT_USERS;
    }
  },

  saveUser(newUser: User): void {
    const users = this.getUsers();
    // Protect superadmin from being overwritten with non-superadmin
    if (newUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) {
      newUser.role = 'superadmin';
      newUser.subscriptionStatus = 'lifetime';
    }

    const index = users.findIndex((u) => u.id === newUser.id || u.email.toLowerCase() === newUser.email.toLowerCase());
    if (index >= 0) {
      users[index] = newUser;
    } else {
      users.push(newUser);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    pushRecordToCloud('users', newUser.id, newUser).catch(() => {});
  },

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;

    // RULE: Nobody can touch or demote superadmin's role or status!
    if (users[idx].email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) {
      delete updates.role;
      delete updates.subscriptionStatus;
      delete updates.isActive;
    }

    users[idx] = { ...users[idx], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const cur = this.getCurrentUser();
    if (cur && (cur.id === id || cur.email.toLowerCase() === users[idx].email.toLowerCase())) {
      const keepLocal = !!localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      this.setCurrentUser(users[idx], keepLocal);
    }
    pushRecordToCloud('users', users[idx].id, users[idx]).catch(() => {});
    return users[idx];
  },

  deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    deleteRecordFromCloud('users', id).catch(() => {});
  },

  isUsernameAvailable(username: string, excludeUserId?: string): boolean {
    const clean = normalizeUsername(username);
    if (!clean) return true;
    const users = this.getUsers();
    return !users.some(
      (u) => u.id !== excludeUserId && u.username && u.username.toLowerCase() === clean
    );
  },

  findUserByLoginIdentifier(identifier: string): User | undefined {
    const raw = identifier.trim().toLowerCase();
    if (!raw) return undefined;
    const cleanUsername = normalizeUsername(raw);
    const users = this.getUsers();
    return users.find(
      (u) =>
        u.email.toLowerCase() === raw ||
        (u.username && u.username.toLowerCase() === cleanUsername)
    );
  },

  getRememberMePreference(): boolean {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  },

  setRememberMePreference(remember: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, remember ? 'true' : 'false');
    } catch {}
  },

  getRememberedIdentifier(): string {
    try {
      return localStorage.getItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER) || '';
    } catch {
      return '';
    }
  },

  setRememberedIdentifier(identifier: string | null): void {
    try {
      if (identifier && identifier.trim()) {
        localStorage.setItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER, identifier.trim());
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBERED_IDENTIFIER);
      }
    } catch {}
  },

  getCurrentUser(): User | null {
    try {
      const localData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (localData) return JSON.parse(localData);
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (sessionData) return JSON.parse(sessionData);
      return null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null, remember?: boolean): void {
    if (user) {
      const serialized = JSON.stringify(user);
      const persistLocal =
        remember !== undefined ? remember : this.getRememberMePreference();
      if (persistLocal) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, serialized);
        sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.CURRENT_USER, serialized);
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      sessionStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },

  // Check if teacher trial or subscription is active
  isUserSubscriptionActive(user: User): boolean {
    if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'student') {
      return true; // Superadmin, admin and students are always active & free!
    }
    if (user.subscriptionStatus === 'lifetime') return true;
    if (!user.subscriptionEndDate) return false;
    return new Date(user.subscriptionEndDate).getTime() > Date.now();
  },

  getRemainingDays(user: User): number {
    if (user.role === 'superadmin' || user.role === 'admin' || user.role === 'student' || user.subscriptionStatus === 'lifetime') {
      return 999;
    }
    if (!user.subscriptionEndDate) return 0;
    const diffMs = new Date(user.subscriptionEndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  },

  // --- SUBSCRIPTION REQUESTS ---
  getSubscriptionRequests(): SubscriptionRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(DEFAULT_SUB_REQUESTS));
        return DEFAULT_SUB_REQUESTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_SUB_REQUESTS;
    }
  },

  createSubscriptionRequest(user: User, packageId: string, phone?: string): SubscriptionRequest {
    const pkg = SUBSCRIPTION_PACKAGES.find((p) => p.id === packageId) || SUBSCRIPTION_PACKAGES[1];
    const newReq: SubscriptionRequest = {
      id: 'req_' + Date.now(),
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userPhone: phone || user.phone || '',
      school: user.school || '',
      packageId: pkg.id,
      packageName: pkg.name,
      durationMonths: pkg.durationMonths,
      priceText: pkg.price,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    const list = this.getSubscriptionRequests();
    list.unshift(newReq);
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(list));
    pushRecordToCloud('subscriptionRequests', newReq.id, newReq).catch(() => {});

    if (phone) {
      this.updateUser(user.id, { phone });
    }

    return newReq;
  },

  resolveSubscriptionRequest(
    requestId: string,
    action: 'approved' | 'rejected',
    monthsToAdd = 12,
    adminNotes?: string
  ): boolean {
    const list = this.getSubscriptionRequests();
    const req = list.find((r) => r.id === requestId);
    if (!req) return false;

    req.status = action;
    req.resolvedAt = new Date().toISOString();
    req.adminNotes = adminNotes;
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(list));
    pushRecordToCloud('subscriptionRequests', req.id, req).catch(() => {});

    if (action === 'approved') {
      // Extend user subscription
      const users = this.getUsers();
      const user = users.find((u) => u.id === req.userId);
      if (user) {
        const baseDate = new Date(user.subscriptionEndDate).getTime() > Date.now()
          ? new Date(user.subscriptionEndDate)
          : new Date();
        const newEnd = new Date(baseDate.getTime() + monthsToAdd * 30 * 24 * 60 * 60 * 1000);

        this.updateUser(user.id, {
          subscriptionStatus: 'active',
          subscriptionEndDate: newEnd.toISOString(),
        });
      }
    }

    return true;
  },

  // Manual direct subscription extension by admin
  extendUserSubscriptionDirectly(userId: string, daysToAdd: number): User | null {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return null;

    const baseDate = new Date(user.subscriptionEndDate).getTime() > Date.now()
      ? new Date(user.subscriptionEndDate)
      : new Date();
    const newEnd = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    return this.updateUser(userId, {
      subscriptionStatus: 'active',
      subscriptionEndDate: newEnd.toISOString(),
    });
  },

  // --- CUSTOM BRANCHES & CLASSES ---
  getUserBranches(user: User): string[] {
    if (user.myBranches && user.myBranches.length > 0) {
      return user.myBranches;
    }
    if (user.customBranches && user.customBranches.length > 0) {
      return user.customBranches;
    }
    return [user.branch || 'Matematik'];
  },

  addCustomBranch(userId: string, newBranch: string): string[] {
    const trimmed = newBranch.trim();
    if (!trimmed) return [];
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.myBranches || user.customBranches || [user.branch || 'Matematik'];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      this.updateUser(userId, { myBranches: updated, customBranches: updated, branch: user.branch || trimmed });
      return updated;
    }
    return current;
  },

  removeCustomBranch(userId: string, branchToRemove: string): string[] {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.myBranches || user.customBranches || [user.branch || 'Matematik'];
    const updated = current.filter((b) => b !== branchToRemove);
    this.updateUser(userId, { myBranches: updated, customBranches: updated, branch: updated[0] || '' });
    return updated;
  },

  getUserClasses(user: User): string[] {
    if (user.myClasses && user.myClasses.length > 0) {
      return user.myClasses;
    }
    if (user.customClasses && user.customClasses.length > 0) {
      return user.customClasses;
    }
    return [user.gradeLevel || '8-A'];
  },

  addCustomClass(userId: string, newClass: string): string[] {
    const trimmed = newClass.trim();
    if (!trimmed) return [];
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.myClasses || user.customClasses || [user.gradeLevel || '8-A'];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      this.updateUser(userId, { myClasses: updated, customClasses: updated });
      return updated;
    }
    return current;
  },

  removeCustomClass(userId: string, classToRemove: string): string[] {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.myClasses || user.customClasses || [user.gradeLevel || '8-A'];
    const updated = current.filter((c) => c !== classToRemove);
    this.updateUser(userId, { myClasses: updated, customClasses: updated });
    return updated;
  },

  getUserSchools(user: User): string[] {
    if (user.mySchools && user.mySchools.length > 0) {
      return user.mySchools;
    }
    if (user.customSchools && user.customSchools.length > 0) {
      return user.customSchools;
    }
    return [user.school || 'Cumhuriyet Ortaokulu'];
  },

  addCustomSchool(userId: string, newSchool: string): string[] {
    const trimmed = newSchool.trim();
    if (!trimmed) return [];
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.mySchools || user.customSchools || [user.school || 'Cumhuriyet Ortaokulu'];
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed];
      this.updateUser(userId, { mySchools: updated, customSchools: updated, school: user.school || updated[0] });
      return updated;
    }
    return current;
  },

  removeCustomSchool(userId: string, schoolToRemove: string): string[] {
    const user = this.getUsers().find((u) => u.id === userId);
    if (!user) return [];
    const current = user.mySchools || user.customSchools || [user.school || 'Cumhuriyet Ortaokulu'];
    const updated = current.filter((s) => s !== schoolToRemove);
    this.updateUser(userId, { mySchools: updated, customSchools: updated, school: user.school === schoolToRemove ? (updated[0] || '') : user.school });
    return updated;
  },

  // --- EMAIL VERIFICATION SYSTEM (Register & Password Reset) ---
  createEmailVerificationCode(email: string, purpose: 'register' | 'forgot_password'): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${purpose}_${email.trim().toLowerCase()}`;
    const store = this.getAllEmailVerifications();
    store[key] = {
      email: email.trim().toLowerCase(),
      purpose,
      code,
      createdAt: Date.now(),
      expiresAt: Date.now() + 15 * 60 * 1000, // 15 mins expiry
    };
    localStorage.setItem(STORAGE_KEYS.EMAIL_VERIFICATIONS, JSON.stringify(store));
    return code;
  },

  getAllEmailVerifications(): Record<string, { email: string; purpose: string; code: string; createdAt: number; expiresAt: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EMAIL_VERIFICATIONS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  getLatestEmailVerificationCode(email: string, purpose: 'register' | 'forgot_password'): string | null {
    const key = `${purpose}_${email.trim().toLowerCase()}`;
    const store = this.getAllEmailVerifications();
    const entry = store[key];
    if (entry && Date.now() <= entry.expiresAt) {
      return entry.code;
    }
    return null;
  },

  verifyEmailCode(email: string, code: string, purpose: 'register' | 'forgot_password'): { success: boolean; message: string } {
    const key = `${purpose}_${email.trim().toLowerCase()}`;
    const store = this.getAllEmailVerifications();
    const entry = store[key];

    if (!entry) {
      return { success: false, message: 'Bu e-posta için oluşturulmuş bir doğrulama kodu bulunamadı. Lütfen yeni kod isteyiniz.' };
    }
    if (Date.now() > entry.expiresAt) {
      delete store[key];
      localStorage.setItem(STORAGE_KEYS.EMAIL_VERIFICATIONS, JSON.stringify(store));
      return { success: false, message: 'Doğrulama kodunun 15 dakikalık süresi dolmuştur. Lütfen tekrar kod talep ediniz.' };
    }
    if (entry.code.trim() !== code.trim()) {
      return { success: false, message: 'Girdiğiniz 6 haneli doğrulama kodu hatalı. Lütfen e-postanızı kontrol ediniz.' };
    }

    // Code verified successfully, delete to prevent reuse
    delete store[key];
    localStorage.setItem(STORAGE_KEYS.EMAIL_VERIFICATIONS, JSON.stringify(store));
    return { success: true, message: 'E-posta adresi başarıyla doğrulandı.' };
  },

  // --- PASSWORD RESET CODES ---
  createResetCode(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const store = this.getResetCodes();
    store[email.toLowerCase()] = {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000,
    };
    localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(store));
    // Also save in email verifications
    this.createEmailVerificationCode(email, 'forgot_password');
    return code;
  },

  getResetCodes(): Record<string, { code: string; expiresAt: number }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESET_CODES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async verifyAndResetPassword(email: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const store = this.getResetCodes();
    const entry = store[email.toLowerCase()];
    if (!entry) {
      // Fallback check in email verifications
      const evResult = this.verifyEmailCode(email, code, 'forgot_password');
      if (!evResult.success) {
        return { success: false, message: evResult.message || 'Bu e-posta için geçerli bir sıfırlama kodu bulunamadı.' };
      }
    } else {
      if (Date.now() > entry.expiresAt) {
        return { success: false, message: 'Sıfırlama kodunun süresi dolmuş. Lütfen tekrar kod isteyin.' };
      }
      if (entry.code !== code.trim()) {
        return { success: false, message: 'Girdiğiniz doğrulama kodu hatalı.' };
      }
      delete store[email.toLowerCase()];
      localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(store));
    }

    const users = this.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, message: 'Kullanıcı bulunamadı.' };
    }

    user.passwordHash = await hashPassword(newPassword);
    user.hasPlatformPassword = true;
    user.authProvider = user.firebaseUid ? 'both' : (user.authProvider || 'email');
    this.saveUser(user);

    return { success: true, message: 'Şifreniz başarıyla güncellendi.' };
  },

  // --- EXAMS ---
  getExams(): Exam[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXAMS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(DEFAULT_EXAMS));
        return DEFAULT_EXAMS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_EXAMS;
    }
  },

  getExamById(id: string): Exam | null {
    const exams = this.getExams();
    return exams.find((e) => e.id === id) || null;
  },

  saveExam(exam: Exam): void {
    const exams = this.getExams();
    const idx = exams.findIndex((e) => e.id === exam.id);
    if (idx >= 0) {
      exams[idx] = exam;
    } else {
      exams.unshift(exam);
    }
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
    pushRecordToCloud('exams', exam.id, exam).catch(() => {});
  },

  deleteExam(id: string): void {
    const exams = this.getExams().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));

    const results = this.getAllResults().filter((r) => r.examId !== id);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    deleteRecordFromCloud('exams', id).catch(() => {});
  },

  // --- RESULTS ---
  getAllResults(): StudentResult[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RESULTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(DEFAULT_STUDENT_RESULTS));
        return DEFAULT_STUDENT_RESULTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_STUDENT_RESULTS;
    }
  },

  getResultsForExam(examId: string): StudentResult[] {
    return this.getAllResults().filter((r) => r.examId === examId);
  },

  saveResult(result: StudentResult): void {
    const results = this.getAllResults();
    const idx = results.findIndex((r) => r.id === result.id);
    if (idx >= 0) {
      results[idx] = result;
    } else {
      results.push(result);
    }
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    this.refreshExamStats(result.examId);
    pushRecordToCloud('results', result.id, result).catch(() => {});
  },

  deleteResult(id: string): void {
    const results = this.getAllResults();
    const target = results.find((r) => r.id === id);
    const filtered = results.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(filtered));
    if (target) {
      this.refreshExamStats(target.examId);
    }
    deleteRecordFromCloud('results', id).catch(() => {});
  },

  refreshExamStats(examId: string): void {
    const results = this.getResultsForExam(examId);
    const exam = this.getExamById(examId);
    if (!exam) return;

    if (results.length === 0) {
      exam.totalPaperCount = 0;
      exam.averageScore = 0;
      exam.highestScore = 0;
    } else {
      const totalScore = results.reduce((acc, r) => acc + r.totalScore, 0);
      const maxScore = Math.max(...results.map((r) => r.totalScore));
      exam.totalPaperCount = results.length;
      exam.averageScore = parseFloat((totalScore / results.length).toFixed(1));
      exam.highestScore = parseFloat(maxScore.toFixed(1));
    }
    this.saveExam(exam);
  },

  // --- QUIZZES & TEST CREATOR ---
  getQuizzes(): QuizDocument[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUIZZES);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify([DEFAULT_SAMPLE_QUIZ]));
        return [DEFAULT_SAMPLE_QUIZ];
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_SAMPLE_QUIZ];
    }
  },

  getQuizById(id: string): QuizDocument | null {
    const list = this.getQuizzes();
    return list.find((q) => q.id === id) || null;
  },

  saveQuiz(quiz: QuizDocument): void {
    const list = this.getQuizzes();
    const idx = list.findIndex((q) => q.id === quiz.id);
    if (idx >= 0) {
      list[idx] = { ...quiz, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...quiz, updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(list));
    pushRecordToCloud('quizzes', quiz.id, quiz).catch(() => {});
  },

  deleteQuiz(id: string): void {
    const list = this.getQuizzes().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(list));
    deleteRecordFromCloud('quizzes', id).catch(() => {});
  },

  convertQuizToExam(quiz: QuizDocument, creatorUser: User): Exam {
    const qCount = Math.max(1, quiz.questions.length);
    const answersA: Record<number, string> = {};
    const questionPoints: Record<number, number> = {};

    quiz.questions.forEach((q, i) => {
      const qNum = i + 1;
      answersA[qNum] = q.correctAnswer || 'A';
      questionPoints[qNum] = q.points || parseFloat((100 / qCount).toFixed(1));
    });

    const newExam: Exam = {
      id: 'exam_from_quiz_' + Date.now(),
      title: quiz.title || `${quiz.gradeLevel} ${quiz.subject} Testi`,
      subject: quiz.subject || 'Genel',
      gradeLevel: quiz.gradeLevel || '8-A',
      school: quiz.schoolName || creatorUser.school || 'Cumhuriyet Ortaokulu',
      creatorId: creatorUser.id,
      creatorName: creatorUser.name,
      createdAt: new Date().toISOString(),
      questionCount: qCount,
      optionCount: quiz.questions[0]?.optionsCount || 4,
      booklets: [{ booklet: 'A', answers: answersA }],
      scoringType: 'custom',
      questionPoints,
      penalty: 'none',
      totalPaperCount: 0,
      averageScore: 0,
      highestScore: 0,
    };

    this.saveExam(newExam);
    return newExam;
  },

  // Support Tickets (Sorun / İstek Bildirimi)
  getSupportTickets(): SupportTicket[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    if (!raw) {
      // Seed an initial demo ticket so SuperAdmin sees the layout immediately
      const demoTickets: SupportTicket[] = [
        {
          id: 'ticket-demo-1',
          title: 'Telefon kamerasında parlama olunca okuma süresi uzuyor',
          category: 'Optik Okuma Yardımı',
          email: 'mehmet.hoca@meb.k12.tr',
          userName: 'Mehmet Yılmaz',
          userRole: 'teacher',
          message: 'Sınıfta floresan ışık doğrudan kağıdın üzerine vurduğunda bazen köşe karelerini yakalamakta zorlanıyor. Bu durumlarda açıyı hafif eğik tutmak işe yaradı fakat kameraya parlama filtresi eklenebilir mi?',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'pending',
        },
      ];
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(demoTickets));
      return demoTickets;
    }
    try {
      return JSON.parse(raw) || [];
    } catch {
      return [];
    }
  },

  saveSupportTicket(ticket: SupportTicket): void {
    const list = this.getSupportTickets();
    const idx = list.findIndex((t) => t.id === ticket.id);
    if (idx >= 0) {
      list[idx] = ticket;
    } else {
      list.unshift(ticket);
    }
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
    pushRecordToCloud('supportTickets', ticket.id, ticket).catch(() => {});
  },

  updateSupportTicketStatus(id: string, status: SupportTicket['status'], adminNote?: string): void {
    const list = this.getSupportTickets();
    const idx = list.findIndex((t) => t.id === id);
    if (idx >= 0) {
      list[idx].status = status;
      if (adminNote !== undefined) {
        list[idx].adminNote = adminNote;
      }
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
      pushRecordToCloud('supportTickets', list[idx].id, list[idx]).catch(() => {});
    }
  },

  deleteSupportTicket(id: string): void {
    const list = this.getSupportTickets().filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(list));
    deleteRecordFromCloud('supportTickets', id).catch(() => {});
  },

  // Synchronize Cloud Firestore data down to client local cache on boot
  async syncCloudToLocal(): Promise<void> {
    try {
      const [cloudUsers, cloudExams, cloudResults, cloudQuizzes, cloudTickets, cloudRequests] = await Promise.all([
        fetchCollectionFromCloud<User>('users'),
        fetchCollectionFromCloud<Exam>('exams'),
        fetchCollectionFromCloud<StudentResult>('results'),
        fetchCollectionFromCloud<QuizDocument>('quizzes'),
        fetchCollectionFromCloud<SupportTicket>('supportTickets'),
        fetchCollectionFromCloud<SubscriptionRequest>('subscriptionRequests'),
      ]);

      // 1. Users
      if (cloudUsers.length > 0) {
        const local = this.getUsers();
        const map = new Map<string, User>();
        local.forEach((u) => map.set(u.id, u));
        cloudUsers.forEach((u) => map.set(u.id, u));
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultUsers = this.getUsers();
        defaultUsers.forEach((u) => pushRecordToCloud('users', u.id, u).catch(() => {}));
      }

      // 2. Exams
      if (cloudExams.length > 0) {
        const local = this.getExams();
        const map = new Map<string, Exam>();
        local.forEach((e) => map.set(e.id, e));
        cloudExams.forEach((e) => map.set(e.id, e));
        localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultExams = this.getExams();
        defaultExams.forEach((e) => pushRecordToCloud('exams', e.id, e).catch(() => {}));
      }

      // 3. Results (OMR Puanları ve Netler)
      if (cloudResults.length > 0) {
        const local = this.getAllResults();
        const map = new Map<string, StudentResult>();
        local.forEach((r) => map.set(r.id, r));
        cloudResults.forEach((r) => map.set(r.id, r));
        localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultResults = this.getAllResults();
        defaultResults.forEach((r) => pushRecordToCloud('results', r.id, r).catch(() => {}));
      }

      // 4. Quizzes (A4 Test Kağıtları)
      if (cloudQuizzes.length > 0) {
        const local = this.getQuizzes();
        const map = new Map<string, QuizDocument>();
        local.forEach((q) => map.set(q.id, q));
        cloudQuizzes.forEach((q) => map.set(q.id, q));
        localStorage.setItem(STORAGE_KEYS.QUIZZES, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultQuizzes = this.getQuizzes();
        defaultQuizzes.forEach((q) => pushRecordToCloud('quizzes', q.id, q).catch(() => {}));
      }

      // 5. Support Tickets (Sorun / İstek Bildirimleri)
      if (cloudTickets.length > 0) {
        const local = this.getSupportTickets();
        const map = new Map<string, SupportTicket>();
        local.forEach((t) => map.set(t.id, t));
        cloudTickets.forEach((t) => map.set(t.id, t));
        localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultTickets = this.getSupportTickets();
        defaultTickets.forEach((t) => pushRecordToCloud('supportTickets', t.id, t).catch(() => {}));
      }

      // 6. Subscription Requests (Paket Satın Alma / Uzatma Talepleri)
      if (cloudRequests.length > 0) {
        const local = this.getSubscriptionRequests();
        const map = new Map<string, SubscriptionRequest>();
        local.forEach((req) => map.set(req.id, req));
        cloudRequests.forEach((req) => map.set(req.id, req));
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS, JSON.stringify(Array.from(map.values())));
      } else {
        const defaultRequests = this.getSubscriptionRequests();
        defaultRequests.forEach((req) => pushRecordToCloud('subscriptionRequests', req.id, req).catch(() => {}));
      }

      console.log('[Firebase Cloud Sync] Tüm koleksiyonlar Firestore ile senkronize edildi.');
    } catch (err) {
      console.warn('[Firebase Cloud Sync] Cloud sync warning:', err);
    }
  },

  resetDemoData(): void {
    localStorage.removeItem(STORAGE_KEYS.EXAMS);
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SUBSCRIPTION_REQUESTS);
    localStorage.removeItem(STORAGE_KEYS.QUIZZES);
    localStorage.removeItem(STORAGE_KEYS.SUPPORT_TICKETS);
    this.getUsers();
    this.getExams();
    this.getAllResults();
    this.getSubscriptionRequests();
    this.getQuizzes();
    this.getSupportTickets();
  },
};
