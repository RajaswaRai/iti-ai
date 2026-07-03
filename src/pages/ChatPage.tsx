import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, Trash2, Send, User, MessageSquare } from "lucide-react";

// Komponen yang diintegrasikan
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";

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

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:5000/api";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const rawHistory = buildHistoryForRequest(messages, 3);
      const formattedHistory = rawHistory.map((msg) => ({
        role: msg.role === "ai" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      const response = await fetch(`${SERVER_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.content,
          history: formattedHistory,
        }),
      });

      if (!response.ok) {
        throw new Error("Server AI sedang sibuk atau bermasalah.");
      }

      const responseData = await response.json();
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
        content: "Maaf, terjadi kesalahan saat menghubungi server kampus. Pastikan backend sudah menyala.",
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

  return (
    <div className="flex h-screen flex-col bg-neutral-50 text-neutral-900 font-sans">
      
      <header className="flex-none flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 border border-teal-100">
            <Bot className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-neutral-900">AI Assistant ITI</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-teal-500"></span>
              <p className="text-xs text-neutral-500 font-medium">Online • Siap membantu</p>
            </div>
          </div>
        </div>
        {/* Implementasi Button Component[cite: 9] */}
        <Button variant="secondary" onClick={handleClearChat} className="px-4 py-2 text-sm">
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline ml-2">Bersihkan</span>
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-6" aria-live="polite" aria-label="Isi percakapan">
        {/* Implementasi Card Component[cite: 10] */}
        <Card className="mx-auto max-w-3xl border-none shadow-none bg-transparent">
          <div className="space-y-6">
            
            {messages.length === 0 && (
              // Implementasi EmptyState Component[cite: 11]
              <EmptyState 
                icon={<MessageSquare className="h-8 w-8 text-neutral-400" />} 
                text="Tanyakan informasi akademik apapun kepada AI Assistant ITI" 
              />
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex w-full ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm mt-auto">
                    {message.role === "user" ? <User className="h-4 w-4 text-neutral-600" /> : <Bot className="h-4 w-4 text-teal-600" />}
                  </div>
                  <div className={`relative px-5 py-3.5 text-sm leading-relaxed shadow-sm ${message.role === "user" ? "bg-white border border-neutral-200 text-neutral-900 rounded-2xl rounded-br-sm" : "bg-neutral-100 border border-transparent text-neutral-900 rounded-2xl rounded-bl-sm"}`}>
                    {message.role === "ai" ? (
                      <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-a:text-teal-600 hover:prose-a:text-teal-700 prose-pre:bg-neutral-800 prose-pre:text-neutral-100 prose-code:text-teal-700 prose-code:bg-teal-50 prose-code:px-1 prose-code:rounded">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    <div className={`mt-2 text-[10px] font-medium ${message.role === 'user' ? 'text-neutral-400 text-right' : 'text-neutral-400 text-left'}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex w-full justify-start">
                <div className="flex max-w-[85%] gap-3 flex-row">
                  <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm mt-auto">
                    <Bot className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="flex items-center rounded-2xl rounded-bl-sm bg-neutral-100 px-5 py-4 shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-neutral-400"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>
        </Card>
      </main>

      <footer className="flex-none bg-white border-t border-neutral-200 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl">
          <div className="relative flex items-end gap-2 bg-white border border-neutral-300 rounded-2xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanyakan sesuatu tentang akademik ITI..."
              disabled={isLoading}
              rows={1}
              className="max-h-32 min-h-11 w-full resize-none bg-transparent py-3 pl-4 pr-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-50"
            />
            {/* Implementasi Button Component[cite: 9] */}
            <Button 
              onClick={handleSendMessage} 
              disabled={isLoading || !input.trim()} 
              className="mb-1 mr-1 h-10 w-10 shrink-0 rounded-xl! px-0!"
              aria-label="Kirim pesan"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-neutral-400 mt-3 font-medium">
            AI dapat melakukan kesalahan. Harap verifikasi informasi penting ke pihak kampus.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default ChatPage;