import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { User, SubscriptionRequest } from '../types';
import { StorageService, INITIAL_ADMIN_EMAIL } from '../lib/storage';
import { hashPassword, verifyPassword } from '../lib/password';

export interface PendingGoogleProfile {
  uid: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface GoogleLoginResult {
  success: boolean;
  isNewUser?: boolean;
  needsRoleSelection?: boolean;
  pendingGoogleUser?: PendingGoogleProfile;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isSubscriptionActive: boolean;
  remainingDays: number;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (options?: {
    roleForNewUser?: 'teacher' | 'student';
    name?: string;
    school?: string;
    branch?: string;
    studentNumber?: string;
    gradeLevel?: string;
    phone?: string;
    platformPassword?: string;
  }) => Promise<GoogleLoginResult>;
  completeGoogleRegistration: (
    profile: PendingGoogleProfile,
    details: {
      role: 'teacher' | 'student';
      name?: string;
      school?: string;
      branch?: string;
      studentNumber?: string;
      gradeLevel?: string;
      phone?: string;
      platformPassword?: string;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role: 'teacher' | 'student',
    school?: string,
    branch?: string,
    studentNumber?: string,
    gradeLevel?: string,
    phone?: string
  ) => Promise<{ success: boolean; error?: string }>;
  sendRegisterVerificationCode: (email: string) => Promise<{ success: boolean; delivered?: boolean; error?: string }>;
  verifyRegisterCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; delivered?: boolean; error?: string }>;
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchUser: (user: User) => void;
  refreshUser: () => void;
  submitSubscriptionRequest: (packageId: string, phone?: string) => Promise<{ success: boolean; request?: SubscriptionRequest }>;
  addCustomBranch: (branchName: string) => string[];
  removeCustomBranch: (branchName: string) => string[];
  addCustomClass: (className: string) => string[];
  removeCustomClass: (className: string) => string[];
  addCustomSchool: (schoolName: string) => string[];
  removeCustomSchool: (schoolName: string) => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapFirebaseGoogleError(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user') {
    return 'Google giriş penceresi kapatıldı. Devam etmek için Google hesabınızı seçin.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Önceki Google giriş penceresi iptal edildi. Lütfen tekrar deneyin.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Tarayıcınız açılır pencereyi engelledi. Lütfen açılır pencere (pop-up) izni verip tekrar deneyin.';
  }
  if (code === 'auth/unauthorized-domain') {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'bu alan adı';
    return `Bu alan adı (${host}) henüz Firebase Yetkili Alan Adları listesine eklenmemiş. Yönetici Firebase Console > Authentication > Authorized domains bölümünden "${host}" adresini eklemelidir.`;
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Firebase projesinde Google ile giriş yöntemi henüz etkinleştirilmemiş.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Ağ bağlantısı hatası oluştu. İnternet bağlantınızı kontrol edip tekrar deneyin.';
  }
  return err?.message || 'Google ile giriş sırasında bir hata oluştu.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    let users = StorageService.getUsers();
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      await StorageService.syncCloudToLocal().catch(() => {});
      users = StorageService.getUsers();
      user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    }

