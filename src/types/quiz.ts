export interface QuizQuestionOption {
  key: 'A' | 'B' | 'C' | 'D' | 'E';
  text?: string;
  image?: string;
}

export interface QuizQuestion {
  id: string;
  orderNumber: number;
  questionText?: string;
  croppedImage?: string; // Cropped question image from PDF or uploaded picture
  diagramImage?: string; // Diagram or formula illustration
  optionsCount: 4 | 5;
  options: QuizQuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D' | 'E';
  points: number;
  topic?: string; // e.g. "Çarpanlar ve Katlar"
  subject?: string;
  difficulty?: 'Kolay' | 'Orta' | 'Zor';
  explanation?: string;
}

export interface QuizHeaderSettings {
  schoolName: string;
  examTitle: string;
  academicYear: string;
  termInfo: string;
  courseName: string;
  gradeLevel: string;
  dateText: string;
  durationText: string;
  instructions: string;
  showStudentTable: boolean;
  showScoreBox: boolean;
  showMiniOpticalGrid: boolean;
  twoColumnLayout: boolean;
  showQuestionDividerLines: boolean;
  headerStyle: 'standard' | 'meb_formal' | 'compact';
  questionsPerPage?: number; // 4, 5, 6, or 0 for auto
  showCompactHeaderOnSubsequentPages?: boolean;
}

export interface QuizDocument {
  id: string;
  title: string;
  subject: string;
  gradeLevel: string;
  schoolName: string;
  creatorId: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  settings: QuizHeaderSettings;
  questions: QuizQuestion[];
}
