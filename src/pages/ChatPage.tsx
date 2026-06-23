import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./ChatPage.css";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState<{ messageId: number; rating: number; userMessage: string; comment: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mengambil URL Backend dari file .env (Vite)
  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [input]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildHistoryForRequest = (
    currentMessages: Message[],
    maxTurns = 3
  ) => {
    // Keep the last `maxTurns` rounds (user + AI), to keep prompt size reasonable.
    return currentMessages.slice(-maxTurns * 2);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    // Tambahkan pesan user ke layar
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      // Ambil history percakapan sebelumnya (tidak termasuk pesan yang baru diketik)
      const rawHistory = buildHistoryForRequest(messages, 3);
      
      // Format history sesuai dengan yang diminta oleh Backend Express kita
      const formattedHistory = rawHistory.map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      // 🚀 HUBUNGKAN KE BACKEND EXPRESS
      const response = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: formattedHistory
        }),
      });

      if (!response.ok) {
        throw new Error("Server AI sedang sibuk atau bermasalah.");
      }

      const responseData = await response.json();
      
      // Mengambil balasan dari struktur JSON yang dikirim backend: { success: true, data: { reply: "..." } }
      const aiResponseText = responseData.data?.reply || "Maaf, tidak ada respons yang valid dari server.";

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: aiResponseText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: "Maaf, terjadi kesalahan koneksi ke server. coba lagi nanti.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.error("AI Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua percakapan?")) {
      setMessages([]);
    }
  };

  const openFeedbackForm = (messageId: number, rating: number) => {
    const index = messages.findIndex(m => m.id === messageId);
    let userMessageText = "";
    if (index > 0 && messages[index - 1].role === "user") {
       userMessageText = messages[index - 1].content;
    }
    setActiveFeedback({ messageId, rating, userMessage: userMessageText, comment: "" });
  };

  const cancelFeedback = () => setActiveFeedback(null);

  const submitFeedback = async () => {
    if (!activeFeedback) return;
    try {
      await fetch(`${SERVER_URL}/chat/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId: activeFeedback.messageId.toString(),
          rating: activeFeedback.rating,
          userMessage: activeFeedback.userMessage,
          comment: activeFeedback.comment,
        }),
      });
      alert(activeFeedback.rating === 1 ? "Terima kasih atas feedback positifnya!" : "Terima kasih, ulasan Anda akan membantu kami berkembang.");
      setActiveFeedback(null);
    } catch (error) {
      console.error("Gagal mengirim feedback", error);
    }
  };

  return (
    <div className="chat-container">
      <div className="app-layout">
        {/* OPTIONAL: Jika kamu ingin memunculkan kembali sidebar, tinggal uncomment bagian ini */}
        {/* <aside className="sidebar">
           <button className="new-chat-btn" onClick={handleClearChat}>+ Chat Baru</button>
        </aside> */}

        <main className="chat-main">
          <div className="chat-frame" role="main" aria-label="Obrolan AI">
            
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-avatar" aria-hidden="true">
                  🤖
                </div>
                <div className="chat-header-info">
                  <h1>AI Assistant ITI</h1>
                  <p>Online • Siap membantu mahasiswa</p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button className="header-btn" onClick={handleClearChat} title="Bersihkan Obrolan">
                  🧹 Bersihkan
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="chat-messages"
              aria-live="polite"
              aria-label="Isi percakapan"
            >
              {messages.length === 0 && (
                <div className="chat-empty">
                  <div className="chat-empty-icon" aria-hidden="true">
                    💬
                  </div>
                  <h3>Selamat Datang!</h3>
                  <p>Tanyakan informasi akademik apapun kepada AI Assistant ITI</p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`message message-${message.role}`}
                  aria-label={
                    message.role === "user"
                      ? `Pesan Anda, ${formatTime(message.timestamp)}`
                      : `Balasan AI, ${formatTime(message.timestamp)}`
                  }
                >
                  <div className="message-avatar" aria-hidden="true">
                    {message.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-bubble">
                    {message.role === "ai" ? (
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    ) : (
                      message.content
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: message.role === 'ai' ? '1px solid rgba(0,0,0,0.05)' : 'none', paddingTop: message.role === 'ai' ? '8px' : '0' }}>
                      <div className="message-time" style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>
                        {formatTime(message.timestamp)}
                      </div>
                      
                      {message.role === "ai" && (
                        <div className="message-feedback" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              onClick={() => openFeedbackForm(message.id, 1)} 
                              title="Jawaban bagus" 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5, padding: '4px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                              onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
                            >👍</button>
                            <button 
                              onClick={() => openFeedbackForm(message.id, -1)} 
                              title="Jawaban buruk" 
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5, padding: '4px', borderRadius: '4px', transition: 'all 0.2s ease' }}
                              onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                              onMouseOut={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
                            >👎</button>
                          </div>
                          
                          {activeFeedback?.messageId === message.id && (
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                <textarea 
                                  placeholder="Ketik komentar, keluhan, atau saran Anda di sini..." 
                                  value={activeFeedback.comment}
                                  onChange={(e) => setActiveFeedback({...activeFeedback, comment: e.target.value})}
                                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.9rem', resize: 'vertical', minHeight: '60px', fontFamily: 'inherit', outline: 'none' }}
                                />
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                   <button onClick={cancelFeedback} style={{ padding: '6px 12px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '4px', color: '#555' }}>Batal</button>
                                   <button onClick={submitFeedback} style={{ padding: '6px 12px', cursor: 'pointer', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Kirim Ulasan</button>
                                </div>
                             </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="typing-indicator">
                  <div className="message-avatar" aria-hidden="true">
                    🤖
                  </div>
                  <div
                    className="typing-bubble"
                    aria-label="AI sedang mengetik"
                  >
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chat-input-container">
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ketik pertanyaan akademik Anda..."
                  disabled={isLoading}
                  rows={1}
                  aria-label="Tulis pesan"
                  autoFocus
                />
              </div>
              <button
                className="chat-send-button"
                onClick={handleSendMessage}
                disabled={isLoading || !input.trim()}
                type="button"
              >
                <span className="send-icon">➤</span>
                Kirim
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ChatPage;