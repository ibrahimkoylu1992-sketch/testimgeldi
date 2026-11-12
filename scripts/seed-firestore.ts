import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const USERS = [
  {
    id: 'user_superadmin_admin',
    name: 'testimgeldi Yöneticisi',
    email: 'info@testimgeldi.com',
    passwordHash: '123456',
    role: 'superadmin',
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
    createdAt: new Date().toISOString(),
    isActive: true,
    subscriptionStatus: 'trial',
    subscriptionStartDate: new Date().toISOString(),
    subscriptionEndDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    myBranches: ['Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji'],
    myClasses: ['7-A', '7-B', '8-A', '8-C'],
    customBranches: ['Fen Bilimleri', 'Fizik', 'Kimya', 'Biyoloji'],
    customClasses: ['7-A', '7-B', '8-A', '8-C'],
    mySchools: ['Cumhuriyet Ortaokulu', 'Atatürk Fen Lisesi'],
    customSchools: ['Cumhuriyet Ortaokulu', 'Atatürk Fen Lisesi'],
  },
  {
    id: 'user_student_elif',
    name: 'Elif Sena Kaya',
    email: 'elif.ogrenci@testimgeldi.com',
    passwordHash: '123456',
    role: 'student',
    school: 'Cumhuriyet Ortaokulu',
    studentNumber: '1042',
    gradeLevel: '8-A',
    createdAt: new Date().toISOString(),
    isActive: true,
    subscriptionStatus: 'lifetime',
    subscriptionStartDate: new Date().toISOString(),
    subscriptionEndDate: '2099-12-31T23:59:59.000Z',
    mySchools: ['Cumhuriyet Ortaokulu'],
  },
];

const EXAMS = [
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

const RESULTS = [
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
];

const QUIZZES = [
  {
    id: 'sample-quiz-matematik-8',
    title: '8. Sınıf Çarpanlar ve Katlar / Üslü İfadeler 1. Tarama Testi',
    subject: 'Matematik',
    gradeLevel: '8-A',
    schoolName: 'Cumhuriyet Ortaokulu',
    teacherName: 'testimgeldi Yöneticisi',
    academicYear: '2026-2027 Eğitim Öğretim Yılı',
    dateText: 'Ekim 2026',
    durationText: '40 Dakika',
    showStudentInfoBox: true,
    showAnswerKeyTable: true,
    showPointsOnQuestions: true,
    fontFamily: 'serif',
    twoColumn: true,
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
    questions: [
      {
        id: 'q1',
        text: 'Alanı 72 cm² olan bir dikdörtgenin kenar uzunlukları santimetre cinsinden birer tam sayıdır. Buna göre bu dikdörtgenin çevresi en az kaç santimetredir?',
        options: ['A) 34', 'B) 36', 'C) 44', 'D) 74'],
        correctAnswer: 'A',
        points: 20,
        topic: 'Çarpanlar ve Katlar',
        optionsCount: 4,
      },
      {
        id: 'q2',
        text: 'Bir bakkal 48 kg pirinç ile 60 kg mercimeği birbirine karıştırmadan ve hiç artmayacak şekilde eşit hacimli en büyük torbalara dolduracaktır. Bu iş için en az kaç torba gerekir?',
        options: ['A) 8', 'B) 9', 'C) 10', 'D) 12'],
        correctAnswer: 'B',
        points: 20,
        topic: 'EBOB-EKOK Problemleri',
        optionsCount: 4,
      },
    ],
  },
];

const SUBSCRIPTION_REQUESTS = [
  {
    id: 'req_sub_demo_1',
    userId: 'user_teacher_ayse',
    userName: 'Ayşe Yılmaz',
    userEmail: 'ayse.ogretmen@testimgeldi.com',
    userPhone: '+90 542 987 6543',
    school: 'Cumhuriyet Ortaokulu',
    packageId: 'pack_premium_12m',
    packageName: 'Premium Paket (12 Aylık)',
    durationMonths: 12,
    priceText: '999 ₺',
    status: 'pending',
    requestedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

const SUPPORT_TICKETS = [
  {
    id: 'ticket_demo_1',
    title: 'Telefon kamerasında parlama olunca okuma süresi uzuyor',
    category: 'Optik Okuma Yardımı',
    email: 'mehmet.hoca@testimgeldi.com',
    userName: 'Mehmet Yılmaz',
    userRole: 'teacher',
    message: 'Sınıfta floresan ışık doğrudan kağıdın üzerine vurduğunda bazen köşe karelerini yakalamakta zorlanıyor. Bu durumlarda açıyı hafif eğik tutmak işe yaradı fakat kameraya parlama filtresi eklenebilir mi?',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    status: 'pending',
  },
];

async function seed() {
  console.log('Seeding Firestore database: ' + firebaseConfig.firestoreDatabaseId);

  // 1. Users
  console.log('1. Seeding users...');
  for (const user of USERS) {
    await setDoc(doc(db, 'users', user.id), user, { merge: true });
    console.log(`   + user: ${user.name} (${user.email})`);
  }

  // 2. Exams
  console.log('2. Seeding exams...');
  for (const exam of EXAMS) {
    await setDoc(doc(db, 'exams', exam.id), exam, { merge: true });
    console.log(`   + exam: ${exam.title}`);
  }

  // 3. Results
  console.log('3. Seeding results...');
  for (const result of RESULTS) {
    await setDoc(doc(db, 'results', result.id), result, { merge: true });
    console.log(`   + result: ${result.studentName} (${result.studentNumber})`);
  }

  // 4. Quizzes
  console.log('4. Seeding quizzes...');
  for (const quiz of QUIZZES) {
    await setDoc(doc(db, 'quizzes', quiz.id), quiz, { merge: true });
    console.log(`   + quiz: ${quiz.title}`);
  }

  // 5. Subscription Requests
  console.log('5. Seeding subscriptionRequests...');
  for (const req of SUBSCRIPTION_REQUESTS) {
    await setDoc(doc(db, 'subscriptionRequests', req.id), req, { merge: true });
    console.log(`   + subscriptionRequest: ${req.userName} (${req.packageName})`);
  }

  // 6. Support Tickets
  console.log('6. Seeding supportTickets...');
  for (const ticket of SUPPORT_TICKETS) {
    await setDoc(doc(db, 'supportTickets', ticket.id), ticket, { merge: true });
    console.log(`   + supportTicket: ${ticket.title}`);
  }

  console.log('✅ ALL 6 COLLECTIONS SEEDED TO CLOUD FIRESTORE SUCCESSFULLY!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
