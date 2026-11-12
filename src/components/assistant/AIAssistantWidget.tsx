import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Bot,
  User,
  ChevronRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ChatAction {
  label: string;
  target: string;
  actionType: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  actions?: ChatAction[];
  timestamp: string;
}

interface AIAssistantWidgetProps {
  currentView: string;
  onNavigateToView: (view: string) => void;
  onOpenCreateExam: () => void;
  onOpenSupportTicket?: () => void;
}

export const AIAssistantWidget: React.FC<AIAssistantWidgetProps> = ({
  currentView,
  onNavigateToView,
  onOpenCreateExam,
  onOpenSupportTicket,
}) => {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Merhaba ${
        currentUser?.name ? currentUser.name : 'Hocam'
      }! 👋 Ben **testimgeldi Asistan**.\n\nKullanım kılavuzundaki adım adım rehberlerden beslenerek soru hazırlama, optik okuma, PDF kırpma veya karne çıkarma konularında size rehberlik ederim.\n\nBilmediğim bir konu olursa sizi hemen **Sistem Yöneticisine (Süper Admin)** yönlendiririm. Ne yapmak istersiniz?`,
      actions: [
        { label: '✂️ Soru Nasıl Kırpılır?', target: 'quiz-builder', actionType: 'navigate' },
        { label: '📷 Optik Okuma Adımları', target: 'guide', actionType: 'navigate' },
        { label: '📩 Sorun / İstek Bildir', target: 'support-ticket', actionType: 'open-ticket' },
      ],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          history,
          currentRole: currentUser?.role || 'teacher',
          currentView,
        }),
      });

      const data = await res.json();

      if (data && data.reply) {
        const botMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          content: data.reply,
          actions: data.actions || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error('Yanıt alınamadı');
      }
    } catch (e) {
      console.error('Chatbot error:', e);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content:
          'Kısa bir ağ gecikmesi yaşandı. Ancak Kullanım Kılavuzu sekmesinden tüm detaylara ulaşabilir veya Test & Quiz Hazırlayıcıyı açabilirsiniz.',
        actions: [
          { label: 'Kullanım Kılavuzu', target: 'guide', actionType: 'navigate' },
          { label: 'Test & Quiz Hazırla', target: 'quiz-builder', actionType: 'navigate' },
        ],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.target === 'support-ticket' || action.actionType === 'open-ticket') {
      if (onOpenSupportTicket) {
        onOpenSupportTicket();
        setIsOpen(false);
      }
    } else if (action.target === 'create-exam') {
      onOpenCreateExam();
      setIsOpen(false);
    } else {
      onNavigateToView(action.target);
      setIsOpen(false);
    }
  };

  // Render markdown-like text (bold, newlines, lists)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          // Process bold markers (**text**)
          const parts = line.split(/(\*\*.*?\*\*)/g);

          return (
            <p key={idx}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-950">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return <span key={pIdx}>{part}</span>;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 no-print">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-200 cursor-pointer border border-indigo-400/40"
            title="testimgeldi Asistan ile konuşun"
          >
            <div className="relative">
              <Bot className="w-5 h-5 text-indigo-200 group-hover:text-white transition-colors" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-700 animate-pulse" />
            </div>
            <span className="font-bold text-xs tracking-wide pr-1 hidden sm:inline">
              testimgeldi Asistan
            </span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          </button>
        ) : null}
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 no-print">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-xs text-white">testimgeldi Asistan</h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-300">Yapay Zeka Sınav & Rehberlik Danışmanı</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Starter Suggestions Bar */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-[11px] shrink-0">
            <span className="text-slate-400 font-semibold shrink-0 pl-1">Sor:</span>
            <button
              onClick={() => handleSendMessage('Optik form kamerayla nasıl düzgün okunur?')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              📷 Optik Okuma
            </button>
            <button
              onClick={() => handleSendMessage('PDF dokümanından soru nasıl kırpılır?')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              ✂️ PDF Kırpma
            </button>
            <button
              onClick={() => handleSendMessage('Örnek soru bankasında hangi dersler var?')}
              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-full border border-slate-200 whitespace-nowrap transition-colors cursor-pointer"
            >
              📚 Soru Bankası
            </button>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-100/60">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white text-[10px] ${
                      isUser ? 'bg-indigo-600' : 'bg-slate-900'
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div>
                        {renderFormattedContent(msg.content)}

                        {/* Interactive Action Chips */}
                        {msg.actions && msg.actions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {msg.actions.map((act, aIdx) => (
                              <button
                                key={aIdx}
                                onClick={() => handleActionClick(act)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-xs"
                              >
                                <span>{act.label}</span>
                                <ChevronRight className="w-3 h-3 text-indigo-500" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <span
                      className={`text-[9px] block text-right mt-1 ${
                        isUser ? 'text-indigo-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-1.5 shadow-xs">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-[11px] ml-1">Yanıt hazırlanıyor...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="Bir soru sorun veya yönlendirme isteyin..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={loading}
                className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Gönder"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
