'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send } from 'lucide-react';
import { useState } from 'react';

interface ChatAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatAssistant({ isOpen, onToggle }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'Hello! I\'m your AI assistant. How can I help optimize your videos today?' },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages([...messages, { role: 'user', content: input }]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I can help you analyze your video performance, suggest improvements, and answer questions about viral content optimization. What would you like to know?',
        },
      ]);
    }, 1000);
  };

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={onToggle}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#FF0000] text-white rounded-full shadow-lg hover:bg-[#CC0000] transition-colors flex items-center justify-center z-50"
        >
          <MessageCircle className="w-6 h-6" />
        </motion.button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 w-96 h-[600px] bg-[#181818] border border-[#212121] rounded-xl shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#212121]">
              <h3 className="font-bold text-white">AI Assistant</h3>
              <button
                onClick={onToggle}
                className="p-2 rounded-lg hover:bg-[#212121] transition-colors"
              >
                <X className="w-5 h-5 text-[#AAAAAA]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-[#FF0000] text-white'
                        : 'bg-[#212121] text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-[#212121]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-[#212121] rounded-lg bg-[#0F0F0F] text-white focus:outline-none focus:ring-2 focus:ring-[#FF0000]"
                />
                <button
                  onClick={handleSend}
                  className="p-2 bg-[#FF0000] text-white rounded-lg hover:bg-[#CC0000] transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
