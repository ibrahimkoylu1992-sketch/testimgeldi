export type SupportTicketCategory =
  | 'Hata / Teknik Sorun'
  | 'Öneri & İstek'
  | 'Optik Okuma Yardımı'
  | 'Kullanıcı & Üyelik'
  | 'Diğer';

export type SupportTicketStatus = 'pending' | 'in_progress' | 'resolved';

export interface SupportTicket {
  id: string;
  title: string;
  category: SupportTicketCategory;
  email: string;
  userName: string;
  userRole?: string;
  userId?: string;
  message: string;
  attachmentDataUrl?: string; // base64 preview of attached screenshot or document
  attachmentName?: string;
  createdAt: string;
  status: SupportTicketStatus;
  adminNote?: string;
}