    if (!user) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Hesabınız yönetici tarafından dondurulmuştur. Lütfen sistem yöneticisiyle iletişime geçin.' };
    }

    if (!user.passwordHash || user.hasPlatformPassword === false) {
      return {
        success: false,
        error:
          'Bu hesap Google ile oluşturulmuştur ve henüz platform şifresi belirlenmemiştir. Lütfen "Google ile Devam Et" butonunu kullanın veya giriş yaptıktan sonra "Platform Şifresi Belirle" menüsünden şifre oluşturun.',
      };
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return { success: false, error: 'Girdiğiniz şifre hatalı. Lütfen kontrol edip tekrar deneyin.' };
    }

    // Auto-update subscription status if expired
    if (user.role === 'teacher' && user.subscriptionEndDate && new Date(user.subscriptionEndDate).getTime() < Date.now()) {
      user.subscriptionStatus = 'expired';
      StorageService.saveUser(user);
    }

    StorageService.setCurrentUser(user);
    setCurrentUser(user);
    return { success: true };
  };

  const completeGoogleRegistration = async (
    profile: PendingGoogleProfile,
    details: {
      role: 'teacher' | 'student';
      name?: string;
      school?: string;
      branch?: string;
      studentNumber?: string;
      gradeLevel?: string;
      phone?: string;
      platformPassword?: string;
    }
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = profile.email.trim().toLowerCase();
    const cleanPassword = details.platformPassword?.trim() || '';

    if (cleanPassword && cleanPassword.length < 6) {
      return { success: false, error: 'Platform şifresi en az 6 karakter olmalıdır.' };
    }

    const users = StorageService.getUsers();
    const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (!existing.isActive) {
        return { success: false, error: 'Hesabınız yönetici tarafından dondurulmuştur.' };
      }
      const merged: User = {
        ...existing,
        firebaseUid: profile.uid,
        avatarUrl: profile.avatarUrl || existing.avatarUrl,
        emailVerified: true,
        hasPlatformPassword: Boolean(existing.passwordHash) && existing.hasPlatformPassword !== false,
        authProvider: existing.passwordHash ? 'both' : 'google',
      };
      StorageService.saveUser(merged);
      StorageService.setCurrentUser(merged);
      setCurrentUser(merged);
      return { success: true };
    }

    const now = new Date();
    const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const isSuperAdminEmail = cleanEmail === INITIAL_ADMIN_EMAIL.toLowerCase();
    const finalRole = isSuperAdminEmail ? 'superadmin' : details.role;
    const hashedPass = cleanPassword ? await hashPassword(cleanPassword) : '';

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: (details.name?.trim() || profile.name || cleanEmail.split('@')[0]).trim(),
      email: cleanEmail,
      passwordHash: hashedPass,
      role: finalRole,
      school: details.school?.trim() || 'Belirtilmedi',
      branch: finalRole === 'teacher' ? (details.branch?.trim() || 'Genel Branş') : undefined,
      studentNumber:
        finalRole === 'student'
          ? details.studentNumber?.trim() || Math.floor(1000 + Math.random() * 9000).toString()
          : undefined,
      gradeLevel: details.gradeLevel?.trim() || (finalRole === 'student' ? '8. Sınıf' : undefined),
      phone: details.phone?.trim() || undefined,
      emailVerified: true,
      authProvider: cleanPassword ? 'both' : 'google',
      hasPlatformPassword: Boolean(cleanPassword),
      firebaseUid: profile.uid,
      avatarUrl: profile.avatarUrl,
      createdAt: now.toISOString(),
      isActive: true,
      subscriptionStatus: isSuperAdminEmail || finalRole === 'student' ? 'lifetime' : 'trial',
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate:
        isSuperAdminEmail || finalRole === 'student'
          ? '2099-12-31T23:59:59.000Z'
          : fifteenDaysLater.toISOString(),
      customBranches: finalRole === 'teacher' && details.branch?.trim() ? [details.branch.trim()] : undefined,
      customClasses: details.gradeLevel?.trim() ? [details.gradeLevel.trim()] : undefined,
    };

    StorageService.saveUser(newUser);
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);

    return { success: true };
  };

  const loginWithGoogle: AuthContextType['loginWithGoogle'] = async (options) => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const credential = await signInWithPopup(auth, provider);
      const googleUser = credential.user;
      const cleanEmail = googleUser.email?.trim().toLowerCase();

      if (!cleanEmail) {
        return { success: false, error: 'Google hesabınızdan e-posta bilgisi alınamadı.' };
      }

      // Ensure latest users from Firestore are available before checking
      await StorageService.syncCloudToLocal().catch(() => {});

      const users = StorageService.getUsers();
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);

      if (existingUser) {
        if (!existingUser.isActive) {
          return {
            success: false,
            error: 'Hesabınız yönetici tarafından dondurulmuştur. Lütfen sistem yöneticisiyle iletişime geçin.',
          };
        }

        const hasExistingPassword = Boolean(existingUser.passwordHash) && existingUser.hasPlatformPassword !== false;
        let updatedSubscriptionStatus = existingUser.subscriptionStatus;
        if (
          existingUser.role === 'teacher' &&
          existingUser.subscriptionEndDate &&
          new Date(existingUser.subscriptionEndDate).getTime() < Date.now()
        ) {
          updatedSubscriptionStatus = 'expired';
        }

        const updatedUser: User = {
          ...existingUser,
          emailVerified: true,
          firebaseUid: googleUser.uid,
          avatarUrl: googleUser.photoURL || existingUser.avatarUrl,
          hasPlatformPassword: hasExistingPassword,
          authProvider: hasExistingPassword ? 'both' : 'google',
          subscriptionStatus: updatedSubscriptionStatus,
        };

        StorageService.saveUser(updatedUser);
        StorageService.setCurrentUser(updatedUser);
        setCurrentUser(updatedUser);

        return { success: true, isNewUser: false };
      }

      const pendingProfile: PendingGoogleProfile = {
        uid: googleUser.uid,
        email: cleanEmail,
        name: googleUser.displayName?.trim() || cleanEmail.split('@')[0],
        avatarUrl: googleUser.photoURL || undefined,
      };

      // If role wasn't pre-selected (e.g. triggered from Login screen), let modal ask Teacher vs Student
      if (!options?.roleForNewUser) {
        return {
          success: false,
          needsRoleSelection: true,
          pendingGoogleUser: pendingProfile,
        };
      }

      const regRes = await completeGoogleRegistration(pendingProfile, {
        role: options.roleForNewUser,
        name: options.name || pendingProfile.name,
        school: options.school,
        branch: options.branch,
        studentNumber: options.studentNumber,
        gradeLevel: options.gradeLevel,
        phone: options.phone,
        platformPassword: options.platformPassword,
      });

      if (!regRes.success) {
        return { success: false, error: regRes.error };
      }

      return { success: true, isNewUser: true };
    } catch (err: any) {
      return { success: false, error: mapFirebaseGoogleError(err) };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'teacher' | 'student',
    school?: string,
    branch?: string,
    studentNumber?: string,
    gradeLevel?: string,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const users = StorageService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanılmaktadır.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' };
    }

    const now = new Date();
    const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    const hashedPassword = await hashPassword(password);

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashedPassword,
      role: role,
      school: school?.trim() || 'Belirtilmedi',
      branch: role === 'teacher' ? (branch?.trim() || 'Genel Branş') : undefined,
      studentNumber: role === 'student' ? (studentNumber?.trim() || Math.floor(1000 + Math.random() * 9000).toString()) : undefined,
      gradeLevel: gradeLevel?.trim() || (role === 'student' ? '8. Sınıf' : undefined),
      phone: phone?.trim(),
      emailVerified: true,
      authProvider: 'email',
      hasPlatformPassword: true,
      createdAt: now.toISOString(),
      isActive: true,
      subscriptionStatus: role === 'teacher' ? 'trial' : 'lifetime',
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: role === 'teacher' ? fifteenDaysLater.toISOString() : '2099-12-31T23:59:59.000Z',
      customBranches: role === 'teacher' ? (branch ? [branch.trim()] : []) : undefined,
      customClasses: gradeLevel ? [gradeLevel.trim()] : undefined,
    };

    StorageService.saveUser(newUser);
    StorageService.setCurrentUser(newUser);
    setCurrentUser(newUser);

    return { success: true };
  };

  const sendRegisterVerificationCode = async (
    email: string
  ): Promise<{ success: boolean; delivered?: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' };
    }

    await StorageService.syncCloudToLocal().catch(() => {});
    const users = StorageService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Bu e-posta adresi zaten sistemde kayıtlıdır. Lütfen giriş yapınız.' };
    }

    const code = StorageService.createEmailVerificationCode(cleanEmail, 'register');

    let delivered = false;
    try {
      const resp = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, type: 'register' }),
      });
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await resp.json();
          delivered = Boolean(data?.delivered);
        }
      }
    } catch (e) {
      console.warn('Real email dispatch network error:', e);
    }

    return { success: true, delivered };
  };

  const verifyRegisterCode = async (email: string, code: string): Promise<{ success: boolean; error?: string }> => {
    const result = StorageService.verifyEmailCode(email, code, 'register');
    if (!result.success) {
      return { success: false, error: result.message };
    }
    return { success: true };
  };

  const logout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    signOut(auth).catch(() => {});
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; delivered?: boolean; error?: string }> => {
    await StorageService.syncCloudToLocal().catch(() => {});
    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' };
    }

    const code = StorageService.createResetCode(cleanEmail);

    let delivered = false;
    try {
      const resp = await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, type: 'forgot_password' }),
      });
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await resp.json();
          delivered = Boolean(data?.delivered);
        }
      }
    } catch (e) {
      console.warn('Real email dispatch network error:', e);
    }

    return { success: true, delivered };
  };

  const resetPasswordWithCode = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'Yeni şifreniz en az 6 karakter olmalıdır.' };
    }

    const result = await StorageService.verifyAndResetPassword(email, code, newPassword);
    if (!result.success) {
      return { success: false, error: result.message };
    }

    const updatedUsers = StorageService.getUsers();
    const user = updatedUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      StorageService.setCurrentUser(user);
      setCurrentUser(user);
    }

    return { success: true };
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Oturum açık değil.' };

    const needsInitialPassword = !currentUser.passwordHash || currentUser.hasPlatformPassword === false;

    if (!needsInitialPassword) {
      const validCurrent = await verifyPassword(currentPassword, currentUser.passwordHash);
      if (!validCurrent) {
        return { success: false, error: 'Mevcut şifreniz hatalı.' };
      }
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' };
    }

    const hashed = await hashPassword(newPassword);
    const updated = StorageService.updateUser(currentUser.id, {
      passwordHash: hashed,
      hasPlatformPassword: true,
      authProvider: currentUser.firebaseUid ? 'both' : currentUser.authProvider || 'email',
    });

    if (updated) {
      setCurrentUser(updated);
      return { success: true };
    }

    return { success: false, error: 'Şifre güncellenirken bir hata oluştu.' };
  };

  const switchUser = (user: User) => {
    StorageService.setCurrentUser(user);
    setCurrentUser({ ...user });
  };

  const refreshUser = () => {
    const user = StorageService.getCurrentUser();
    if (user) {
      setCurrentUser({ ...user });
    } else {
      setCurrentUser(null);
    }
  };

  const submitSubscriptionRequest = async (packageId: string, phone?: string): Promise<{ success: boolean; request?: SubscriptionRequest }> => {
    if (!currentUser) return { success: false };
    const req = StorageService.createSubscriptionRequest(currentUser, packageId, phone);
    return { success: true, request: req };
  };

  const addCustomBranch = (branchName: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.addCustomBranch(currentUser.id, branchName);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const removeCustomBranch = (branchName: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.removeCustomBranch(currentUser.id, branchName);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const addCustomClass = (className: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.addCustomClass(currentUser.id, className);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const removeCustomClass = (className: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.removeCustomClass(currentUser.id, className);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const addCustomSchool = (schoolName: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.addCustomSchool(currentUser.id, schoolName);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const removeCustomSchool = (schoolName: string): string[] => {
    if (!currentUser) return [];
    const updated = StorageService.removeCustomSchool(currentUser.id, schoolName);
    const updatedUser = StorageService.getCurrentUser();
    if (updatedUser) {
      setCurrentUser({ ...updatedUser });
    }
    return updated;
  };

  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();
  const isAdmin = isSuperAdmin || currentUser?.role === 'admin';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  const isSubscriptionActive = currentUser ? StorageService.isUserSubscriptionActive(currentUser) : false;
  const remainingDays = currentUser ? StorageService.getRemainingDays(currentUser) : 0;

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isStudent,
    isSubscriptionActive,
    remainingDays,
    login,
    loginWithGoogle,
    completeGoogleRegistration,
    register,
    sendRegisterVerificationCode,
    verifyRegisterCode,
    logout,
    requestPasswordReset,
    resetPasswordWithCode,
    updatePassword,
    switchUser,
    refreshUser,
    submitSubscriptionRequest,
    addCustomBranch,
    removeCustomBranch,
    addCustomClass,
    removeCustomClass,
    addCustomSchool,
    removeCustomSchool,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
