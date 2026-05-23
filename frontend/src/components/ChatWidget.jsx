import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Database, Clock, Server } from 'lucide-react';
import api from '../api/axios';

const SUGGESTED_QUESTIONS = [
  "Summarize all alerts from the last hour",
  "What is the current CPU and memory status?",
  "Show me recent error logs",
  "Why did the last anomaly alert trigger?",
  "Which server has the highest resource usage?",
];

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your **NexusOps AI Assistant**. I can analyze your infrastructure data in real-time.\n\nAsk me about server metrics, logs, alerts, or anomalies — I\'ll query your MongoDB and give you a plain-English answer.',
      context: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, context: null }]);
    setLoading(true);

    try {
      const { data } = await api.post('/api/chat', { message: userMsg });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data.reply,
          context: data.data.context,
        },
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        'Failed to get a response. Make sure your GEMINI_API_KEY is set in the backend .env file.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${errorMsg}`, context: null },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Simple markdown-like rendering for bold text and bullet points
  const renderContent = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold
      const boldParsed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      const isBullet = /^\s*[-•]\s/.test(line);

      if (line.trim() === '') return <br key={i} />;

      return (
        <p
          key={i}
          className={`${isBullet ? 'pl-4' : ''} mb-1`}
          dangerouslySetInnerHTML={{ __html: boldParsed }}
        />
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-foreground text-background flex items-center justify-center border-4 border-foreground hover:bg-background hover:text-foreground transition-none shadow-none"
        title="AI Assistant"
      >
        {isOpen ? <X size={24} strokeWidth={2} /> : <MessageSquare size={24} strokeWidth={2} />}
      </button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-24 right-6 z-50 w-[420px] max-h-[600px] bg-background border-4 border-foreground flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-4 border-foreground bg-foreground text-background">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-background text-foreground flex items-center justify-center">
                  <Sparkles size={18} strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest font-mono">NexusOps AI</h3>
                  <p className="text-[10px] uppercase tracking-widest opacity-70">Infrastructure Assistant</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-background hover:text-muted transition-none"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-7 h-7 shrink-0 flex items-center justify-center border-2 border-foreground ${
                    msg.role === 'assistant' ? 'bg-foreground text-background' : 'bg-background text-foreground'
                  }`}>
                    {msg.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex-1 min-w-0 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block text-left px-3 py-2 text-sm font-mono leading-relaxed border-2 ${
                      msg.role === 'assistant'
                        ? 'bg-muted text-foreground border-border'
                        : 'bg-foreground text-background border-foreground'
                    }`}>
                      {renderContent(msg.content)}
                    </div>

                    {/* Context metadata */}
                    {msg.context && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.context.logsFound > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-mutedForeground border border-border px-2 py-0.5">
                            <Database size={10} /> {msg.context.logsFound} logs
                          </span>
                        )}
                        {msg.context.metricsFound > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-mutedForeground border border-border px-2 py-0.5">
                            <Server size={10} /> {msg.context.metricsFound} metrics
                          </span>
                        )}
                        {msg.context.alertsFound > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-mutedForeground border border-border px-2 py-0.5">
                            <Clock size={10} /> {msg.context.alertsFound} alerts
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-7 h-7 shrink-0 flex items-center justify-center border-2 border-foreground bg-foreground text-background">
                    <Bot size={14} />
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-2 bg-muted border-2 border-border text-sm font-mono text-mutedForeground">
                    <Loader2 size={14} className="animate-spin" />
                    Analyzing infrastructure data...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggested questions — only show if there are very few messages */}
            {messages.length <= 2 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 border border-border text-mutedForeground hover:border-foreground hover:text-foreground transition-none"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t-4 border-foreground p-3 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your infrastructure..."
                disabled={loading}
                className="flex-1 bg-background border-2 border-border text-foreground px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground transition-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="w-10 h-10 bg-foreground text-background flex items-center justify-center border-2 border-foreground hover:bg-background hover:text-foreground disabled:opacity-30 disabled:hover:bg-foreground disabled:hover:text-background transition-none"
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
