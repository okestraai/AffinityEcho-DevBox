import React, { useState } from 'react';
import { Shield, Send } from 'lucide-react';
import { MentionTextarea } from '../../shared/MentionTextarea';

interface NookMessageInputProps {
  nookId: string;
  userAvatar: string;
  timeLeft: string;
  onSendMessage: (content: string) => Promise<void>;
  parentMessageId?: string;
}

export function NookMessageInput({ 
  nookId, 
  userAvatar, 
  timeLeft, 
  onSendMessage,
  parentMessageId 
}: NookMessageInputProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (message.trim() && !sending) {
      setSending(true);
      try {
        await onSendMessage(message.trim());
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-6">
      <div className="flex items-start gap-2 sm:gap-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white text-sm sm:text-base font-bold shadow-md flex-shrink-0">
          {userAvatar || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <MentionTextarea
            value={message}
            onChange={setMessage}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={parentMessageId ? "Write a reply... Use @ to mention" : "Share your thoughts anonymously..."}
            rows={3}
            disabled={sending}
            className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50 text-sm sm:text-base"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-2 sm:mt-3 gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3 flex-shrink-0" />
              <span className="hidden sm:inline">Completely anonymous • Auto-deletes in {timeLeft}</span>
              <span className="sm:hidden">Anonymous • {timeLeft}</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || sending}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none min-h-[44px] sm:min-h-0 w-full sm:w-auto justify-center text-sm sm:text-base"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}