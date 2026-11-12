import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, SubscriptionRequest } from '../types';
import { StorageService, INITIAL_ADMIN_EMAIL } from '../lib/storage';

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
  sendRegisterVerificationCode: (email: string) => Promise<{ success: boolean; error?: string }>;
  verifyRegisterCode: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored
    const user = StorageService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const users = StorageService.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!user) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı kullanıcı bulunamadı.' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Hesabınız yönetici tarafından dondurulmuştur. Lütfen sistem yöneticisiyle iletişime geçin.' };
    }

    if (user.passwordHash !== password) {
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
    const users = StorageService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return { success: false, error: 'Bu e-posta adresi zaten kullanılmaktadır.' };
    }

    if (password.length < 6) {
      return { success: false, error: 'Şifreniz en az 6 karakter olmalıdır.' };
    }

    const now = new Date();
    const fifteenDaysLater = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);

    const newUser: User = {
      id: 'usr_' + Date.now(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      role: role,
      school: school?.trim() || 'Belirtilmedi',
      branch: role === 'teacher' ? (branch?.trim() || 'Genel Branş') : undefined,
      studentNumber: role === 'student' ? (studentNumber?.trim() || Math.floor(1000 + Math.random() * 9000).toString()) : undefined,
      gradeLevel: gradeLevel?.trim() || (role === 'student' ? '8. Sınıf' : undefined),
      phone: phone?.trim(),
      emailVerified: true,
      createdAt: now.toISOString(),
      isActive: true,
      // Trial for teachers (15 days), lifetime free for students
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

  const sendRegisterVerificationCode = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Lütfen geçerli bir e-posta adresi giriniz.' };
    }

    const users = StorageService.getUsers();
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, error: 'Bu e-posta adresi zaten sistemde kayıtlıdır. Lütfen giriş yapınız.' };
    }

    const code = StorageService.createEmailVerificationCode(cleanEmail, 'register');

    // Send real email via server API
    try {
      await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, type: 'register' }),
      });
    } catch (e) {
      console.warn('Real email dispatch network error:', e);
    }

    // Code is never returned to client UI
    return { success: true };
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
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const users = StorageService.getUsers();
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, error: 'Bu e-posta adresiyle kayıtlı bir hesap bulunamadı.' };
    }

    const code = StorageService.createResetCode(cleanEmail);

    // Send real email via server API
    try {
      await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, type: 'forgot_password' }),
      });
    } catch (e) {
      console.warn('Real email dispatch network error:', e);
    }

    // Code is never returned to client UI
    return { success: true };
  };

  const resetPasswordWithCode = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'Yeni şifreniz en az 6 karakter olmalıdır.' };
    }

    const result = StorageService.verifyAndResetPassword(email, code, newPassword);
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

    if (currentUser.passwordHash !== currentPassword) {
      return { success: false, error: 'Mevcut şifreniz hatalı.' };
    }

    if (newPassword.length < 6) {
      return { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' };
    }

    const updated = StorageService.updateUser(currentUser.id, { passwordHash: newPassword });
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
