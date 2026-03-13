import { useState, useRef, useEffect } from "react";
import { callGeminiAPIWithRetry } from "../utils/ai";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const fullPrompt =
        messages
          .map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`)
          .join("\n") + `\nUser: ${userMessage.content}`;

      const aiResponse = await callGeminiAPIWithRetry(fullPrompt);

      const aiMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: aiResponse || "Tidak ada respons dari AI.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
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

  const handleNewChat = () => {
    setMessages([]);
  };

  return (
    <div className="chat-container">
      <div className="app-layout">
        <aside className="sidebar" aria-label="Navigasi">
          <button
            className="new-chat-btn"
            type="button"
            onClick={handleNewChat}
          >
            + Chat baru
          </button>
          <div className="sidebar-divider" />
          <div className="sidebar-empty">
            <p className="sidebar-empty-text">
              Mulai percakapan untuk melihat riwayat di sini.
            </p>
          </div>
        </aside>

        <main className="chat-main">
          <div className="chat-frame" role="main" aria-label="Obrolan AI">
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-left">
                <div className="chat-avatar" aria-hidden="true">
                  🤖
                </div>
                <div className="chat-header-info">
                  <h1>AI Assistant</h1>
                  <p>Online • Siap membantu</p>
                </div>
              </div>
              <div className="chat-header-actions">
                <button
                  className="header-btn"
                  onClick={handleClearChat}
                  title="Hapus percakapan"
                  aria-label="Hapus percakapan"
                  type="button"
                >
                  🗑️
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
                  <p>Tanyakan apapun kepada AI Assistant</p>
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
                    <div className="message-time">
                      {formatTime(message.timestamp)}
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
                  placeholder="Ketik pesan Anda..."
                  disabled={isLoading}
                  rows={1}
                  aria-label="Tulis pesan"
                  autoFocus
                />
                <div className="input-actions">
                  <button
                    className="input-action-btn"
                    title="Format bold"
                    type="button"
                  >
                    B
                  </button>
                </div>
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
