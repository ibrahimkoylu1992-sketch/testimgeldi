import { QuizQuestion } from '../types/quiz';

export interface BankQuestion extends QuizQuestion {
  gradeLevel: string; // e.g. "8. Sınıf", "7. Sınıf", "YKS / TYT"
  source: string; // e.g. "MEB Kazanım Testi", "LGS Örnek Soru", "testimgeldi Arşivi"
}

export const QUESTION_BANK_SUBJECTS = [
  'Tümü',
  'Matematik',
  'Fen Bilimleri',
  'Türkçe',
  'T.C. İnkılap Tarihi',
  'İngilizce',
  'Din Kültürü',
] as const;

export const QUESTION_BANK_GRADES = [
  'Tümü',
  '8. Sınıf (LGS)',
  '7. Sınıf',
  '6. Sınıf',
  '5. Sınıf',
  'Lise (YKS / TYT)',
] as const;

export const QUESTION_BANK_TOPICS: Record<string, string[]> = {
  Matematik: [
    'Çarpanlar ve Katlar',
    'Üslü İfadeler',
    'Kareköklü İfadeler',
    'Veri Analizi',
    'Basit Olayların Olasılığı',
    'Cebirsel İfadeler ve Özdeşlikler',
    'Doğrusal Denklemler',
    'Eşitsizlikler',
  ],
  'Fen Bilimleri': [
    'Mevsimler ve İklim',
    'DNA ve Genetik Kod',
    'Basınç (Katı, Sıvı, Gaz)',
    'Madde ve Endüstri',
    'Basit Makineler',
    'Enerji Dönüşümleri ve Çevre',
  ],
  Türkçe: [
    'Paragrafta Anlam ve Ana Fikir',
    'Cümlede Anlam ve İlişkiler',
    'Sözcükte Anlam ve Söz Sanatları',
    'Fiilimsiler (Eylemsiler)',
    'Cümlenin Ögeleri',
    'Yazım Kuralları ve Noktalama',
  ],
  'T.C. İnkılap Tarihi': [
    'Bir Kahraman Doğuyor',
    'Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
    'Milli Bir Destan: Ya İstiklal Ya Ölüm!',
    'Atatürkçülük ve Çağdaşlaşan Türkiye',
    'Demokratikleşme Çabaları',
  ],
  İngilizce: [
    'Friendship',
    'Teen Life',
    'In The Kitchen',
    'On The Phone',
    'The Internet',
    'Adventures',
  ],
  'Din Kültürü': [
    'Kader ve Kaza İnancı',
    'Zekât ve Sadaka',
    'Din ve Hayat',
    'Hz. Muhammed’in (s.a.v.) Örnekliği',
  ],
};

