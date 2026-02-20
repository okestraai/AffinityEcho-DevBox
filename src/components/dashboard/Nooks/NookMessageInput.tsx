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
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
          {userAvatar || '?'}
        </div>
        <div className="flex-1">
          <MentionTextarea
            value={message}
            onChange={setMessage}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={parentMessageId ? "Write a reply... Use @ to mention" : "Share your thoughts anonymously... Use @ to mention"}
            rows={3}
            disabled={sending}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none bg-gray-50 focus:bg-white transition-all disabled:opacity-50"
          />
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="w-3 h-3" />
              <span>Completely anonymous • Auto-deletes in {timeLeft}</span>
            </div>
            <button 
              onClick={handleSubmit}
              disabled={!message.trim() || sending}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
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