export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'lifetime';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  school?: string;
  branch?: string;
  studentNumber?: string; // For student role
  gradeLevel?: string;    // For student or teacher default class
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  createdAt: string;
  isActive: boolean;
  // Subscription fields
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartDate: string; // ISO date YYYY-MM-DD
  subscriptionEndDate: string;   // ISO date YYYY-MM-DD
  // Teacher-specific subjects, classes, and schools they actively teach at
  myBranches?: string[];
  myClasses?: string[];
  customBranches?: string[];
  customClasses?: string[];
  mySchools?: string[];
  customSchools?: string[];
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  badge?: string;
  durationMonths: number;
  price: string;
  description: string;
  features: string[];
}

export interface SubscriptionRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  school?: string;
  packageId: string;
  packageName: string;
  durationMonths: number;
  priceText: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
}

export type BookletType = 'A' | 'B' | 'C' | 'D';

export interface BookletAnswerKey {
  booklet: BookletType;
  answers: Record<number, string>;
}

export type PenaltyOption = 'none' | '3to1' | '4to1';
export type PenaltyMode = 'fractional' | 'floor';

export interface ExamSubjectSection {
  id: string;
  name: string; // e.g. "Matematik", "Fizik"
  questionStart: number; // e.g. 1
  questionEnd: number;   // e.g. 20
  questionCount: number; // 20
  startIndex?: number;   // 0-based index (questionStart - 1)
}

export interface Exam {
  id: string;
  title: string;
  subject: string; // Primary subject or "Çoklu Ders (Genel Deneme)"
  gradeLevel: string;
  school?: string; // Teacher's school
  creatorId: string;
  creatorName: string;
  createdAt: string;
  questionCount: number;
  optionCount: number; // 4 (A-D) or 5 (A-E)
  booklets: BookletAnswerKey[];
  scoringType: 'equal' | 'custom';
  questionPoints: Record<number, number>;
  penalty: PenaltyOption;
  penaltyMode?: PenaltyMode; // 'fractional' (Örn: 2 yanlış = -0.67 net) veya 'floor' (3 yanlışı tamamlamadan doğru gitmez)
  totalPaperCount: number;
  averageScore?: number;
  highestScore?: number;
  // Multi-subject sections support
  sections?: ExamSubjectSection[];
}

export interface StudentAnswer {
  questionNumber: number;
  subjectName?: string;
  selectedOption: string | null;
  correctOption: string;
  isCorrect: boolean;
  isMultiple: boolean;
  isBlank: boolean;
  pointsEarned: number;
}

export interface StudentResult {
  id: string;
  examId: string;
  studentNumber: string;
  studentName: string;
  school?: string;
  booklet: BookletType;
  scannedAt: string;
  imageUrl?: string;
  answers: Record<number, string | null>;
  evaluatedAnswers: StudentAnswer[];
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  netScore: number;
  totalScore: number;
  confidenceScore: number;
  needsReview?: boolean;
}

export interface ItemAnalysisData {
  questionNumber: number;
  subjectName?: string;
  correctAnswer: string;
  points: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  successRate: number;
  optionDistribution: Record<string, number>;
  mostCommonDistractor?: string;
}

export interface MultiSubjectSheetConfig {
  sheetTitle: string;
  schoolName: string;
  layoutMode: 'single' | 'double';
  sections: {
    id: string;
    subjectName: string;
    questionCount: number;
    optionCount: number;
  }[];
}
