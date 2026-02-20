import React from 'react';
import { resolveDisplayName } from '../../../utils/nameUtils';
import { Topic } from '../../../types/forum';

interface TopicDetailModalProps {
  topic: Topic | null;
  isOpen: boolean;
  onClose: () => void;
  onUserClick: (userId: string) => void;
}

export function TopicDetailModal({ topic, isOpen, onClose, onUserClick }: TopicDetailModalProps) {
  if (!isOpen || !topic) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h1>
          <div className="flex flex-wrap gap-1 mb-3">
            {topic.tags.map((tag) => (
              <button
                key={tag}
                onClick={(e) => {
                  e.stopPropagation();
                  console.log('Hashtag clicked:', tag);
                }}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
          <p className="text-gray-700">{topic.content}</p>
          <div className="mt-4 text-sm text-gray-500">
            Posted by{' '}
            <button
              onClick={() => onUserClick(topic.author.id)}
              className="text-purple-600 hover:underline"
            >
              {resolveDisplayName(topic.author.display_name, topic.author.username)}
            </button>
          </div>
          <button
            onClick={onClose}
            className="mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Close
          </button>
        </>
      </div>
    </div>
  );
}