export const SAMPLE_QUESTION_BANK: BankQuestion[] = [
  // MATEMATİK - 8. SINIF (LGS)
  {
    id: 'bank-mat-1',
    orderNumber: 1,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Çarpanlar ve Katlar',
    difficulty: 'Orta',
    source: 'MEB LGS Örnek Soru',
    points: 10,
    questionText: `(x − 3) ve (y + 4) sayıları aralarında asaldır.

(x − 3) / (y + 4) = 28 / 36

olduğuna göre, y sayısı x sayısının kaç katıdır?`,
    optionsCount: 4,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: '2²' },
      { key: 'B', text: '2¹' },
      { key: 'C', text: '2⁻¹' },
      { key: 'D', text: '2⁻²' },
    ],
    explanation: '28 ve 36 sayıları 4 ile sadeleştirilirse 7/9 olur. x - 3 = 7 => x = 10; y + 4 = 9 => y = 5. y / x = 5 / 10 = 1/2 = 2⁻¹.',
  },
  {
    id: 'bank-mat-2',
    orderNumber: 2,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Çarpanlar ve Katlar',
    difficulty: 'Kolay',
    source: 'MEB Kazanım Testi',
    points: 10,
    questionText: `(30 + x) ve (40 + x) sayıları arasında asal sayılardır.

Buna göre, x yerine aşağıdaki sayılardan hangisi yazılamaz?`,
    optionsCount: 4,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '3' },
      { key: 'C', text: '8' },
      { key: 'D', text: '9' },
    ],
    explanation: 'x = 8 için 30 + 8 = 38 ve 40 + 8 = 48 olur. Her ikisi de çift sayı olduğundan 2 ile bölünür ve aralarında asal olamaz.',
  },
  {
    id: 'bank-mat-3',
    orderNumber: 3,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Çarpanlar ve Katlar',
    difficulty: 'Kolay',
    source: 'LGS Tarama Testi',
    points: 10,
    questionText: `300 sayısının asal olan kaç tane doğal sayı böleni vardır?`,
    optionsCount: 4,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '4' },
      { key: 'B', text: '3' },
      { key: 'C', text: '2' },
      { key: 'D', text: '1' },
    ],
    explanation: '300 = 2² · 3 · 5² asal çarpanlarına ayrılır. Asal bölenleri 2, 3 ve 5 olmak üzere 3 tanedir.',
  },
  {
    id: 'bank-mat-4',
    orderNumber: 4,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Üslü İfadeler',
    difficulty: 'Zor',
    source: 'MEB LGS Örnek Soru',
    points: 15,
    diagramImage: '/assets/aistudio/image_6e1294eb.png',
    questionText: `A bölümündeki sayılar: {5, 14, 9}
B bölümündeki sayılar: {10, 12, 15, 30}

Yukarıdaki A ve B bölümlerinde bulunan sayılar bir tanesi A'dan bir tanesi B'den olmak üzere aralarında asal olacak şekilde eşleştirilip I, II ve III numaralı kutulara yerleştirildiğinde B bölümünde hangi sayı boşta kalır?`,
    optionsCount: 4,
    correctAnswer: 'D',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '12' },
      { key: 'C', text: '15' },
      { key: 'D', text: '30' },
    ],
    explanation: '5 ile 12 aralarında asaldır. 14 ile 15 aralarında asaldır. 9 ile 10 aralarında asaldır. 30 sayısı açıkta kalır.',
  },
  {
    id: 'bank-mat-5',
    orderNumber: 5,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Çarpanlar ve Katlar',
    difficulty: 'Orta',
    source: 'LGS Deneme Sınavı',
    points: 10,
    questionText: `a, b, c, d birer doğal sayı olmak üzere;
A = 2ᵃ · 3³ · 5ᶜ
B = 2³ · 3ᵇ · 5² · 7ᵈ

EBOB(A, B) = 2² · 3³ · 5²
EKOK(A, B) = 2³ · 3⁵ · 5⁴ · 7¹

Buna göre (b + c) / (a + d) işleminin sonucu kaçtır?`,
    optionsCount: 4,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: '1' },
      { key: 'B', text: '2' },
      { key: 'C', text: '3' },
      { key: 'D', text: '4' },
    ],
    explanation: 'EBOB üslerin küçüğü, EKOK üslerin büyüğüdür. a=2, b=5, c=4, d=1 bulunur. (5 + 4) / (2 + 1) = 9 / 3 = 3.',
  },
  {
    id: 'bank-mat-6',
    orderNumber: 6,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Kareköklü İfadeler',
    difficulty: 'Orta',
    source: 'MEB Kazanım Testi',
    points: 10,
    questionText: `Alanı 108 cm² olan kare şeklindeki bir kartonun bir kenar uzunluğu kaç santimetredir?`,
    optionsCount: 4,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '5√3' },
      { key: 'B', text: '6√3' },
      { key: 'C', text: '3√6' },
      { key: 'D', text: '12√3' },
    ],
    explanation: '√108 = √(36 · 3) = 6√3 cm.',
  },
  {
    id: 'bank-mat-7',
    orderNumber: 7,
    subject: 'Matematik',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Basit Olayların Olasılığı',
    difficulty: 'Kolay',
    source: 'MEB LGS Örnek Soru',
    points: 10,
    questionText: `Bir torbada aynı büyüklükte 4 mavi, 6 kırmızı ve 5 sarı bilye vardır.

Torbaya geri bırakılmaksızın rastgele çekilen bir bilyenin sarı olmama olasılığı kaçtır?`,
    optionsCount: 4,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: '2/3' },
      { key: 'B', text: '1/3' },
      { key: 'C', text: '3/5' },
      { key: 'D', text: '4/15' },
    ],
    explanation: 'Toplam bilye = 4 + 6 + 5 = 15. Sarı olmayan = 4 + 6 = 10. Olasılık = 10 / 15 = 2/3.',
  },

  // FEN BİLİMLERİ - 8. SINIF (LGS)
  {
    id: 'bank-fen-1',
    orderNumber: 8,
    subject: 'Fen Bilimleri',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Mevsimler ve İklim',
    difficulty: 'Orta',
    source: 'MEB LGS Örnek Soru',
    points: 10,
    questionText: `Dünya’nın Güneş etrafında dolanma ekseni 23° 27' eğiktir.

Buna göre, 21 Haziran tarihinde gerçekleşen olaylarla ilgili aşağıdaki ifadelerden hangisi yanlıştır?`,
    optionsCount: 4,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: 'Kuzey Yarım Küre’de en uzun gündüz yaşanır.' },
      { key: 'B', text: 'Yengeç Dönencesi’ne güneş ışınları öğle vakti dik açıyla gelir.' },
      { key: 'C', text: 'Güney Yarım Küre’de yaz mevsimi başlar.' },
      { key: 'D', text: 'Bu tarihten sonra Kuzey Yarım Küre’de gündüzler kısalmaya başlar.' },
    ],
    explanation: '21 Haziran tarihinde Güney Yarım Küre’de kış mevsimi başlar, yaz değil.',
  },
  {
    id: 'bank-fen-2',
    orderNumber: 9,
    subject: 'Fen Bilimleri',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'DNA ve Genetik Kod',
    difficulty: 'Kolay',
    source: 'MEB Kazanım Testi',
    points: 10,
    questionText: `Bir DNA molekülünün bir zincirinde 400 Adenin, 300 Guanin, 200 Sitozin ve 500 Timin nükleotidi bulunmaktadır.

Buna göre bu DNA molekülünün tamamında toplam kaç adet hidrojen bağı bulunur?`,
    optionsCount: 4,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: '3000' },
      { key: 'B', text: '3300' },
      { key: 'C', text: '2800' },
      { key: 'D', text: '4200' },
    ],
    explanation: 'Toplam Adenin = 400 + 500 = 900 çift (A-T arasında 2 bağ => 1800 bağ). Toplam Guanin = 300 + 200 = 500 çift (G-S arasında 3 bağ => 1500 bağ). Toplam = 1800 + 1500 = 3300 bağ.',
  },
  {
    id: 'bank-fen-3',
    orderNumber: 10,
    subject: 'Fen Bilimleri',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Basınç (Katı, Sıvı, Gaz)',
    difficulty: 'Orta',
    source: 'MEB Deneme Sınavı',
    points: 10,
    questionText: `Özdeş küpler kullanılarak oluşturulan K ve L düzeneklerinde yere uygulanan katı basınçları karşılaştırılmaktadır.

Buna göre katı basıncını artırmak isteyen bir araştırmacı;
I. Temas yüzey alanını azaltmalı
II. Cismin ağırlığını artırmalı
III. Yer çekimi ivmesini sıfırlamalı

işlemlerinden hangilerini tek başına uygulayabilir?`,
    optionsCount: 4,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'I ve II' },
      { key: 'B', text: 'Yalnız I' },
      { key: 'C', text: 'II ve III' },
      { key: 'D', text: 'I, II ve III' },
    ],
    explanation: 'Katı basıncı P = G / S formülüyle bulunur. Basıncı artırmak için ağırlık (G) artırılmalı veya yüzey alanı (S) küçültülmelidir.',
  },

  // TÜRKÇE - 8. SINIF (LGS)
  {
    id: 'bank-turk-1',
    orderNumber: 11,
    subject: 'Türkçe',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Paragrafta Anlam ve Ana Fikir',
    difficulty: 'Orta',
    source: 'MEB LGS Soru Havuzu',
    points: 10,
    questionText: `Kitap okumak sadece bilgi dağarcığımızı zenginleştirmez; aynı zamanda bizi başka insanların iç dünyalarına, hiç gitmediğimiz coğrafyalara ve farklı düşünüş biçimlerine taşır. İnsan, okudukça kendi sınırlarını aşar ve empati kurabilen, olgun bir bireye dönüşür.

Bu parçada asıl anlatılmak istenen düşünce aşağıdakilerden hangisidir?`,
    optionsCount: 4,
    correctAnswer: 'B',
    options: [
      { key: 'A', text: 'Kitap okuma alışkanlığı erken yaşlarda kazanılmalıdır.' },
      { key: 'B', text: 'Kitap okumak insanın iç dünyasını ve empati yeteneğini geliştirerek olgunlaştırır.' },
      { key: 'C', text: 'En etkili öğrenme yolu çok kitap okumaktır.' },
      { key: 'D', text: 'Farklı coğrafyaları tanımanın tek yolu seyahat etmektir.' },
    ],
    explanation: 'Metnin ana fikri kitap okumanın empati ve kişisel olgunlaşma üzerindeki derinleştirici etkisidir.',
  },
  {
    id: 'bank-turk-2',
    orderNumber: 12,
    subject: 'Türkçe',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Fiilimsiler (Eylemsiler)',
    difficulty: 'Kolay',
    source: 'Kazanım Değerlendirme',
    points: 10,
    questionText: `"Güneş dağların ardından doğarken köyde tatlı bir telaş başlardı."

Bu cümledeki fiilimsilerin türü ve sayısı aşağıdakilerden hangisinde doğru verilmiştir?`,
    optionsCount: 4,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: '1 Sıfat-fiil' },
      { key: 'B', text: '2 Zarf-fiil' },
      { key: 'C', text: '1 Zarf-fiil' },
      { key: 'D', text: '1 İsim-fiil' },
    ],
    explanation: '"doğarken" sözcüğü "-ken" zarf-fiil ekini almıştır. Cümlede başka fiilimsi bulunmamaktadır.',
  },

  // T.C. İNKILAP TARİHİ - 8. SINIF (LGS)
  {
    id: 'bank-ink-1',
    orderNumber: 13,
    subject: 'T.C. İnkılap Tarihi',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Milli Uyanış: Bağımsızlık Yolunda Atılan Adımlar',
    difficulty: 'Orta',
    source: 'MEB LGS Çıkmış Soru Benzeri',
    points: 10,
    questionText: `Amasya Genelgesi'nde yer alan:
"Milletin bağımsızlığını, yine milletin azim ve kararı kurtaracaktır."

maddesi ile ilgili aşağıdakilerden hangisi söylenemez?`,
    optionsCount: 4,
    correctAnswer: 'D',
    options: [
      { key: 'A', text: 'Milli Mücadele’nin yöntemi ve gerekçesi belirtilmiştir.' },
      { key: 'B', text: 'İlk kez milli egemenlik ilkesinden üstü kapalı bahsedilmiştir.' },
      { key: 'C', text: 'Kurtuluşun halkın iradesiyle gerçekleşeceği vurgulanmıştır.' },
      { key: 'D', text: 'İstanbul Hükûmeti ile tam bir iş birliği yapılmıştır.' },
    ],
    explanation: 'Amasya Genelgesi İstanbul Hükûmeti’nin teslimiyetçi tavrına karşı halkı kendi kaderini eline almaya çağıran tarihi bir başkaldırıdır.',
  },

  // İNGİLİZCE - 8. SINIF (LGS)
  {
    id: 'bank-ing-1',
    orderNumber: 14,
    subject: 'İngilizce',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Friendship',
    difficulty: 'Kolay',
    source: 'LGS Practice Test',
    points: 10,
    questionText: `David: "Are you doing anything on Saturday afternoon? Would you like to go to the cinema with us?"
Kevin: "I would love to, but I have to study for my English exam."

According to the dialogue, which of the following is CORRECT?`,
    optionsCount: 4,
    correctAnswer: 'A',
    options: [
      { key: 'A', text: 'Kevin refuses the invitation by making an excuse.' },
      { key: 'B', text: 'David refuses Kevin\'s offer.' },
      { key: 'C', text: 'Kevin accepts the invitation enthusiastically.' },
      { key: 'D', text: 'They decide to watch an action movie together.' },
    ],
    explanation: 'Kevin bir mazeret sunarak (İngilizce sınavına çalışmak zorunda olduğunu belirterek) daveti reddetmektedir.',
  },

  // DİN KÜLTÜRÜ - 8. SINIF (LGS)
  {
    id: 'bank-din-1',
    orderNumber: 15,
    subject: 'Din Kültürü',
    gradeLevel: '8. Sınıf (LGS)',
    topic: 'Kader ve Kaza İnancı',
    difficulty: 'Kolay',
    source: 'MEB Kazanım Testi',
    points: 10,
    questionText: `Aşağıdaki ayetlerden hangisi evrendeki biyolojik yasalara örnek gösterilebilir?`,
    optionsCount: 4,
    correctAnswer: 'C',
    options: [
      { key: 'A', text: '"Güneş ve Ay bir hesaba göre hareket etmektedir."' },
      { key: 'B', text: '"Denizde dağlar gibi yüzen gemiler O\'nun varlığının delillerindendir."' },
      { key: 'C', text: '"O, insanı bir kan pıhtısından (alaktan) yarattı."' },
      { key: 'D', text: '"Gece ile gündüzü birbiri ardınca getiren Allah\'tır."' },
    ],
    explanation: 'Canlıların doğumu, gelişimi ve üremesi biyolojik yasalar kapsamındadır.',
  },
];
